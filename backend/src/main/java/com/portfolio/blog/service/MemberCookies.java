package com.portfolio.blog.service;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

/** Authentication token never leaves HttpOnly storage. CSRF proof is derived from, but cannot recover, the random token. */
@Service
public class MemberCookies {
 public static final String AUTH_ATTRIBUTE="asbc.cookie-auth";
 private final boolean secure;
 public MemberCookies(@Value("${app.steam.public-url:https://juhyeonl.dev}")String publicUrl){secure=publicUrl.startsWith("https://");}
 public String name(){return secure?"__Host-asbc_session":"asbc_session_dev";}
 public String read(HttpServletRequest request){if(request.getCookies()!=null)for(var cookie:request.getCookies())if(name().equals(cookie.getName()))return cookie.getValue();return null;}
 public String credential(HttpServletRequest request){String authorization=request.getHeader("Authorization");return authorization!=null&&authorization.startsWith("Bearer ")?authorization.substring(7):read(request);}
 public String set(String token){return ResponseCookie.from(name(),token).httpOnly(true).secure(secure).sameSite("Strict").path("/").maxAge(token.isEmpty()?0:86400).build().toString();}
 public String csrf(String token){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(("ASBC-CSRF-v1:"+token).getBytes(StandardCharsets.UTF_8)));}catch(java.security.NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
 public boolean matches(String token,String supplied){return token!=null&&supplied!=null&&supplied.matches("[0-9a-f]{64}")&&MessageDigest.isEqual(csrf(token).getBytes(StandardCharsets.UTF_8),supplied.getBytes(StandardCharsets.UTF_8));}
 public Map<String,Object> response(Map<String,Object> result){String token=(String)result.get("token");return Map.of("member",result.get("member"),"csrfToken",csrf(token));}
}
