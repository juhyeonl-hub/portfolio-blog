package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@EnableScheduling
public class CommunityService {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwords;
    private final MemberSessionService sessions;
    private final PublicBuildService builds;
    private final String dummyHash;
    // Bounded, short-lived process-local abuse protection; never trust forwarded headers.
    private final Map<String, List<Long>> attempts = new HashMap<>();
    public CommunityService(JdbcTemplate jdbc, PasswordEncoder passwords, MemberSessionService sessions, PublicBuildService builds) {
        this.jdbc=jdbc;this.passwords=passwords;this.sessions=sessions;this.builds=builds;
        dummyHash=passwords.encode(UUID.randomUUID().toString());
    }
    /** True for usernames new accounts may not take (see UsernamePolicy). Login does not check this. */
    public static boolean reservedUsername(String username) { return UsernamePolicy.blocked(username); }
    public synchronized void throttle(String address) {
        long now=System.currentTimeMillis();
        purgeAttempts(now);
        if(attempts.size()>=10000&&!attempts.containsKey(address))fail(HttpStatus.TOO_MANY_REQUESTS,"잠시 후 다시 시도하세요.");
        var times=attempts.computeIfAbsent(address,k->new ArrayList<>());
        if(times.size()>=20)fail(HttpStatus.TOO_MANY_REQUESTS,"로그인 시도가 많습니다. 10분 후 다시 시도하세요.");
        times.add(now);
    }
    /** Addresses are kept only for the 10-minute window (privacy policy), also when no further attempt arrives. */
    @Scheduled(fixedDelay = 60_000)
    public void purgeExpiredAttempts() { purgeAttempts(System.currentTimeMillis()); }
    synchronized void purgeAttempts(long now) {
        attempts.values().forEach(a->a.removeIf(t->t<now-600_000));
        attempts.entrySet().removeIf(e->e.getValue().isEmpty());
    }
    synchronized int trackedAttemptKeys() { return attempts.size(); }
    @Transactional
    public Map<String,Object> authenticate(JsonNode body,boolean register) {
        String username=text(body,"username",32).toLowerCase(Locale.ROOT), password=text(body,"password",72);
        if(!username.matches("[a-z0-9_]{3,32}")||password.length()<10||password.getBytes(StandardCharsets.UTF_8).length>72)
            fail(HttpStatus.BAD_REQUEST,"아이디는 영문·숫자·밑줄 3~32자, 비밀번호는 10자 이상 72바이트 이하로 입력하세요.");
        String id;
        if(register) {
            // Same response as a taken name, so the reserved list is not revealed.
            if(reservedUsername(username))fail(HttpStatus.CONFLICT,"사용할 수 없는 아이디입니다.");
            id=UUID.randomUUID().toString();
            try {jdbc.update("INSERT INTO shadowcraft_members(id,username,password_hash,created_at) VALUES (?,?,?,?)",id,username,passwords.encode(password),Timestamp.from(Instant.now()));}
            catch(DuplicateKeyException e){fail(HttpStatus.CONFLICT,"사용할 수 없는 아이디입니다.");}
        } else {
            var rows=jdbc.queryForList("SELECT id,password_hash FROM shadowcraft_members WHERE username=?",username);
            String hash=rows.isEmpty()?dummyHash:(String)rows.getFirst().get("password_hash");
            if(!passwords.matches(password,hash)||rows.isEmpty())fail(HttpStatus.UNAUTHORIZED,"아이디 또는 비밀번호를 확인하세요.");
            id=(String)rows.getFirst().get("id");
        }
        return Map.of("token",sessions.create(id),"member",member(id));
    }
    public Map<String,Object> member(String id) {
        var rows=jdbc.query("SELECT id,username,EXISTS(SELECT 1 FROM shadowcraft_member_steam s WHERE s.member_id=shadowcraft_members.id) AS steam_linked FROM shadowcraft_members WHERE id=?",(r,n)->Map.<String,Object>of("id",r.getString("id"),"username",r.getString("username"),"steamLinked",r.getBoolean("steam_linked")),id);
        if(rows.isEmpty())fail(HttpStatus.UNAUTHORIZED,"다시 로그인하세요.");
        return rows.getFirst();
    }
    @Transactional
    public ObjectNode save(String member,String id,JsonNode body)throws Exception {
        member(member);
        if(id!=null)own(member,id);
        else jdbc.queryForList("SELECT id FROM shadowcraft_members WHERE id=? FOR UPDATE",member);
        if(id==null&&(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_public_builds WHERE author_id=?",Long.class,member)>=100))
            fail(HttpStatus.TOO_MANY_REQUESTS,"계정당 빌드는 최대 100개입니다.");
        var result=builds.save(id,body);
        if(id==null)jdbc.update("UPDATE shadowcraft_public_builds SET author_id=? WHERE id=?",member,result.path("id").asText());
        return builds.get(result.path("id").asText(),true);
    }
    @Transactional
    public void delete(String member,String id,long revision) {own(member,id);builds.delete(id,revision);}
    /** Deletes the account and everything it owns (privacy policy); the username is typed again to confirm. Builds are
     *  removed first because public builds reference their author without cascading; the rest cascades from the member. */
    @Transactional
    public void deleteAccount(String member,JsonNode body) {
        var rows=jdbc.queryForList("SELECT username FROM shadowcraft_members WHERE id=? FOR UPDATE",member);
        if(rows.isEmpty())fail(HttpStatus.NOT_FOUND,"계정을 찾을 수 없습니다.");
        String typed=body==null?"":body.path("username").asText("").trim().toLowerCase(Locale.ROOT);
        if(!typed.equals(rows.get(0).get("username")))fail(HttpStatus.BAD_REQUEST,"확인을 위해 아이디를 정확히 입력하세요.");
        jdbc.update("DELETE FROM shadowcraft_public_builds WHERE author_id=?",member);
        jdbc.update("DELETE FROM shadowcraft_members WHERE id=?",member);
    }
    private void own(String member,String id) {
        var rows=jdbc.queryForList("SELECT author_id FROM shadowcraft_public_builds WHERE id=? FOR UPDATE",String.class,id);
        if(rows.isEmpty()||!member.equals(rows.getFirst()))fail(HttpStatus.NOT_FOUND,"내 빌드를 찾을 수 없습니다.");
    }
    @Transactional
    public Map<String,Object> vote(String member,String id,boolean selected) {
        lockPublic(id);
        if(selected) {
            if(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_build_votes WHERE build_id=? AND member_id=?",Long.class,id,member)==0)
                jdbc.update("INSERT INTO shadowcraft_build_votes(build_id,member_id) VALUES (?,?)",id,member);
        } else jdbc.update("DELETE FROM shadowcraft_build_votes WHERE build_id=? AND member_id=?",id,member);
        return social(id,member,0);
    }
    public Map<String,Object> social(String id,String member,int page) {
        builds.get(id,false);
        if(page<0||page>10000)fail(HttpStatus.BAD_REQUEST,"페이지를 확인하세요.");
        var comments=jdbc.query("SELECT c.id,c.member_id AS author_id,m.username AS author,c.body,c.created_at FROM shadowcraft_build_comments c JOIN shadowcraft_members m ON m.id=c.member_id WHERE c.build_id=? ORDER BY c.created_at DESC,c.id LIMIT 20 OFFSET ?",(r,n)->Map.of("id",r.getString("id"),"author_id",r.getString("author_id"),"author",r.getString("author"),"body",r.getString("body"),"created_at",r.getTimestamp("created_at").toInstant().toString()),id,page*20);
        return Map.of("votes",jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_build_votes WHERE build_id=?",Long.class,id),
            "voted",member!=null&&jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_build_votes WHERE build_id=? AND member_id=?",Long.class,id,member)>0,
            "comments",comments,"page",page,"totalComments",jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_build_comments WHERE build_id=?",Long.class,id));
    }
    @Transactional
    public void comment(String member,String id,JsonNode body) {
        String message=text(body,"body",1000).trim();
        if(message.isEmpty())fail(HttpStatus.BAD_REQUEST,"댓글을 입력하세요.");
        if(ContentPolicy.blocked(message))fail(HttpStatus.BAD_REQUEST,"부적절한 표현이 포함되어 있습니다. 수정한 뒤 다시 시도하세요.");
        lockPublic(id);
        // Lock author as well to bound concurrent comments across different builds.
        jdbc.queryForList("SELECT id FROM shadowcraft_members WHERE id=? FOR UPDATE",member);
        if(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_build_comments WHERE member_id=? AND created_at>?",Long.class,member,Timestamp.from(Instant.now().minusSeconds(60)))>=5)
            fail(HttpStatus.TOO_MANY_REQUESTS,"댓글은 1분에 5개까지 작성할 수 있습니다.");
        jdbc.update("INSERT INTO shadowcraft_build_comments(id,build_id,member_id,body,created_at) VALUES (?,?,?,?,?)",UUID.randomUUID().toString(),id,member,message,Timestamp.from(Instant.now()));
    }
    public void deleteComment(String member,String id,String comment,boolean admin) {
        if(jdbc.update("DELETE FROM shadowcraft_build_comments WHERE id=? AND build_id=? AND (?=TRUE OR member_id=?)",comment,id,admin,member)!=1)
            fail(HttpStatus.NOT_FOUND,"삭제할 댓글을 찾을 수 없습니다.");
    }
    private void lockPublic(String id) {
        if(jdbc.queryForList("SELECT id FROM shadowcraft_public_builds WHERE id=? AND published=TRUE FOR UPDATE",id).isEmpty())fail(HttpStatus.NOT_FOUND,"공개된 빌드를 찾을 수 없습니다.");
    }
    private String text(JsonNode body,String field,int max) {
        if(body==null||!body.path(field).isTextual()||body.path(field).asText().length()>max)fail(HttpStatus.BAD_REQUEST,"입력 형식을 확인하세요.");
        return body.path(field).asText();
    }
    private static void fail(HttpStatus status,String message){throw new ResponseStatusException(status,message);}
}
