package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.Instant;
import java.util.*;

@Service
public class ShadowcraftService {
    private final ObjectMapper mapper;
    private final JdbcTemplate jdbc;
    private final Map<String, JsonNode> snapshots = new HashMap<>();
    private final Map<String, JsonNode> profiles = new HashMap<>();
    public ShadowcraftService(ObjectMapper mapper, JdbcTemplate jdbc) throws Exception {
        this.mapper = mapper; this.jdbc = jdbc;
        for (JsonNode profile : resource("class-profiles.json")) {
            String key = profile.path("key").asText(); profiles.put(key, profile);
            snapshots.put(key, resource(key + ".json"));
        }
    }
    private JsonNode resource(String name) throws Exception {
        try (var input = new ClassPathResource("shadowcraft/" + name).getInputStream()) { return mapper.readTree(input); }
    }
    public JsonNode profile(String key) {
        if (!profiles.containsKey(key)) invalid("지원하지 않는 직업입니다.");
        return profiles.get(key);
    }
    public JsonNode catalog(String key) throws Exception {
        profile(key);
        List<String> rows = jdbc.query("SELECT payload FROM shadowcraft_catalogs WHERE class_key = ?", (r,n) -> r.getString(1), key);
        ObjectNode result = rows.isEmpty() ? snapshots.get(key).deepCopy() : (ObjectNode) mapper.readTree(rows.getFirst());
        List<String> news = jdbc.query("SELECT payload FROM shadowcraft_catalogs WHERE class_key = 'official-news'", (r,n) -> r.getString(1));
        if (!news.isEmpty()) result.set("news", mapper.readTree(news.getFirst()));
        return result;
    }
    @Transactional
    public JsonNode update(String key, JsonNode fresh) throws Exception {
        JsonNode profile = profile(key);
        if (fresh == null || !fresh.isObject() || !key.equals(fresh.path("classKey").asText()) || fresh.path("version").asText().isBlank()
                || !fresh.path("skills").isArray() || fresh.path("skills").size() != 35 || !fresh.path("boards").isArray() || fresh.path("boards").size() != 5
                || !fresh.path("characterLevels").isArray()) invalid("원본 스키마 변경 · 반영 중지");
        Set<String> ids = new HashSet<>();
        for (JsonNode skill : fresh.path("skills")) {
            if (!skill.path("id").asText().matches("\\d+") || !ids.add(skill.path("id").asText()) || !skill.path("learning").isArray()
                    || !skill.path("specializations").isArray() || !skill.path("specializationSlots").isArray()
                    || !skill.path("name").isTextual() || !skill.path("stigma").isBoolean()
                    || !List.of("active", "passive", "stigma").contains(skill.path("kind").asText())
                    || !skill.path("iconPath").asText().startsWith("/images/")) invalid("스킬 검증 실패");
            for (JsonNode row : skill.path("learning"))
                if (!within(row.path("level"), 1, 100) || !within(row.path("requiredCharacterLevel"), 1, 100)
                        || !within(row.path("skillPoints"), 0, 9999) || !within(row.path("stigmaPoints"), 0, 9999)) invalid("스킬 비용 검증 실패");
            for (JsonNode spec : skill.path("specializations"))
                if (!spec.path("id").isTextual() || !spec.path("description").isTextual() || !within(spec.path("requiredParentLevel"), 1, 100)) invalid("특화 검증 실패");
            for (JsonNode slot : skill.path("specializationSlots"))
                if (!within(slot.path("requiredSkillLevel"), 0, 100) || !slot.path("editable").isBoolean() || (slot.path("editable").asBoolean() && slot.path("requiredSkillLevel").asInt() == 0)) invalid("특화 슬롯 검증 실패");
        }
        for (String field : List.of("core", "activePriority", "passivePriority", "manual", "movement", "safeStigmas", "damageStigmas"))
            for (JsonNode id : profile.path(field)) if (!ids.contains(id.asText())) invalid("추천 프로필에 필요한 스킬 누락 · 기존 카탈로그 유지");
        Set<Integer> expected = new HashSet<>(), actual = new HashSet<>();
        profile.path("boardIds").forEach(id -> expected.add(id.asInt()));
        for (JsonNode board : fresh.path("boards")) {
            if (!actual.add(board.path("id").asInt()) || !expected.contains(board.path("id").asInt()) || !board.path("nodes").isArray()
                    || board.path("nodes").size() < 80 || board.path("nodes").size() > 225
                    || !board.path("name").isTextual() || !within(board.path("requiredLevel"), 1, 100)
                    || !List.of("daevanioncrystal", "battlecrystal").contains(board.path("pointKind").path("code").asText())) invalid("보드 검증 실패");
            boolean hasRoot = false;
            for (JsonNode node : board.path("nodes")) {
                if (!node.path("id").isTextual() || !node.path("name").isTextual() || !node.path("iconPath").isTextual()
                        || !node.path("autoLearn").isBoolean() || !within(node.path("requiredLevel"), 1, 100)) invalid("노드 형식 검증 실패");
                hasRoot |= node.path("autoLearn").asBoolean();
            }
            if (!hasRoot) invalid("보드 시작 노드 누락");
            for (JsonNode node : board.path("nodes")) if (!within(node.path("row"),1,15) || !within(node.path("column"),1,15) || !within(node.path("pointCost"),0,20)) invalid("노드 검증 실패");
        }
        if (fresh.path("characterLevels").isEmpty()) invalid("캐릭터 레벨 누락");
        for (JsonNode level : fresh.path("characterLevels")) {
            if (!within(level.path("level"), 1, 100) || !within(level.path("skillPoints"), 0, 9999)
                    || !within(level.path("stigmaPoints"), 0, 9999) || !within(level.path("stigmaSlots"), 0, 20)
                    || !level.path("daevanionPoints").isArray()) invalid("캐릭터 포인트 검증 실패");
            for (JsonNode points : level.path("daevanionPoints"))
                if (!points.path("kind").isTextual() || !within(points.path("amount"), 0, 9999)) invalid("결정 포인트 검증 실패");
        }
        ObjectNode response = (ObjectNode) catalog(key);
        JsonNode previous = response.path("catalog");
        boolean changed = false;
        for (String field : List.of("skills","boards","characterLevels","version")) changed |= !previous.path(field).equals(fresh.path(field));
        ObjectNode next = fresh.deepCopy();
        next.put("baselineVersion", previous.path("baselineVersion").asText(previous.path("version").asText()));
        next.put("reviewRequired", previous.path("reviewRequired").asBoolean() || changed);
        next.put("origin", "live"); next.put("checkedAt", Instant.now().toString());
        if (changed) next.put("changedAt", Instant.now().toString());
        else if (previous.has("changedAt")) next.set("changedAt", previous.get("changedAt"));
        response.set("catalog", next);
        var history = mapper.createArrayNode();
        history.addObject().put("checked_at", Instant.now().toString()).put("status", changed ? "changed" : "ok").put("message", changed ? "데이터 변경 · 추천 검토 필요" : "카탈로그 확인 · 변경 없음");
        for (JsonNode event : response.path("history")) if (history.size() < 12) history.add(event);
        response.set("history", history);
        jdbc.update("INSERT INTO shadowcraft_catalogs(class_key,payload) VALUES (?,?) ON CONFLICT(class_key) DO UPDATE SET payload=EXCLUDED.payload", key, mapper.writeValueAsString(response));
        return response;
    }
    @Transactional
    public JsonNode updateNews(JsonNode news) throws Exception {
        if (news == null || !news.isObject() || !news.path("contentList").isArray() || news.path("contentList").isEmpty() || news.path("contentList").size() > 100) invalid("공지 형식 변경 · 기존 공지 유지");
        for (JsonNode entry : news.path("contentList"))
            if (!entry.isObject() || entry.path("id").asText().isBlank() || !entry.path("title").isTextual()) invalid("공지 항목 형식 변경 · 기존 공지 유지");
        ObjectNode next = news.deepCopy();
        next.put("checkedAt", Instant.now().toString());
        jdbc.update("INSERT INTO shadowcraft_catalogs(class_key,payload) VALUES (?,?) ON CONFLICT(class_key) DO UPDATE SET payload=EXCLUDED.payload", "official-news", mapper.writeValueAsString(next));
        return next;
    }
    private static boolean within(JsonNode node,int min,int max) { return node.isIntegralNumber() && node.asInt()>=min && node.asInt()<=max; }
    private static void invalid(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
}
