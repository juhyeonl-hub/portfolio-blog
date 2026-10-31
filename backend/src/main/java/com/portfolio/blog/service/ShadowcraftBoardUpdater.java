package com.portfolio.blog.service;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.StreamReadConstraints;
import com.fasterxml.jackson.core.StreamReadFeature;
import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

/** Public board data only. No script evaluation, credentials, character queries or asset writes. */
@Component
@EnableScheduling
@ConditionalOnProperty(name="app.shadowcraft.board-refresh-enabled",havingValue="true",matchIfMissing=true)
public class ShadowcraftBoardUpdater {
    static final Map<String,String> SOURCES=Map.of("gladiator","gladiator","templar","templar","ranger","ranger","assassin","assassin","elementalist","spiritmaster","sorcerer","sorcerer","cleric","cleric","chanter","chanter");
    static final int LIMIT=5_000_000;
    private final ShadowcraftService service;
    private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).version(HttpClient.Version.HTTP_1_1).followRedirects(HttpClient.Redirect.NEVER).build();
    private static final ObjectMapper STATIC_JSON=new ObjectMapper(JsonFactory.builder()
            .enable(JsonReadFeature.ALLOW_UNQUOTED_FIELD_NAMES).enable(JsonReadFeature.ALLOW_SINGLE_QUOTES)
            .enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION)
            .streamReadConstraints(StreamReadConstraints.builder().maxNestingDepth(70).maxStringLength(250_000).maxNumberLength(20).build()).build());
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
                JsonNode boards=extractBoards(new String(body,StandardCharsets.UTF_8),entry.getValue());
                assertCompatible(current,boards);
                ObjectNode next=current.deepCopy();next.set("boards",boards);
                next.put("boardDataCheckedAt",Instant.now().toString());next.put("boardDataSource",request.uri().toString());
                service.update(key,next);service.boardRefreshResult(key,true);
            }catch(InterruptedException e){Thread.currentThread().interrupt();service.boardRefreshResult(key,false);return;}
            catch(Exception e){service.boardRefreshResult(key,false);}
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

    static JsonNode extractBoards(String html,String slug)throws Exception{
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
        return payload.path("boards");
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
