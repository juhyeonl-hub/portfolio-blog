package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Daily check of whether NCSOFT has started publishing the official Abyss/Arena rankings for the Global service
 * (as of 2026-10-20 every server answers an empty list). Only counts are kept; no character data is stored.
 */
@Component
@EnableScheduling
public class OfficialRankingProbe {
    private static final Logger log = LoggerFactory.getLogger(OfficialRankingProbe.class);
    /** rankingContentsType codes from the official ranking page script: abyss 1, arenaOfSolitude 5, arenaOfCooperation 6. */
    static final Map<String, Integer> KINDS = new LinkedHashMap<>(Map.of("abyss", 1, "arenaOfSolitude", 5, "arenaOfCooperation", 6));
    /** One representative server per Global region (first server of each region in servers.json). */
    static final Map<String, Integer> SAMPLE_SERVERS = new LinkedHashMap<>();
    static {
        SAMPLE_SERVERS.put("eu", 1301); SAMPLE_SERVERS.put("nae", 1101); SAMPLE_SERVERS.put("naw", 1201);
        SAMPLE_SERVERS.put("la", 1401); SAMPLE_SERVERS.put("as", 1501);
    }
    private final ObjectMapper mapper;
    private final HttpClient client;
    private volatile ObjectNode status;

    @Autowired
    public OfficialRankingProbe(ObjectMapper mapper) {
        this(mapper, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
    }

    OfficialRankingProbe(ObjectMapper mapper, HttpClient client) {
        this.mapper = mapper;
        this.client = client;
        this.status = empty(null, true);
    }

    private ObjectNode empty(Instant checkedAt, boolean failed) {
        ObjectNode node = mapper.createObjectNode();
        node.put("checkedAt", checkedAt == null ? null : checkedAt.toString());
        ObjectNode published = node.putObject("published");
        for (String kind : KINDS.keySet()) published.put(kind, false);
        node.put("failed", failed);
        return node;
    }

    /** Current probe result: checkedAt (null until the first completed probe), published flags per kind, failed. */
    public JsonNode status() {
        return status.deepCopy();
    }

    @Scheduled(fixedDelayString = "${app.shadowcraft.ranking-probe-ms:86400000}",
               initialDelayString = "${app.shadowcraft.ranking-probe-initial-delay-ms:120000}")
    public void probe() {
        ObjectNode next = empty(Instant.now(), false);
        ObjectNode published = (ObjectNode) next.get("published");
        ObjectNode counts = next.putObject("counts");
        boolean anyFailure = false;
        for (Map.Entry<String, Integer> region : SAMPLE_SERVERS.entrySet()) {
            ObjectNode regionCounts = counts.putObject(region.getKey());
            for (Map.Entry<String, Integer> kind : KINDS.entrySet()) {
                int count = count(region.getKey(), region.getValue(), kind.getValue());
                if (count < 0) { anyFailure = true; continue; }
                regionCounts.put(kind.getKey(), count);
                if (count > 0) published.put(kind.getKey(), true);
            }
        }
        next.put("failed", anyFailure);
        status = next;
        log.info("a2bc official ranking probe: published={} failed={}", published, anyFailure);
    }

    /** Number of ranking rows, or -1 when the request failed or the response was not the expected shape. */
    int count(String region, int serverId, int contentsType) {
        try {
            URI uri = URI.create("https://aion2.plaync.com/api/ranking/list?region=" + region + "&lang=en-US&rankingContentsType="
                    + contentsType + "&rankingType=0&serverId=" + serverId);
            var request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(15))
                    .header("Accept", "application/json").header("User-Agent", "a2bc/1.0").GET().build();
            var response = com.portfolio.blog.security.BoundedHttp.send(client, request, 1_000_000);
            if (response.statusCode() != 200 || response.body().length > 1_000_000) return -1;
            JsonNode body = mapper.readTree(response.body());
            JsonNode list = body.path("rankingList");
            if (!body.isObject() || !list.isArray()) return -1;
            return list.size();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return -1;
        } catch (Exception e) {
            // No response body in logs.
            log.warn("a2bc official ranking probe request failed ({})", e.getClass().getSimpleName());
            return -1;
        }
    }

    static List<String> kinds() { return List.copyOf(KINDS.keySet()); }
}
