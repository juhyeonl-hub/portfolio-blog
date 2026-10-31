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
    // Only members who have published builds are discoverable; never enumerate private-only accounts.
    public Listing authors(String query,int page) {
        if(query.length()>32||page<0||page>10000)bad("검색 조건을 확인하세요.");
        String search="%"+query.trim().toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%";
        String from=" FROM shadowcraft_members m JOIN shadowcraft_public_builds b ON b.author_id=m.id WHERE b.published=TRUE AND LOWER(m.username) LIKE ? ESCAPE '!'";
        Long count=jdbc.queryForObject("SELECT COUNT(DISTINCT m.id)"+from,Long.class,search);
        var rows=jdbc.query("SELECT m.id,m.username,COUNT(*) AS builds"+from+" GROUP BY m.id,m.username ORDER BY LOWER(m.username),m.id LIMIT 20 OFFSET ?",(r,n)->mapper.createObjectNode().put("id",r.getString("id")).put("name",r.getString("username")).put("builds",r.getLong("builds")),search,page*20);
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
        if(!request.path("title").isTextual()||request.path("title").asText().trim().isEmpty()||request.path("title").asText().length()>80)bad("제목은 1~80자로 입력해 주세요.");
        if(!request.path("description").isTextual()||request.path("description").asText().length()>2000)bad("설명은 2,000자 이하로 입력해 주세요.");
        if(!request.path("published").isBoolean())bad("게시물의 공개 설정을 확인하지 못했습니다. 작성 내용을 따로 보관한 뒤 페이지를 새로고침해 주세요.");
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
            if(!request.path("revision").isIntegralNumber()||!request.path("revision").canConvertToLong()||request.path("revision").asLong()<0)bad("게시물의 저장 상태를 확인하지 못했습니다. 수정 중인 내용이 있다면 따로 보관한 뒤 최신 게시물을 다시 불러오세요.");
            int changed=jdbc.update("UPDATE shadowcraft_public_builds SET title=?,description=?,class_key=?,catalog_version=?,payload=?,published=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?",title,description,key,version,payload,published,now,id,request.path("revision").asLong());
            if(changed!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"다른 창에서 수정됐습니다. 최신 내용을 다시 불러오세요.");
        }
        return get(id,true);
    }
    @Transactional
    public void delete(String id,long revision) {
        validId(id);get(id,true);
        if(revision<0)bad("게시물의 저장 상태를 확인하지 못했습니다. 수정 중인 내용이 있다면 따로 보관한 뒤 최신 게시물을 다시 불러오세요.");
        if(jdbc.update("DELETE FROM shadowcraft_public_builds WHERE id=? AND revision=?",id,revision)!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,"다른 창에서 수정됐습니다. 최신 내용을 다시 불러오세요.");
    }
    private void validate(JsonNode shared) throws Exception {
        only(shared,Set.of("schema","catalogVersion","plan","guide"));
        if(shared.has("guide"))validateGuide(shared.path("guide"));
        if(!shared.path("schema").asText().equals("a2bc-share-v1")||!shared.path("catalogVersion").isTextual()||shared.path("catalogVersion").asText().isEmpty()||shared.path("catalogVersion").asText().length()>100)bad("공유 형식을 확인하세요.");
        JsonNode p=shared.path("plan");only(p,Set.of("classKey","level","mode","extraSP","extraStigma","extraCrystal","extraBattle","base","bonus","specs","nodes","checked","character","pointBudget","ascensionGrade3Confirmed","stigmaSkills"));
        String key=p.path("classKey").asText();catalogs.profile(key);
        if(!number(p.path("level"),1,45)||!Set.of("safe","damage","pvp").contains(p.path("mode").asText()))bad("공개할 빌드의 레벨과 플레이 목적을 확인해 주세요.");
        if(!p.path("character").isNull()||!p.path("checked").isArray()||!p.path("checked").isEmpty())bad("공개 빌드에는 연결한 캐릭터와 개인 완료 기록을 포함할 수 없습니다. 빌드 편집 화면에서 다시 저장해 주세요.");
        for(String field:List.of("extraSP","extraStigma","extraCrystal","extraBattle"))if(!number(p.path(field),0,9999))bad("포인트를 확인하세요.");
        if(p.has("ascensionGrade3Confirmed")&&!p.path("ascensionGrade3Confirmed").isBoolean())bad("승급 확인값을 확인하세요.");
        if(p.path("pointBudget").has("ariel")&&!number(p.path("pointBudget").path("ariel"),0,9999))bad("아리엘 포인트를 확인하세요.");
        if(p.has("pointBudget")){only(p.path("pointBudget"),Set.of("sp","stigma","crystal","battle","ariel"));for(String field:List.of("sp","stigma","crystal","battle"))if(!number(p.path("pointBudget").path(field),0,9999))bad("포인트 예산을 확인하세요.");}
        JsonNode catalog=catalogs.catalog(key).path("catalog");Map<String,Set<String>> skills=new HashMap<>();Set<String> nodes=new HashSet<>();
        for(JsonNode skill:catalog.path("skills")){Set<String> specs=new HashSet<>();skill.path("specializations").forEach(s->specs.add(s.path("id").asText()));skills.put(skill.path("id").asText(),specs);}
        for(JsonNode board:catalog.path("boards"))board.path("nodes").forEach(n->nodes.add(n.path("id").asText()));
        for(String field:List.of("base","bonus","specs")) {
            JsonNode values=p.path(field);if(!values.isObject()||values.size()>100)bad("스킬 배분을 확인하세요.");
            var entries=values.fields();while(entries.hasNext()){var entry=entries.next();if(!skills.containsKey(entry.getKey()))bad("알 수 없는 스킬입니다.");if(field.equals("specs"))ids(entry.getValue(),skills.get(entry.getKey()));else if(!number(entry.getValue(),0,9999))bad("스킬 레벨을 확인하세요.");}
        }
        ids(p.path("nodes"),nodes);
        if(p.has("stigmaSkills")){Set<String> stigma=new HashSet<>();for(JsonNode skill:catalog.path("skills"))if(skill.path("stigma").asBoolean())stigma.add(skill.path("id").asText());ids(p.path("stigmaSkills"),stigma);if(p.path("stigmaSkills").size()>4)bad("스티그마 선택을 확인하세요.");}
    }
    private void validateGuide(JsonNode guide){
        only(guide,Set.of("skills","daevanion","equipment","items"));
        for(String key:List.of("skills","daevanion","equipment"))guideText(guide.path(key),600);
        Set<String> allowed=Set.of("MainHand","SubHand","Helmet","Torso","Pants","Shoulder","Gloves","Boots","Cape","Belt","Necklace","Earring1","Earring2","Ring1","Ring2","Bracelet1","Bracelet2","Rune1","Rune2","Amulet","Arcana1","Arcana2","Arcana3","Arcana4","Arcana5"),seen=new HashSet<>();
        var items=guide.path("items");if(!items.isArray()||items.size()>allowed.size())bad("추천 장비 내용을 확인하세요.");
        for(JsonNode item:items){only(item,Set.of("slot","name","upgrade","options","reason"));if(!item.path("slot").isTextual()||!allowed.contains(item.path("slot").asText())||!seen.add(item.path("slot").asText()))bad("추천 장비 부위를 확인하세요.");for(String key:List.of("name","upgrade","options","reason"))guideText(item.path(key),key.equals("name")||key.equals("upgrade")?80:240);if(item.path("name").asText().trim().isEmpty())bad("추천 장비 이름을 입력하세요.");}
    }
    private static void guideText(JsonNode value,int max){if(!value.isTextual()||value.asText().length()>max)bad("빌드 작성 내용을 확인하세요.");if(ContentPolicy.blocked(value.asText()))bad("부적절한 표현이 포함되어 있습니다. 수정한 뒤 다시 시도하세요.");}
    private void ids(JsonNode values,Set<String> allowed) {
        if(!values.isArray()||values.size()>1000)bad("노드·특화 목록을 확인하세요.");Set<String> seen=new HashSet<>();
        for(JsonNode value:values)if(!value.isTextual()||!allowed.contains(value.asText())||!seen.add(value.asText()))bad("알 수 없거나 중복된 노드·특화입니다.");
    }
    private static boolean number(JsonNode value,int min,int max){return value.isIntegralNumber()&&value.canConvertToInt()&&value.asInt()>=min&&value.asInt()<=max;}
    private static void only(JsonNode value,Set<String> keys){if(value==null||!value.isObject())bad("빌드 데이터를 읽을 수 없습니다. 작성 내용을 남겨 두고 빌드를 다시 불러오세요.");value.fieldNames().forEachRemaining(k->{if(!keys.contains(k))bad("빌드에 읽을 수 없는 항목이 있습니다. 빌드 편집 화면에서 다시 저장해 주세요.");});}
    private static void validId(String id){if(!id.matches("[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"))bad("빌드 ID를 확인하세요.");}
    private static void bad(String message){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
}
