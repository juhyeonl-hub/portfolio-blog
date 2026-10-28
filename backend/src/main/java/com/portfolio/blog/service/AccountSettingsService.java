package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.math.BigInteger;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountSettingsService {
    public static final int MAX_BYTES = 1_000_000;
    private static final Set<String> CLASSES = Set.of("assassin","gladiator","templar","ranger","sorcerer","elementalist","cleric","chanter");
    private static final Set<String> PLAN_FIELDS = Set.of("classKey","level","mode","base","bonus","specs","nodes","checked","extraSP","extraStigma","extraCrystal","extraBattle","pointBudget","confirmedRemaining","confirmedRemainingContext","ascensionGrade3Confirmed","stigmaSkills","macroExtra","character","gear");
    private static final Set<String> TIMERS = Set.of("shugo","invasion","rift","gartua","lagta","kashapa","tartan");
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    public AccountSettingsService(JdbcTemplate jdbc,ObjectMapper mapper){this.jdbc=jdbc;this.mapper=mapper;}

    public JsonNode get(String member){
        var rows=jdbc.query("SELECT schema_version,revision,payload,updated_at FROM shadowcraft_account_settings WHERE member_id=?",(rs,index)->{
            var out=mapper.createObjectNode().put("version",rs.getInt("schema_version")).put("revision",rs.getLong("revision"));
            out.put("updatedAt",rs.getTimestamp("updated_at").toInstant().toString());
            out.set("entries",parse(rs.getString("payload")));
            return out;
        },member);
        if(rows.isEmpty())return mapper.createObjectNode().put("version",1).put("revision",0).set("entries",mapper.createObjectNode());
        return rows.getFirst();
    }
    @Transactional
    public JsonNode save(String member,JsonNode input){
        validate(input);
        // Lock the existing member row so concurrent first saves cannot both insert revision 1.
        var members=jdbc.queryForList("SELECT id FROM shadowcraft_members WHERE id=? FOR UPDATE",String.class,member);
        if(members.isEmpty())throw new ResponseStatusException(HttpStatus.FORBIDDEN,"로그인이 필요합니다.");
        long current=get(member).path("revision").asLong();
        if(current!=input.path("revision").longValue())throw new ResponseStatusException(HttpStatus.CONFLICT,"다른 기기의 설정이 변경되었습니다. 다시 동기화하세요.");
        long next=current+1;
        String payload=input.path("entries").toString();
        if(current==0)jdbc.update("INSERT INTO shadowcraft_account_settings(member_id,schema_version,revision,payload,updated_at) VALUES (?,1,?,?,CURRENT_TIMESTAMP)",member,next,payload);
        else jdbc.update("UPDATE shadowcraft_account_settings SET schema_version=1,revision=?,payload=?,updated_at=CURRENT_TIMESTAMP WHERE member_id=?",next,payload,member);
        return get(member);
    }
    private JsonNode parse(String raw){try{return mapper.readTree(raw);}catch(Exception e){throw bad();}}
    private ResponseStatusException bad(){return new ResponseStatusException(HttpStatus.BAD_REQUEST,"설정 형식 또는 버전을 확인하세요.");}
    private void require(boolean test){if(!test)throw bad();}
    private void fields(JsonNode n,Set<String> allowed){require(n!=null&&n.isObject());n.fieldNames().forEachRemaining(k->require(allowed.contains(k)));}
    private boolean integer(JsonNode n,int min,int max){return n!=null&&n.isIntegralNumber()&&n.canConvertToInt()&&n.intValue()>=min&&n.intValue()<=max;}
    private void strings(JsonNode n,int max,int length){require(n!=null&&n.isArray()&&n.size()<=max);for(var x:n)require(x.isTextual()&&x.textValue().length()<=length);}
    private void numbers(JsonNode n){require(n!=null&&n.isObject()&&n.size()<=1000);n.fields().forEachRemaining(e->{require(e.getKey().length()<=160);require(integer(e.getValue(),0,9999));});}
    public void validate(JsonNode input){
        fields(input,Set.of("version","revision","entries"));
        require(integer(input.get("version"),1,1));
        var revision=input.path("revision");require(revision.isIntegralNumber()&&revision.canConvertToLong()&&revision.longValue()>=0&&revision.longValue()<9_007_199_254_740_991L);
        var entries=input.path("entries");require(entries.isObject()&&entries.size()<=256);
        entries.fields().forEachRemaining(e->{
            String key=e.getKey();var raw=e.getValue();require(raw.isTextual());String value=raw.textValue();
            switch(key){
                case "asbc-locale" -> require(Set.of("ko","en","ja","fi","fr","de","es","pt-BR","ru").contains(value));
                case "shadowcraft-selected-class" -> require(CLASSES.contains(value));
                case "favorites" -> {var n=parse(value);strings(n,6,32);for(var id:n)require(Set.of("quick","map","public-builds","builds","database","updates").contains(id.textValue()));}
                case "a2bc-event-timers-v1" -> timer(parse(value));
                case "asbc-trade-workbook-v1" -> workbook(parse(value));
                case "asbc-craft-plans-v1" -> craftPlans(parse(value));
                default -> {
                    if(key.equals("shadowcraft-plan-v1")||key.startsWith("shadowcraft-plan-v1:")&&CLASSES.contains(key.substring(20)))plan(parse(value),key.equals("shadowcraft-plan-v1")?"assassin":key.substring(20));
                    else if(key.matches("a2bc-map-progress-v1:[a-f0-9]{64}")){var n=parse(value);fields(n,Set.of("schema","completed"));require(n.path("schema").asText().equals("a2bc-map-progress-v1"));strings(n.get("completed"),20000,160);}
                    else throw bad();
                }
            }
        });
    }
    private String text(JsonNode n,String key,boolean nonempty){
        var value=n.path(key);require(value.isTextual()&&value.asText().length()<=80&&(!nonempty||!value.asText().isBlank()));return value.asText();
    }
    private BigInteger tradeNumber(JsonNode n,String key,BigInteger max,boolean positive){
        var value=n.path(key);require(value.isTextual()&&value.asText().matches("[0-9]{1,24}"));
        var number=new BigInteger(value.asText());require(number.signum()>=(positive?1:0)&&number.compareTo(max)<=0);return number;
    }
    private void workbook(JsonNode w){
        fields(w,Set.of("version","selected","legacyImported","books"));require(integer(w.get("version"),1,1));
        String selected=text(w,"selected",false);require(w.path("legacyImported").isBoolean());
        var books=w.path("books");require(books.isArray()&&books.size()<=50);var ids=new HashSet<String>();
        var maxQuantity=BigInteger.valueOf(1_000_000);var maxAmount=new BigInteger("1000000000000000000");
        for(var book:books){
            fields(book,Set.of("id","name","entries"));require(ids.add(text(book,"id",true)));text(book,"name",true);
            var entries=book.path("entries");require(entries.isArray()&&entries.size()<=200);var rowIds=new HashSet<String>();
            var remaining=BigInteger.ZERO;var bought=BigInteger.ZERO;
            for(var row:entries){
                fields(row,Set.of("id","kind","quantity","amount","at"));require(rowIds.add(text(row,"id",true)));
                String kind=text(row,"kind",true);require(Set.of("buy","sale").contains(kind));
                var q=tradeNumber(row,"quantity",maxQuantity,true);tradeNumber(row,"amount",maxAmount,false);
                try{Instant.parse(text(row,"at",true));}catch(Exception e){throw bad();}
                if(kind.equals("buy")){bought=bought.add(q);remaining=remaining.add(q);require(bought.compareTo(maxQuantity)<=0);}
                else{remaining=remaining.subtract(q);require(remaining.signum()>=0);}
            }
        }
        require(selected.isEmpty()||ids.contains(selected));
    }
    private void craftPlans(JsonNode collection){
        fields(collection,Set.of("version","selected","plans"));require(integer(collection.get("version"),1,1));String selected=text(collection,"selected",false);
        var plans=collection.path("plans");require(plans.isArray()&&plans.size()<=20);var ids=new HashSet<String>();
        for(var plan:plans){
            fields(plan,Set.of("id","name","draft"));require(ids.add(text(plan,"id",true)));text(plan,"name",true);
            var d=plan.path("draft");fields(d,Set.of("item","materials","cost","output","sell","tax","fee","rounding"));
            for(String k:List.of("item","cost","output","sell","tax","fee"))text(d,k,false);
            require(Set.of("up","down").contains(text(d,"rounding",true)));
            var materials=d.path("materials");require(materials.isArray()&&materials.size()>=1&&materials.size()<=20);var materialIds=new HashSet<String>();
            for(var m:materials){fields(m,Set.of("id","name","quantity","price","owned"));require(materialIds.add(text(m,"id",true)));for(String k:List.of("name","quantity","price"))text(m,k,false);if(m.has("owned"))text(m,"owned",false);}
        }
        require(selected.isEmpty()||ids.contains(selected));
    }
    private void plan(JsonNode p,String classKey){
        fields(p,PLAN_FIELDS);require(CLASSES.contains(classKey));require(p.path("classKey").asText("assassin").equals(classKey));
        require(integer(p.get("level"),1,45));require(Set.of("safe","damage","pvp").contains(p.path("mode").asText()));
        numbers(p.get("base"));numbers(p.get("bonus"));strings(p.get("nodes"),10000,160);strings(p.get("checked"),10000,160);
        var specs=p.path("specs");require(specs.isObject()&&specs.size()<=1000);specs.fields().forEachRemaining(e->{require(e.getKey().length()<=160);strings(e.getValue(),100,160);});
        for(String k:List.of("extraSP","extraStigma","extraCrystal","extraBattle"))if(p.has(k))require(integer(p.get(k),0,9999));
        for(String k:List.of("pointBudget","confirmedRemaining"))if(p.has(k)){fields(p.get(k),Set.of("sp","stigma","crystal","battle"));numbers(p.get(k));}
        if(p.has("stigmaSkills")){strings(p.get("stigmaSkills"),4,20);Set<String> ids=new HashSet<>();for(JsonNode id:p.get("stigmaSkills"))require(id.asText().matches("[0-9]{1,20}")&&ids.add(id.asText()));}
        for(String k:List.of("ascensionGrade3Confirmed","macroExtra"))if(p.has(k))require(p.get(k).isBoolean());
        if(p.has("confirmedRemainingContext")){
            var c=p.get("confirmedRemainingContext");fields(c,Set.of("region","serverId","characterId","level"));
            require(Set.of("eu","nae","naw","la","as").contains(c.path("region").asText()));
            require(c.path("serverId").isTextual()&&c.path("serverId").asText().matches("[0-9]{1,8}"));
            require(c.path("characterId").isTextual()&&!c.path("characterId").asText().isEmpty()&&c.path("characterId").asText().length()<=160);
            require(integer(c.get("level"),1,45));
        }
        require(!p.has("character")||p.get("character").isNull());
        if(p.has("gear")){
            var gear=p.get("gear");fields(gear,Set.of("mode","items"));require(Set.of("manual","current","target").contains(gear.path("mode").asText()));
            var items=gear.path("items");require(items.isArray()&&items.size()<=80);
            for(var item:items){fields(item,Set.of("id","name","note","slot","owned","current","target","bonuses"));
                require(item.path("id").isTextual()&&item.path("id").asText().matches("[0-9]{1,2}"));
                require(item.path("name").isTextual()&&item.path("name").asText().isEmpty()&&item.path("note").isTextual()&&item.path("note").asText().isEmpty());
                require(item.path("slot").isTextual()&&item.path("slot").asText().length()<=80);
                for(String k:List.of("owned","current","target"))require(item.path(k).isBoolean());numbers(item.get("bonuses"));
            }
        }
    }
    private void timer(JsonNode t){
        fields(t,Set.of("version","region","server","profiles","pinned","pinnedBosses","pinnedSchedules"));require(integer(t.get("version"),2,2));
        require(Set.of("eu","nae","naw","la","as").contains(t.path("region").asText()));require(t.path("server").isTextual()&&t.path("server").asText().matches("[0-9]{0,8}"));
        if(t.has("pinned")){strings(t.get("pinned"),7,32);for(var id:t.get("pinned"))require(TIMERS.contains(id.asText()));}
        if(t.has("pinnedBosses")){strings(t.get("pinnedBosses"),200,8);for(var id:t.get("pinnedBosses"))require(id.asText().matches("[1-9][0-9]{0,7}"));}
        if(t.has("pinnedSchedules")){strings(t.get("pinnedSchedules"),5,80);for(var id:t.get("pinnedSchedules"))require(Set.of("scheduled:watcher-kaira","scheduled:guardian-nahma","scheduled:executor-tamasa","scheduled:executor-argo","scheduled:executor-kaira").contains(id.asText()));}
        var profiles=t.path("profiles");require(profiles.isObject()&&profiles.size()<=200);
        profiles.fields().forEachRemaining(e->{require(e.getKey().matches("(eu|nae|naw|la|as):[0-9]{1,8}"));var p=e.getValue();fields(p,Set.of("offset","timeZone","hidden","times"));
            require(p.has("offset")&&(p.get("offset").isNull()||integer(p.get("offset"),-720,840)));
            if(p.has("timeZone"))require(p.get("timeZone").isTextual()&&java.time.ZoneId.getAvailableZoneIds().contains(p.get("timeZone").asText()));
            strings(p.get("hidden"),7,32);for(var id:p.get("hidden"))require(TIMERS.contains(id.asText()));
            var times=p.path("times");require(times.isObject());times.fields().forEachRemaining(time->{require(TIMERS.contains(time.getKey())&&time.getValue().isTextual());String text=time.getValue().asText();require(text.length()<=300);if(!text.isBlank()){var parts=text.trim().split("[,\\s]+");require(parts.length<=48);for(String part:parts)require(part.matches("([01][0-9]|2[0-3]):[0-5][0-9]"));}});
        });
    }
}
