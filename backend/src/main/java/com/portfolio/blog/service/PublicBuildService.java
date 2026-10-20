package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.sql.Timestamp;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PublicBuildService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final ShadowcraftService catalogs;
    public PublicBuildService(JdbcTemplate jdbc,ObjectMapper mapper,ShadowcraftService catalogs) {
        this.jdbc=jdbc;this.mapper=mapper;this.catalogs=catalogs;
    }
    public record Listing(List<ObjectNode> items,int page,long totalElements,long totalPages) {}
    public Listing list(boolean admin,String key,String query,int page) {
        return list(admin,key,query,page,"","latest");
    }
    public Listing list(boolean admin,String key,String query,int page,String author,String sort) {
        if(!author.isEmpty())validId(author);
        if(!Set.of("latest","votes").contains(sort))bad("정렬 조건을 확인하세요.");
        if(page<0||page>10000||query.length()>80)bad("검색 조건을 확인하세요.");
        if(!key.isEmpty())catalogs.profile(key);
        String where=" WHERE (? = TRUE OR published = TRUE) AND (? = '' OR class_key = ?) AND LOWER(title) LIKE ? ESCAPE '!' AND (? = '' OR author_id = ?)";
        String search="%"+query.toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%";
        Long count=jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_public_builds"+where,Long.class,admin,key,key,search,author,author);
        var rows=jdbc.query("SELECT b.*, (SELECT username FROM shadowcraft_members WHERE id=b.author_id) AS author, (SELECT COUNT(*) FROM shadowcraft_build_votes WHERE build_id=b.id) AS votes FROM shadowcraft_public_builds b"+where+(sort.equals("votes")?" ORDER BY votes DESC,updated_at DESC,id":" ORDER BY updated_at DESC,id")+" LIMIT 20 OFFSET ?",(r,n)->{
            ObjectNode row=mapper.createObjectNode();row.put("authorId",r.getString("author_id")).put("author",r.getString("author")).put("votes",r.getLong("votes"));row.put("id",r.getString("id")).put("title",r.getString("title")).put("description",r.getString("description")).put("classKey",r.getString("class_key")).put("catalogVersion",r.getString("catalog_version")).put("published",r.getBoolean("published")).put("revision",r.getLong("revision")).put("updatedAt",r.getTimestamp("updated_at").toInstant().toString());return row;
        },admin,key,key,search,author,author,page*20);
        return new Listing(rows,page,count==null?0:count,count==null?0:(count+19)/20);
    }
    public ObjectNode get(String id,boolean admin) {
        validId(id);
        var rows=jdbc.query("SELECT b.*, (SELECT username FROM shadowcraft_members WHERE id=b.author_id) AS author, (SELECT COUNT(*) FROM shadowcraft_build_votes WHERE build_id=b.id) AS votes FROM shadowcraft_public_builds b WHERE id = ? AND (? = TRUE OR published = TRUE)",(r,n)->{
            ObjectNode row=mapper.createObjectNode();row.put("authorId",r.getString("author_id")).put("author",r.getString("author")).put("votes",r.getLong("votes"));row.put("id",id).put("title",r.getString("title")).put("description",r.getString("description")).put("published",r.getBoolean("published")).put("revision",r.getLong("revision")).put("updatedAt",r.getTimestamp("updated_at").toInstant().toString());
            try {row.set("shared",mapper.readTree(r.getString("payload")));}catch(Exception e){throw new IllegalStateException("Stored build unavailable");}return row;
        },id,admin);
        if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"공개된 빌드를 찾을 수 없습니다.");
        return rows.getFirst();
    }
    @Transactional
    public ObjectNode save(String id,JsonNode request) throws Exception {
        only(request,Set.of("title","description","published","revision","shared"));
        if(!request.path("title").isTextual()||request.path("title").asText().trim().isEmpty()||request.path("title").asText().length()>80||!request.path("description").isTextual()||request.path("description").asText().length()>2000||!request.path("published").isBoolean())bad("제목·설명·공개 여부를 확인하세요.");
        // New or edited titles and descriptions must not contain offensive, extremist or political terms.
        if(ContentPolicy.blocked(request.path("title").asText())||ContentPolicy.blocked(request.path("description").asText()))bad("부적절한 표현이 포함되어 있습니다. 수정한 뒤 다시 시도하세요.");
        JsonNode shared=request.path("shared");validate(shared);
        String payload=mapper.writeValueAsString(shared);
        // Same maximum as the browser share codec: 18,000 UTF-8 bytes -> 24,000 base64 characters.
        if(payload.getBytes(StandardCharsets.UTF_8).length>18000)bad("공유 빌드 용량 제한을 초과했습니다.");
        String title=request.path("title").asText().trim(),description=request.path("description").asText(),key=shared.path("plan").path("classKey").asText(),version=shared.path("catalogVersion").asText();
        boolean published=request.path("published").asBoolean();Timestamp now=Timestamp.from(Instant.now());
        if(id==null){id=UUID.randomUUID().toString();jdbc.update("INSERT INTO shadowcraft_public_builds(id,title,description,class_key,catalog_version,payload,published,revision,updated_at) VALUES (?,?,?,?,?,?,?,0,?)",id,title,description,key,version,payload,published,now);}
        else {
            validId(id);get(id,true);
            if(!request.path("revision").isIntegralNumber()||!request.path("revision").canConvertToLong()||request.path("revision").asLong()<0)bad("수정 버전을 확인하세요.");
            int changed=jdbc.update("UPDATE shadowcraft_public_builds SET title=?,description=?,class_key=?,catalog_version=?,payload=?,published=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?",title,description,key,version,payload,published,now,id,request.path("revision").asLong());
            if(changed!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"다른 창에서 수정됐습니다. 최신 내용을 다시 불러오세요.");
        }
        return get(id,true);
    }
    @Transactional
    public void delete(String id,long revision) {
        validId(id);get(id,true);
        if(revision<0)bad("수정 버전을 확인하세요.");
        if(jdbc.update("DELETE FROM shadowcraft_public_builds WHERE id=? AND revision=?",id,revision)!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"다른 창에서 수정됐습니다. 최신 내용을 다시 불러오세요.");
    }
    private void validate(JsonNode shared) throws Exception {
        only(shared,Set.of("schema","catalogVersion","plan"));
        if(!shared.path("schema").asText().equals("a2bc-share-v1")||!shared.path("catalogVersion").isTextual()||shared.path("catalogVersion").asText().isEmpty()||shared.path("catalogVersion").asText().length()>100)bad("공유 형식을 확인하세요.");
        JsonNode p=shared.path("plan");only(p,Set.of("classKey","level","mode","extraSP","extraStigma","extraCrystal","extraBattle","base","bonus","specs","nodes","checked","character","pointBudget","ascensionGrade3Confirmed"));
        String key=p.path("classKey").asText();catalogs.profile(key);
        if(!number(p.path("level"),1,45)||!Set.of("safe","damage","pvp").contains(p.path("mode").asText())||!p.path("character").isNull()||!p.path("checked").isArray()||!p.path("checked").isEmpty())bad("개인정보를 제외한 공유 배분이 필요합니다.");
        for(String field:List.of("extraSP","extraStigma","extraCrystal","extraBattle"))if(!number(p.path(field),0,9999))bad("포인트를 확인하세요.");
        if(p.has("ascensionGrade3Confirmed")&&!p.path("ascensionGrade3Confirmed").isBoolean())bad("승급 확인값을 확인하세요.");
        if(p.has("pointBudget")){only(p.path("pointBudget"),Set.of("sp","stigma","crystal","battle"));for(String field:List.of("sp","stigma","crystal","battle"))if(!number(p.path("pointBudget").path(field),0,9999))bad("포인트 예산을 확인하세요.");}
        JsonNode catalog=catalogs.catalog(key).path("catalog");Map<String,Set<String>> skills=new HashMap<>();Set<String> nodes=new HashSet<>();
        for(JsonNode skill:catalog.path("skills")){Set<String> specs=new HashSet<>();skill.path("specializations").forEach(s->specs.add(s.path("id").asText()));skills.put(skill.path("id").asText(),specs);}
        for(JsonNode board:catalog.path("boards"))board.path("nodes").forEach(n->nodes.add(n.path("id").asText()));
        for(String field:List.of("base","bonus","specs")) {
            JsonNode values=p.path(field);if(!values.isObject()||values.size()>100)bad("스킬 배분을 확인하세요.");
            var entries=values.fields();while(entries.hasNext()){var entry=entries.next();if(!skills.containsKey(entry.getKey()))bad("알 수 없는 스킬입니다.");if(field.equals("specs"))ids(entry.getValue(),skills.get(entry.getKey()));else if(!number(entry.getValue(),0,9999))bad("스킬 레벨을 확인하세요.");}
        }
        ids(p.path("nodes"),nodes);
    }
    private void ids(JsonNode values,Set<String> allowed) {
        if(!values.isArray()||values.size()>1000)bad("노드·특화 목록을 확인하세요.");Set<String> seen=new HashSet<>();
        for(JsonNode value:values)if(!value.isTextual()||!allowed.contains(value.asText())||!seen.add(value.asText()))bad("알 수 없거나 중복된 노드·특화입니다.");
    }
    private static boolean number(JsonNode value,int min,int max){return value.isIntegralNumber()&&value.canConvertToInt()&&value.asInt()>=min&&value.asInt()<=max;}
    private static void only(JsonNode value,Set<String> keys){if(value==null||!value.isObject())bad("JSON 객체가 필요합니다.");value.fieldNames().forEachRemaining(k->{if(!keys.contains(k))bad("허용되지 않는 필드입니다: "+k);});}
    private static void validId(String id){if(!id.matches("[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"))bad("빌드 ID를 확인하세요.");}
    private static void bad(String message){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
}
