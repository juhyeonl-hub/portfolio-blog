package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.portfolio.blog.service.ShadowcraftService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.Semaphore;

@RestController
public class ShadowcraftController {
    // Observed official profile latency exceeds five seconds. Three sequential stages fit the 30s browser budget.
    private static final Duration LOOKUP_TIMEOUT=Duration.ofSeconds(8);
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(ShadowcraftController.class);
    @org.springframework.beans.factory.annotation.Value("${app.shadowcraft.news-refresh-enabled:false}")
    private boolean newsRefreshEnabled;
    private final ShadowcraftService service;
    private final ObjectMapper mapper;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final Semaphore lookups = new Semaphore(8);
    private final Map<String,Cached> cache = new LinkedHashMap<>();
    private long windowStart=System.currentTimeMillis();
    private int windowRequests;
    private synchronized boolean allowLookup() {
        long now=System.currentTimeMillis();
        if(now-windowStart>=60_000) { windowStart=now; windowRequests=0; }
        return ++windowRequests<=120;
    }
    private record Cached(long at,JsonNode data) {}
    public ShadowcraftController(ShadowcraftService service,ObjectMapper mapper) { this.service=service; this.mapper=mapper; }

    @GetMapping("/api/public/shadowcraft/catalog")
    public JsonNode catalog(@RequestParam(defaultValue="assassin",name="class") String key) throws Exception {
        ObjectNode response = (ObjectNode) service.catalog(key);
        response.putObject("newsRefresh").put("enabled", newsRefreshEnabled).put("intervalMinutes", 15);
        return response;
    }

    @PutMapping("/api/admin/shadowcraft/catalog/{key}")
    public JsonNode update(@PathVariable String key,jakarta.servlet.http.HttpServletRequest request) throws Exception {
        byte[] body=request.getInputStream().readNBytes(3_000_001);
        if(body.length>3_000_000) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE);
        try { return service.update(key,mapper.readTree(body)); }
        catch(com.fasterxml.jackson.core.JsonProcessingException e) { throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,"JSON 형식을 확인하세요."); }
    }

    @PutMapping("/api/admin/shadowcraft/news")
    public JsonNode updateNews(jakarta.servlet.http.HttpServletRequest request) throws Exception {
        byte[] body=request.getInputStream().readNBytes(1_000_001);
        if(body.length>1_000_000) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE);
        try { return service.updateNews(mapper.readTree(body)); }
        catch(com.fasterxml.jackson.core.JsonProcessingException e) { throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,"공지 JSON 형식을 확인하세요."); }
    }

    @PostMapping("/api/public/shadowcraft/armory")
    public ResponseEntity<?> armory(jakarta.servlet.http.HttpServletRequest request) {
        if(!allowLookup() || !lookups.tryAcquire()) return ResponseEntity.status(429).body(Map.of("error","조회가 많습니다. 잠시 후 다시 시도하세요."));
        try {
            byte[] body=request.getInputStream().readNBytes(2001);
            if(body.length>2000) return bad("조회 입력이 너무 깁니다.");
            JsonNode p=mapper.readTree(body);
            if(p==null || !p.isObject()) return bad("조회 입력을 확인하세요.");
            for(String field:List.of("action","region","class","server","name","id","itemId","slot","enchant")) if(p.has(field) && !p.get(field).isTextual()) return bad("조회 입력을 확인하세요.");
            String region=p.path("region").asText("eu"),action=p.path("action").asText(),key=p.path("class").asText("assassin");
            JsonNode selected=service.profile(key);
            if(!List.of("eu","nae","naw","la","as").contains(region)) return bad("글로벌 지역을 선택하세요.");
            if(action.equals("servers")) return ResponseEntity.ok(Map.of("servers",get("https://aion2.plaync.com/en-us/api/gameinfo/servers?region="+region+"&lang=en-US").path("serverList")));
            String server=p.path("server").asText();
            if(!server.isEmpty() && !server.matches("\\d{1,6}")) return bad("서버 선택 정보를 확인하세요.");
            if(action.equals("search")) {
                String name=p.path("name").asText().trim();
                if(name.isEmpty() || name.length()>40) return bad("캐릭터 이름을 1~40자로 입력하세요.");
                List<String> ids=new ArrayList<>(); selected.path("pcIds").forEach(id->ids.add(id.asText()));
                JsonNode data=get("https://api-search.plaync.com/aion2global/search/v2/character?keyword="+enc(name)+"&region="+region+"&localeInfo=en-US&page=1&size=20&pcId="+enc(String.join(",",ids))+(server.isEmpty()?"":"&serverId="+server));
                var characters=mapper.createArrayNode();
                for(JsonNode entry:data.path("list")) {
                    ObjectNode item=entry.deepCopy();
                    item.put("name",item.path("name").asText().replaceAll("<[^>]*>",""));
                    item.put("characterId",java.net.URLDecoder.decode(item.path("characterId").asText().replace("+","%2B"),StandardCharsets.UTF_8));
                    characters.add(item);
                }
                ObjectNode out=mapper.createObjectNode();
                out.set("characters",characters);
                out.set("pagination",data.path("pagination"));
                return ResponseEntity.ok(out);
            }
            if(action.equals("item")) {
                String id=p.path("id").asText(),itemId=p.path("itemId").asText(),slot=p.path("slot").asText(),enchant=p.path("enchant").asText();
                if(id.length()<5 || id.length()>200 || !server.matches("\\d{1,6}") || !itemId.matches("[1-9]\\d{0,9}") || !slot.matches("[1-9]\\d?") || !enchant.matches("\\d{1,2}")) return bad("장비 선택 정보를 확인하세요.");
                String q="?region="+region+"&lang=en-US&serverId="+server+"&characterId="+enc(id);
                // Verify the selected slot against current equipped items before querying its actual rolls.
                JsonNode equipment=get("https://aion2.plaync.com/api/character/equipment"+q);
                boolean matches=false;
                for(JsonNode item:equipment.path("equipment").path("equipmentList"))
                    if(item.path("id").asText().equals(itemId) && item.path("slotPos").asInt()==Integer.parseInt(slot) && item.path("enchantLevel").asInt(-1)==Integer.parseInt(enchant)) matches=true;
                if(!matches) return bad("장비가 바뀌었거나 조회 정보가 일치하지 않습니다. 캐릭터를 다시 조회하세요.");
                JsonNode detail=get("https://aion2.plaync.com/api/character/equipment/item"+q+"&id="+itemId+"&slotPos="+slot+"&enchantLevel="+enchant);
                if(!detail.path("id").asText().equals(itemId) || detail.path("enchantLevel").asInt(-1)!=Integer.parseInt(enchant)) throw new IllegalStateException("Item identity mismatch");
                ObjectNode out=mapper.createObjectNode();
                out.set("item",detail);out.put("characterId",id);out.put("serverId",server);out.put("region",region);out.put("slotPos",Integer.parseInt(slot));out.put("importedAt",java.time.Instant.now().toString());
                return ResponseEntity.ok(out);
            }
            if(action.equals("profile")) {
                String id=p.path("id").asText();
                if(id.length()<5 || id.length()>200 || !server.matches("\\d{1,6}")) return bad("캐릭터 선택 정보를 확인하세요.");
                String q="?region="+region+"&lang=en-US&serverId="+server+"&characterId="+enc(id);
                JsonNode info=get("https://aion2.plaync.com/api/character/info"+q),equipment=get("https://aion2.plaync.com/api/character/equipment"+q);
                boolean matches=false; for(JsonNode pc:selected.path("pcIds")) if(pc.asInt()==info.path("profile").path("pcId").asInt()) matches=true;
                if(!matches) return bad("선택한 직업의 캐릭터가 아닙니다. 직업을 먼저 바꾸세요.");
                Set<Integer> boardIds=new HashSet<>(); selected.path("boardIds").forEach(b->boardIds.add(b.asInt()));
                var nodes=mapper.createArrayNode(); var failed=mapper.createArrayNode();
                // Match the original parallel board lookup; one failed board must not discard the profile.
                record BoardResult(String id, JsonNode data) {}
                var jobs = new ArrayList<java.util.concurrent.CompletableFuture<BoardResult>>();
                Set<Integer> requested = new HashSet<>();
                for (JsonNode board : info.path("daevanion").path("boardList")) {
                    int boardId = board.path("id").asInt();
                    if (!board.path("open").asBoolean() || !boardIds.contains(boardId) || !requested.add(boardId)) continue;
                    jobs.add(java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                        try { return new BoardResult(String.valueOf(boardId), get("https://aion2.plaync.com/api/character/daevanion/detail" + q + "&boardId=" + boardId)); }
                        catch (Exception e) { return new BoardResult(String.valueOf(boardId), null); }
                    }));
                }
                for (var job : jobs) {
                    BoardResult result = job.join();
                    if (result.data() == null) { failed.add(result.id()); continue; }
                    for (JsonNode node : result.data().path("nodeList"))
                        if (node.path("open").asBoolean() && !node.path("type").asText().equals("None")) nodes.add(node.path("nodeId").asText());
                }
                ObjectNode out=mapper.createObjectNode();
                out.put("classKey",key);
                out.set("profile",info.path("profile"));
                out.set("stats",info.path("stat").path("statList"));
                out.set("skills",equipment.path("skill").path("skillList"));
                JsonNode items=equipment.path("equipment").path("equipmentList");
                out.set("equipment",items.isArray()?items:mapper.nullNode());
                out.set("boards",info.path("daevanion").path("boardList"));
                out.set("nodes",nodes);
                out.set("failedBoards",failed);
                out.put("region",region);
                out.put("importedAt",java.time.Instant.now().toString());
                out.put("pointsAvailable",false);
                return ResponseEntity.ok(out);
            }
            return bad("지원하지 않는 조회입니다.");
        } catch(org.springframework.web.server.ResponseStatusException e) { return bad(e.getReason()); }
        catch(com.fasterxml.jackson.core.JsonProcessingException e) { return bad("조회 입력을 확인하세요."); }
        catch(java.net.http.HttpTimeoutException e) { log.warn("Armory lookup timed out"); return ResponseEntity.status(504).body(Map.of("error","공식 캐릭터 조회 응답이 지연되고 있습니다. 저장된 계획은 유지됩니다. 잠시 후 다시 조회하세요.")); }
        catch(Exception e) { log.warn("Armory lookup failed: {}",e.getClass().getSimpleName()); return ResponseEntity.status(502).body(Map.of("error","공개 전투정보실 조회 실패 · 저장된 계획은 유지됩니다. 잠시 후 다시 시도하세요.")); }
        finally { lookups.release(); }
    }
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<?> statusError(org.springframework.web.server.ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("error", error.getReason()==null ? "요청을 처리하지 못했습니다." : error.getReason()));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> unavailable(Exception error) {
        return ResponseEntity.status(503).body(Map.of("error", "데이터 조회 실패 · 이전 데이터를 유지합니다."));
    }
    private static ResponseEntity<?> bad(String message) { return ResponseEntity.badRequest().body(Map.of("error",message)); }
    private static String enc(String s) { return URLEncoder.encode(s,StandardCharsets.UTF_8); }
    private JsonNode get(String url) throws Exception {
        // Character profile/equipment must reflect the game quickly (a fresh lookup after levelling); only bursts are absorbed.
        // Server lists and search results change rarely and keep the five-minute cache.
        long ttl=url.contains("/api/character/")?15_000:300_000;
        synchronized(cache) { Cached hit=cache.get(url); if(hit!=null && System.currentTimeMillis()-hit.at<ttl) return hit.data; }
        HttpRequest request=HttpRequest.newBuilder(URI.create(url)).timeout(LOOKUP_TIMEOUT).header("Accept","application/json").build();
        HttpResponse<InputStream> response=client.send(request,HttpResponse.BodyHandlers.ofInputStream());
        JsonNode data;
        try(InputStream stream=response.body()) {
            if(response.statusCode()!=200) throw new IllegalStateException("Upstream failure");
            byte[] bytes=stream.readNBytes(3_000_001);
            if(bytes.length>3_000_000) throw new IllegalStateException("Response too large");
            data=mapper.readTree(bytes); if(data==null || !data.isObject()) throw new IllegalStateException("Invalid response");
        }
        synchronized(cache) { if(cache.size()>=100) cache.clear(); cache.put(url,new Cached(System.currentTimeMillis(),data)); }
        return data;
    }
}
