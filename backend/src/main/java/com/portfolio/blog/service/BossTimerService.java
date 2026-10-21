package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.Semaphore;
import java.util.function.LongSupplier;

@Service
public class BossTimerService {
    interface Source { JsonNode read(int server) throws Exception; }
    private static final long TTL = 60_000;
    private final ObjectMapper mapper;
    private final Source source;
    private final LongSupplier clock;
    private final boolean enabled;
    private final Map<Integer, Entry> entries = new HashMap<>();
    private final Semaphore requests = new Semaphore(4);
    private static class Entry {
        final String region;
        final int race;
        long attempted = -1, fetched;
        boolean failed;
        ObjectNode data;
        Entry(String region, int race) { this.region = region; this.race = race; }
    }
    @Autowired
    public BossTimerService(ObjectMapper mapper,
            @Value("${app.shadowcraft.boss-feed-enabled:true}") boolean enabled) throws Exception {
        this(mapper, network(mapper), System::currentTimeMillis, enabled);
    }
    BossTimerService(ObjectMapper mapper, Source source, LongSupplier clock, boolean enabled) throws Exception {
        this.mapper = mapper; this.source = source; this.clock = clock; this.enabled = enabled;
        try (var in = getClass().getResourceAsStream("/shadowcraft/servers.json")) {
            JsonNode directory = mapper.readTree(in);
            directory.fields().forEachRemaining(region -> region.getValue().forEach(s ->
                entries.put(s.path("serverId").asInt(), new Entry(region.getKey(), s.path("raceId").asInt()))));
        }
    }
    private static Source network(ObjectMapper mapper) {
        var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();
        return server -> {
            var req = HttpRequest.newBuilder(URI.create("https://cdn.a2tools.app/feeds/boss-timers/" + server + ".json"))
                .timeout(Duration.ofSeconds(8)).header("User-Agent", "a2bc-boss-timers/1.0 (+https://juhyeonl.dev/lab/shadowcraft/)").GET().build();
            var response = client.send(req, HttpResponse.BodyHandlers.ofInputStream());
            try (var body = response.body()) {
                if (response.statusCode() != 200) throw new IllegalStateException("feed unavailable");
                byte[] bytes = body.readNBytes(256_001);
                if (bytes.length > 256_000) throw new IllegalStateException("feed too large");
                return mapper.readTree(bytes);
            }
        };
    }
    public ObjectNode get(String region, int server) {
        Entry e = entries.get(server);
        if (e == null || !e.region.equals(region)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "글로벌 서버를 선택하세요.");
        synchronized (e) {
            long now = clock.getAsLong();
            if (enabled && (e.attempted < 0 || now - e.attempted >= TTL)) {
                if (requests.tryAcquire()) {
                    e.attempted = now;
                    try { e.data = normalize(source.read(server), e.race, now); e.fetched = clock.getAsLong(); e.failed = false; }
                    catch (Exception ex) { e.failed = true; if (ex instanceof InterruptedException) Thread.currentThread().interrupt(); }
                    finally { requests.release(); }
                }
            }
            ObjectNode out = mapper.createObjectNode();
            out.put("server", server).put("region", region).put("serverNow", clock.getAsLong())
                .put("fetchedAt", e.fetched).put("refreshFailed", e.failed).put("enabled", enabled)
                .put("source", "A2Tools").put("refreshSeconds", 60);
            ObjectNode all = enabled && e.data != null ? e.data.deepCopy() : mapper.createObjectNode();
            out.set("allBosses", all);
            ObjectNode legacy = mapper.createObjectNode();
            String[] keys = {"gartua", "lagta", "kashapa", "tartan"};
            int[] ids = e.race == 1 ? new int[]{101021,101024,101023,101022} : new int[]{111021,111022,111023,111024};
            for (int i = 0; i < keys.length; i++) {
                JsonNode record = all.get(String.valueOf(ids[i]));
                if (record != null) legacy.set(keys[i], record.deepCopy());
            }
            out.set("bosses", legacy);
            return out;
        }
    }
    ObjectNode normalize(JsonNode root, int race, long now) {
        if (root == null || !root.path("bosses").isObject() || root.path("bosses").size() > 200)
            throw new IllegalArgumentException("invalid feed");
        var bosses = root.path("bosses");
        ObjectNode out = mapper.createObjectNode();
        var records = bosses.fields();
        while (records.hasNext()) {
            var record = records.next();
            String id = record.getKey();
            if (!id.matches("[1-9][0-9]{0,7}")) throw new IllegalArgumentException("invalid boss id");
            JsonNode b = record.getValue();
            String state = b.path("state").asText();
            if (!b.isObject() || !(state.equals("up") || state.equals("dead")) || !b.path("confirmed").isBoolean())
                throw new IllegalArgumentException("invalid boss");
            long reported = timestamp(b.get("reportedAt"), false);
            if (reported > now + 300_000) throw new IllegalArgumentException("future observation");
            long next = timestamp(b.get("nextSpawn"), true);
            long up = timestamp(b.get("upSince"), true);
            out.putObject(id).put("id", Integer.parseInt(id)).put("state", state).put("reportedAt", reported)
                .put("nextSpawn", next).put("upSince", up).put("confirmed", b.path("confirmed").asBoolean());
        }
        return out;
    }
    private long timestamp(JsonNode value, boolean optional) {
        if (optional && (value == null || value.isNull())) return 0;
        if (value == null || !value.isIntegralNumber() || !value.canConvertToLong()) throw new IllegalArgumentException("invalid timestamp");
        long seconds = value.longValue();
        if (seconds < 1_577_836_800L || seconds > 4_102_444_800L) throw new IllegalArgumentException("invalid timestamp range");
        return seconds * 1000;
    }
}
