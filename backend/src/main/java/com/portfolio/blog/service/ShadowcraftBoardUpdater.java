package com.portfolio.blog.service;

import tools.jackson.core.json.JsonFactory;
import tools.jackson.core.StreamReadConstraints;
import tools.jackson.core.StreamReadFeature;
import tools.jackson.core.json.JsonReadFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.nio.ByteBuffer;
import java.io.ByteArrayOutputStream;
import java.util.concurrent.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.regex.Pattern;

/** Public board and known-skill name data only. No script evaluation, credentials, character queries or asset writes. */
@Component
@EnableScheduling
@ConditionalOnProperty(name="app.shadowcraft.board-refresh-enabled",havingValue="true",matchIfMissing=true)
public class ShadowcraftBoardUpdater {
    static final Map<String,String> SOURCES=Map.of("gladiator","gladiator","templar","templar","ranger","ranger","assassin","assassin","elementalist","spiritmaster","sorcerer","sorcerer","cleric","cleric","chanter","chanter");
    static final int LIMIT=5_000_000;
    private final ShadowcraftService service;
    private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).version(HttpClient.Version.HTTP_1_1).followRedirects(HttpClient.Redirect.NEVER).build();
    private static final ObjectMapper STATIC_JSON=tools.jackson.databind.json.JsonMapper.builder(JsonFactory.builder()
            .enable(JsonReadFeature.ALLOW_UNQUOTED_PROPERTY_NAMES).enable(JsonReadFeature.ALLOW_SINGLE_QUOTES)
            .enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION)
            .streamReadConstraints(StreamReadConstraints.builder().maxNestingDepth(70).maxStringLength(250_000).maxNumberLength(20).build()).build()).build();
    public ShadowcraftBoardUpdater(ShadowcraftService service){this.service=service;}

    @Scheduled(fixedDelayString="${app.shadowcraft.board-refresh-ms:21600000}",initialDelayString="${app.shadowcraft.board-initial-delay-ms:90000}")
    public void refresh(){
        for(var entry:SOURCES.entrySet()){
            String key=entry.getKey();
            try{
                var request=HttpRequest.newBuilder(URI.create("https://aion2.gaming.tools/ko/builds/"+entry.getValue()+"/pve"))
                        .timeout(Duration.ofSeconds(20)).header("User-Agent","ASBC-public-data-research/1.0").header("Accept","text/html").build();
                var pending=client.sendAsync(request, info -> new LimitedBody());
                HttpResponse<byte[]> response;
                try {response=pending.get(21,TimeUnit.SECONDS);}finally{if(!pending.isDone())pending.cancel(true);}
                if(response.statusCode()!=200||!response.headers().firstValue("Content-Type").orElse("").contains("text/html"))throw new IllegalArgumentException("source-unavailable");
                byte[] body=response.body();
                ObjectNode current=(ObjectNode)service.catalog(key).path("catalog");
                JsonNode payload=extractCatalog(new String(body,StandardCharsets.UTF_8),entry.getValue());
                JsonNode boards=payload.path("boards");
                assertCompatible(current,boards);
                ObjectNode next=mergeKnownSkillNames(current,payload);mergeKnownBoards(next,boards);
                next.put("sourceSnapshotSha256",java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(body)));
                next.put("boardDataCheckedAt",Instant.now().toString());next.put("boardDataSource",request.uri().toString());
                service.update(key,next);service.boardRefreshResult(key,true,next.path("skillDataCheck").path("needsReview").asBoolean()||next.path("boardDataCheck").path("needsReview").asBoolean()?"review-required":"ok");
            }catch(InterruptedException e){Thread.currentThread().interrupt();service.boardRefreshResult(key,false,"interrupted");return;}
            catch(Exception e){service.boardRefreshResult(key,false,failureCode(e));}
        }
    }

    static final class LimitedBody implements HttpResponse.BodySubscriber<byte[]> {
        private final CompletableFuture<byte[]> done=new CompletableFuture<>();
        private final ByteArrayOutputStream bytes=new ByteArrayOutputStream();
        private Flow.Subscription subscription;
        public CompletionStage<byte[]> getBody(){return done;}
        public void onSubscribe(Flow.Subscription value){subscription=value;value.request(1);}
        public void onNext(List<ByteBuffer> buffers){
            for(var buffer:buffers){if(buffer.remaining()>LIMIT-bytes.size()){subscription.cancel();done.completeExceptionally(new IllegalArgumentException("response-too-large"));return;}byte[] part=new byte[buffer.remaining()];buffer.get(part);bytes.writeBytes(part);}
            subscription.request(1);
        }
        public void onError(Throwable error){done.completeExceptionally(error);}
        public void onComplete(){done.complete(bytes.toByteArray());}
    }

    static JsonNode extractBoards(String html,String slug)throws Exception{return extractCatalog(html,slug).path("boards");}

    static JsonNode extractCatalog(String html,String slug)throws Exception{
        if(!SOURCES.containsValue(slug)||html.length()>LIMIT)throw new IllegalArgumentException("source");
        slug=slug.equals("spiritmaster")?"elementalist":slug;
        var match=Pattern.compile("\\{\\s*classKey\\s*:\\s*\""+Pattern.quote(slug)+"\"\\s*,").matcher(html);
        if(!match.find())throw new IllegalArgumentException("static-payload-missing");
        int start=match.start(),depth=0,end=-1;char quote=0;boolean escape=false;
        for(int i=start;i<html.length();i++){
            char c=html.charAt(i);
            if(quote!=0){if(escape)escape=false;else if(c=='\\')escape=true;else if(c==quote)quote=0;continue;}
            if(c=='"'||c=='\''){quote=c;continue;}
            if(c=='`')throw new IllegalArgumentException("non-literal");
            if(c=='{')depth++;else if(c=='}'&&--depth==0){end=i+1;break;}
        }
        if(end<0)throw new IllegalArgumentException("incomplete-payload");
        JsonNode payload=STATIC_JSON.readTree(html.substring(start,end));
        if(!slug.equals(payload.path("classKey").asText())||!payload.path("boards").isArray())throw new IllegalArgumentException("board-shape");
        return payload;
    }

    /** Names can refresh for known IDs. Costs, unlocks, effects and new skills require review. */
    static ObjectNode mergeKnownSkillNames(ObjectNode current,JsonNode payload){
        JsonNode sourceSkills=payload.path("planner").path("skills");
        if(sourceSkills.isMissingNode())sourceSkills=payload.path("skills");
        if(!sourceSkills.isArray()||sourceSkills.isEmpty()||sourceSkills.size()>100)throw new IllegalArgumentException("skill-shape");
        Map<String,JsonNode> source=new HashMap<>();
        for(JsonNode skill:sourceSkills){
            String id=skill.path("id").asText();
            if(!id.matches("[1-9][0-9]{0,14}")||source.put(id,skill)!=null||!skill.path("name").isTextual()||skill.path("name").asText().isBlank()
                    ||skill.path("name").asText().length()>200||skill.path("name").asText().matches("(?s).*[<>\\p{Cntrl}].*"))throw new IllegalArgumentException("skill-identity");
        }
        ObjectNode next=(ObjectNode) current.deepCopy();int changedRules=0,removed=0,renamed=0;
        Set<String> known=new HashSet<>();
        for(JsonNode skill:next.path("skills")){
            String id=skill.path("id").asText();known.add(id);JsonNode incoming=source.get(id);
            if(incoming==null){removed++;continue;}
            ObjectNode oldRules=((ObjectNode)skill).deepCopy(),newRules=((ObjectNode)incoming).deepCopy();
            oldRules.remove("name");newRules.remove("name");
            if(!oldRules.equals(newRules)){changedRules++;continue;}
            if(!skill.path("name").equals(incoming.path("name"))){((ObjectNode)skill).set("name",incoming.path("name"));renamed++;}
        }
        int added=(int)source.keySet().stream().filter(id->!known.contains(id)).count();
        boolean needsReview=changedRules+removed+added>0;
        var status=next.putObject("skillDataCheck");status.put("checkedAt",Instant.now().toString()).put("renamed",renamed).put("changedRules",changedRules).put("added",added).put("removed",removed).put("needsReview",needsReview);
        if(needsReview)next.put("reviewRequired",true);
        return next;
    }

    /** Names/icons are presentation data. New nodes, costs, effects and layout changes stay pending review. */
    static void mergeKnownBoards(ObjectNode next,JsonNode incoming){
        int changed=0,added=0,removed=0;var ids=new HashSet<String>();var changes=next.arrayNode();
        for(JsonNode source:incoming){
            String id=source.path("id").asText();if(!ids.add(id))throw new IllegalArgumentException("duplicate-board");
            JsonNode existing=null;for(JsonNode board:next.path("boards"))if(id.equals(board.path("id").asText()))existing=board;
            if(existing==null){added++;changes.add(id);continue;}
            if(!boardRules(existing).equals(boardRules(source))){changed++;changes.add(id);continue;}
            ((ObjectNode)existing).set("name",source.path("name"));
            var names=new HashMap<String,JsonNode>();source.path("nodes").forEach(n->names.put(n.path("id").asText(),n));
            for(JsonNode node:existing.path("nodes")){JsonNode fresh=names.get(node.path("id").asText());for(String field:List.of("name","iconPath"))if(fresh.has(field))((ObjectNode)node).set(field,fresh.get(field));}
        }
        for(JsonNode board:next.path("boards"))if(!ids.contains(board.path("id").asText())){removed++;changes.add(board.path("id").asText());}
        boolean review=changed+added+removed>0;
        var check=next.putObject("boardDataCheck");check.put("checkedAt",Instant.now().toString()).put("changedRules",changed).put("added",added).put("removed",removed).put("needsReview",review);check.set("boardIds",changes);
        if(review)next.put("reviewRequired",true);
    }
    private static JsonNode boardRules(JsonNode value){
        JsonNode copy=value.deepCopy();stripBoardLabels(copy);return copy;
    }
    private static void stripBoardLabels(JsonNode value){
        if(value.isObject()){((ObjectNode)value).remove("name");((ObjectNode)value).remove("iconPath");}
        if((value.isObject()||value.isArray()))for(JsonNode child:value)stripBoardLabels(child);
    }
    static String failureCode(Throwable error){
        for(Throwable e=error;e!=null;e=e.getCause()){
            if(e instanceof java.net.http.HttpTimeoutException||e instanceof TimeoutException)return "source-unavailable";
            String message=e.getMessage();
            if(message!=null&&List.of("source-unavailable","response-too-large","new-skill-needs-review","removed-node-needs-review").contains(message))return message;
        }
        return "validation-failed";
    }

    static void assertCompatible(JsonNode current,JsonNode boards){
        if(boards.size()<5||boards.size()>8)throw new IllegalArgumentException("board-count");
        Set<String> skills=new HashSet<>();current.path("skills").forEach(s->skills.add(s.path("id").asText()));
        Set<String> incoming=new HashSet<>();
        for(JsonNode board:boards)for(JsonNode n:board.path("nodes")){
            if(!incoming.add(n.path("id").asText()))throw new IllegalArgumentException("duplicate-node");
            if(n.has("skill")&&!skills.contains(n.path("skill").path("id").asText()))throw new IllegalArgumentException("new-skill-needs-review");
        }
        for(JsonNode board:current.path("boards"))for(JsonNode n:board.path("nodes"))if(!incoming.contains(n.path("id").asText()))throw new IllegalArgumentException("removed-node-needs-review");
    }
}
