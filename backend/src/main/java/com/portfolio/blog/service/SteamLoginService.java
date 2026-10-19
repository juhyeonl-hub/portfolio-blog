package com.portfolio.blog.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SteamLoginService {
    /** value = member/SteamID; browser = SHA-256 of the per-browser secret kept in an HttpOnly cookie (CSRF binding). */
    private record Ticket(String value, String browser, Instant expires) {}
    /** Login URL plus the browser secret the controller must set as a cookie. */
    public record Start(String url, String browserSecret) {}
    private final Map<String,Ticket> states=new HashMap<>(), logins=new HashMap<>(), registrations=new HashMap<>();
    private final SecureRandom random=new SecureRandom();
    private final JdbcTemplate jdbc;
    private final SteamOpenIdVerifier verifier;
    private final MemberSessionService sessions;
    private final CommunityService community;
    private final PasswordEncoder passwords;
    private final String publicUrl, planner;
    public SteamLoginService(JdbcTemplate jdbc, SteamOpenIdVerifier verifier, MemberSessionService sessions,
            CommunityService community, PasswordEncoder passwords,
            @Value("${app.steam.public-url:https://juhyeonl.dev}") String publicUrl,
            @Value("${app.steam.planner-path:/lab/shadowcraft/}") String plannerPath) {
        this.jdbc=jdbc;this.verifier=verifier;this.sessions=sessions;this.community=community;this.passwords=passwords;
        this.publicUrl=publicUrl.replaceAll("/+$", "");this.planner=this.publicUrl+plannerPath;
    }
    private String randomCode(){byte[] bytes=new byte[32];random.nextBytes(bytes);return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);}
    private static String digest(String secret){
        try{return HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8)));}
        catch(java.security.NoSuchAlgorithmException e){throw new IllegalStateException(e);}
    }
    public boolean secureCookie(){return publicUrl.startsWith("https://");}
    // 300 s: one Steam round trip plus choosing a username; 10000 caps process-local memory under abuse.
    private synchronized String put(Map<String,Ticket> map,String value,String browser){
        map.values().removeIf(t->!t.expires().isAfter(Instant.now()));
        if(map.size()>=10000)throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"잠시 후 다시 시도하세요.");
        String code=randomCode();map.put(code,new Ticket(value,browser,Instant.now().plusSeconds(300)));return code;
    }
    /** Single use: the ticket is removed even when it belongs to another browser. */
    private synchronized Ticket take(Map<String,Ticket> map,String code,String browserSecret){
        if(code==null)return null;
        Ticket t=map.remove(code);
        if(t==null||!t.expires().isAfter(Instant.now())||browserSecret==null||browserSecret.isEmpty())return null;
        return java.security.MessageDigest.isEqual(t.browser().getBytes(StandardCharsets.UTF_8),digest(browserSecret).getBytes(StandardCharsets.UTF_8))?t:null;
    }
    private String callbackUrl(String state){return publicUrl+"/api/community/auth/steam/callback?state="+state;}
    public Start start(String member){
        String secret=randomCode();
        String state=put(states,member,digest(secret));
        var params=new LinkedHashMap<String,String>();
        params.put("openid.ns","http://specs.openid.net/auth/2.0");params.put("openid.mode","checkid_setup");
        params.put("openid.return_to",callbackUrl(state));params.put("openid.realm",publicUrl+"/");
        params.put("openid.identity","http://specs.openid.net/auth/2.0/identifier_select");params.put("openid.claimed_id",params.get("openid.identity"));
        return new Start(verifier.endpoint()+"?"+params.entrySet().stream().map(e->URLEncoder.encode(e.getKey(),StandardCharsets.UTF_8)+"="+URLEncoder.encode(e.getValue(),StandardCharsets.UTF_8)).collect(java.util.stream.Collectors.joining("&")),secret);
    }
    @Transactional
    /** browserSecret comes from the cookie set at start/link: a URL forwarded to another browser is rejected. */
    public String callback(Map<String,String> params,String browserSecret){
        String state=params.get("state");Ticket ticket=take(states,state,browserSecret);
        if(ticket==null)return planner+"#steam-error=expired";
        String claimed=params.getOrDefault("openid.claimed_id","");
        if(!"id_res".equals(params.get("openid.mode"))||!verifier.endpoint().equals(params.get("openid.op_endpoint"))
            ||!claimed.matches("https://steamcommunity\\.com/openid/id/(7656119\\d{10})")
            ||!claimed.equals(params.get("openid.identity"))||!callbackUrl(state).equals(params.get("openid.return_to"))
            // Every field this method relies on must be covered by Steam's signature (check_authentication verifies it).
            ||!Arrays.asList(params.getOrDefault("openid.signed","").split(",")).containsAll(List.of("claimed_id","identity","return_to","op_endpoint")))return planner+"#steam-error=failed";
        var openid=new HashMap<String,String>();params.forEach((k,v)->{if(k.startsWith("openid."))openid.put(k,v);});
        if(!verifier.verify(openid))return planner+"#steam-error=failed";
        String steam=claimed.substring(claimed.lastIndexOf('/')+1);
        var owners=jdbc.queryForList("SELECT member_id FROM shadowcraft_member_steam WHERE steam_id=?",String.class,steam);
        if(ticket.value()!=null){
            if(!owners.isEmpty())return planner+(owners.getFirst().equals(ticket.value())?"#steam-linked=1":"#steam-error=taken");
            if(!jdbc.queryForList("SELECT steam_id FROM shadowcraft_member_steam WHERE member_id=?",String.class,ticket.value()).isEmpty())return planner+"#steam-error=already";
            // Portable duplicate handling (same as register): a concurrent link of the same SteamID or member loses cleanly.
            try{link(steam,ticket.value());}catch(DuplicateKeyException e){return planner+"#steam-error=taken";}
            return planner+"#steam-linked=1";
        }
        return planner+(owners.isEmpty()?"#steam-new="+put(registrations,steam,ticket.browser()):"#steam-code="+put(logins,owners.getFirst(),ticket.browser()));
    }
    public Map<String,Object> exchange(String code,String browserSecret){Ticket t=take(logins,code,browserSecret);if(t==null)throw expired();return result(t.value());}
    @Transactional
    public synchronized Map<String,Object> register(String code,String rawUsername,String browserSecret){
        // Same normalisation as password signup: usernames are stored lowercase.
        String username=rawUsername==null?null:rawUsername.toLowerCase(Locale.ROOT);
        if(username==null||!username.matches("[a-z0-9_]{3,32}"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"아이디는 영문·숫자·밑줄 3~32자로 입력하세요.");
        // Checked before the one-time code is consumed, so the user can retry with another name.
        if(CommunityService.reservedUsername(username))throw new ResponseStatusException(HttpStatus.CONFLICT,"사용할 수 없는 아이디입니다.");
        Ticket t=take(registrations,code,browserSecret);if(t==null)throw expired();
        String id=UUID.randomUUID().toString();
        try{jdbc.update("INSERT INTO shadowcraft_members(id,username,password_hash,created_at) VALUES (?,?,?,?)",id,username,passwords.encode(randomCode()),Timestamp.from(Instant.now()));}
        catch(DuplicateKeyException e){synchronized(this){registrations.put(code,t);}throw new ResponseStatusException(HttpStatus.CONFLICT,"사용할 수 없는 아이디입니다.");}
        try{link(t.value(),id);}catch(DuplicateKeyException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"이미 연결된 Steam 계정입니다.");}
        return result(id);
    }
    private void link(String steam,String member){jdbc.update("INSERT INTO shadowcraft_member_steam(steam_id,member_id,linked_at) VALUES (?,?,?)",steam,member,Timestamp.from(Instant.now()));}
    private Map<String,Object> result(String id){return Map.of("token",sessions.create(id),"member",community.member(id));}
    private ResponseStatusException expired(){return new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Steam 로그인이 만료되었습니다. 다시 시도하세요.");}
}
