package com.portfolio.blog.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Base64;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/** Separate opaque tokens cannot be interpreted as administrator JWTs. */
@Service
public class MemberSessionService {
    private final JdbcTemplate jdbc;
    private final SecureRandom random = new SecureRandom();
    public MemberSessionService(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public String create(String memberId) {
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        String token = "a2bc_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        jdbc.update("DELETE FROM shadowcraft_member_sessions WHERE expires_at <= ?", Timestamp.from(Instant.now()));
        jdbc.update("INSERT INTO shadowcraft_member_sessions(token_hash,member_id,expires_at) VALUES (?,?,?)",
                hash(token), memberId, Timestamp.from(Instant.now().plusSeconds(86400)));
        return token;
    }
    public String member(String token) {
        if (token == null || !token.matches("a2bc_[A-Za-z0-9_-]{43}")) return null;
        var rows = jdbc.queryForList("SELECT member_id FROM shadowcraft_member_sessions WHERE token_hash=? AND expires_at>?",
                String.class, hash(token), Timestamp.from(Instant.now()));
        return rows.isEmpty() ? null : rows.getFirst();
    }
    public void revoke(String token) { jdbc.update("DELETE FROM shadowcraft_member_sessions WHERE token_hash=?", hash(token)); }
    private String hash(String token) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
        catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
