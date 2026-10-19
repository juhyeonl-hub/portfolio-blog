package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Member reports on public builds and comments, and the administrator's review queue.
 * Nothing is hidden automatically: a few accounts could otherwise take down someone else's post.
 */
@Service
public class ReportService {
    static final Set<String> REASONS = Set.of("spam", "abuse", "hate", "sexual", "other");
    // A member may file at most 20 reports per hour; the queue lists at most 100 targets at once.
    private static final int HOURLY_LIMIT = 20, QUEUE_LIMIT = 100;
    private final JdbcTemplate jdbc;
    public ReportService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** commentId is null for a report on the build itself. */
    @Transactional
    public void report(String member, String buildId, String commentId, JsonNode body) {
        String reason = body == null ? "" : body.path("reason").asText("");
        String detail = body == null ? "" : body.path("detail").asText("").trim();
        if (!REASONS.contains(reason)) fail(HttpStatus.BAD_REQUEST, "신고 사유를 선택하세요.");
        if (detail.length() > 300) fail(HttpStatus.BAD_REQUEST, "신고 설명은 300자 이하로 입력하세요.");
        var builds = jdbc.queryForList("SELECT author_id FROM shadowcraft_public_builds WHERE id=? AND published=TRUE", buildId);
        if (builds.isEmpty()) fail(HttpStatus.NOT_FOUND, "공개된 빌드를 찾을 수 없습니다.");
        String owner = (String) builds.getFirst().get("author_id");
        if (commentId != null) {
            var comments = jdbc.queryForList("SELECT member_id FROM shadowcraft_build_comments WHERE id=? AND build_id=?", commentId, buildId);
            if (comments.isEmpty()) fail(HttpStatus.NOT_FOUND, "신고할 댓글을 찾을 수 없습니다.");
            owner = (String) comments.getFirst().get("member_id");
        }
        if (member.equals(owner)) fail(HttpStatus.BAD_REQUEST, "자신의 글은 신고할 수 없습니다.");
        Long recent = jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_reports WHERE reporter_id=? AND created_at>?", Long.class,
                member, Timestamp.from(Instant.now().minusSeconds(3600)));
        if (recent != null && recent >= HOURLY_LIMIT) fail(HttpStatus.TOO_MANY_REQUESTS, "신고는 1시간에 20건까지 할 수 있습니다.");
        String key = commentId == null ? "build:" + buildId : "comment:" + commentId;
        try {
            jdbc.update("INSERT INTO shadowcraft_reports(id,target_key,build_id,comment_id,reporter_id,reason,detail,created_at) VALUES (?,?,?,?,?,?,?,?)",
                    UUID.randomUUID().toString(), key, buildId, commentId, member, reason, detail, Timestamp.from(Instant.now()));
        } catch (DuplicateKeyException e) {
            fail(HttpStatus.CONFLICT, "이미 신고했습니다.");
        }
    }

    /** Open reports grouped by target, most-reported first. */
    public List<Map<String, Object>> openQueue() {
        var rows = jdbc.queryForList(
                "SELECT r.target_key,r.build_id,r.comment_id,r.reason,r.detail,r.created_at,b.title,b.published,ba.username AS build_author,c.body AS comment_body,ca.username AS comment_author "
                        + "FROM shadowcraft_reports r JOIN shadowcraft_public_builds b ON b.id=r.build_id "
                        + "LEFT JOIN shadowcraft_members ba ON ba.id=b.author_id "
                        + "LEFT JOIN shadowcraft_build_comments c ON c.id=r.comment_id LEFT JOIN shadowcraft_members ca ON ca.id=c.member_id "
                        + "WHERE r.resolved_at IS NULL ORDER BY r.created_at DESC");
        Map<String, Map<String, Object>> groups = new LinkedHashMap<>();
        for (var r : rows) {
            var g = groups.computeIfAbsent((String) r.get("target_key"), k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                boolean comment = r.get("comment_id") != null;
                m.put("targetKey", k); m.put("type", comment ? "comment" : "build"); m.put("buildId", r.get("build_id"));
                m.put("buildTitle", r.get("title")); m.put("published", r.get("published"));
                m.put("author", comment ? r.get("comment_author") : r.get("build_author"));
                m.put("text", comment ? r.get("comment_body") : r.get("title"));
                m.put("count", 0); m.put("reasons", new TreeSet<String>()); m.put("details", new ArrayList<String>());
                m.put("latest", String.valueOf(r.get("created_at")));
                return m;
            });
            g.put("count", (Integer) g.get("count") + 1);
            @SuppressWarnings("unchecked") var reasons = (Set<String>) g.get("reasons"); reasons.add((String) r.get("reason"));
            @SuppressWarnings("unchecked") var details = (List<String>) g.get("details");
            String detail = (String) r.get("detail");
            if (detail != null && !detail.isBlank() && details.size() < 5) details.add(detail);
        }
        return groups.values().stream()
                .sorted(Comparator.comparing((Map<String, Object> g) -> -(Integer) g.get("count")))
                .limit(QUEUE_LIMIT).toList();
    }

    /** dismiss: close the reports; hide: unpublish the build; delete: remove the build or comment (reports cascade). */
    @Transactional
    public Map<String, Object> resolve(String targetKey, String action) {
        if (targetKey == null || !targetKey.matches("(build|comment):[A-Za-z0-9-]{1,36}")) fail(HttpStatus.BAD_REQUEST, "신고 대상을 확인하세요.");
        var open = jdbc.queryForList("SELECT build_id,comment_id FROM shadowcraft_reports WHERE target_key=? AND resolved_at IS NULL", targetKey);
        if (open.isEmpty()) fail(HttpStatus.NOT_FOUND, "처리할 신고가 없습니다.");
        String buildId = (String) open.getFirst().get("build_id"), commentId = (String) open.getFirst().get("comment_id");
        Timestamp now = Timestamp.from(Instant.now());
        switch (action == null ? "" : action) {
            case "dismiss" -> jdbc.update("UPDATE shadowcraft_reports SET resolved_at=? WHERE target_key=? AND resolved_at IS NULL", now, targetKey);
            case "hide" -> {
                // Unpublishing is for builds; a reported comment is dismissed or deleted, never hides its build.
                if (commentId != null) fail(HttpStatus.BAD_REQUEST, "댓글은 삭제하거나 문제없음으로 처리하세요.");
                jdbc.update("UPDATE shadowcraft_public_builds SET published=FALSE,revision=revision+1,updated_at=? WHERE id=?", now, buildId);
                jdbc.update("UPDATE shadowcraft_reports SET resolved_at=? WHERE build_id=? AND resolved_at IS NULL", now, buildId);
            }
            case "delete" -> {
                if (commentId == null) jdbc.update("DELETE FROM shadowcraft_public_builds WHERE id=?", buildId);
                else jdbc.update("DELETE FROM shadowcraft_build_comments WHERE id=?", commentId);
            }
            default -> fail(HttpStatus.BAD_REQUEST, "처리 방법을 선택하세요.");
        }
        return Map.of("targetKey", targetKey, "action", action);
    }

    private static void fail(HttpStatus status, String message) { throw new ResponseStatusException(status, message); }
}
