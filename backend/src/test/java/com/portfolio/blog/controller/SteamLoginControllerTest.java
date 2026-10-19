package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.*;
import com.portfolio.blog.service.SteamOpenIdVerifier;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class SteamLoginControllerTest {
 static final String API="/api/community/auth/steam", ENDPOINT="https://steamcommunity.com/openid/login", STEAM="76561191234567890";
 @Autowired MockMvc mvc; @Autowired ObjectMapper mapper; @Autowired JdbcTemplate jdbc;
 @MockBean SteamOpenIdVerifier verifier;
 String address;
 @BeforeEach void setup(){
  address=UUID.randomUUID().toString();
  jdbc.execute("CREATE TABLE IF NOT EXISTS shadowcraft_members(id VARCHAR(36) PRIMARY KEY,username VARCHAR(32) NOT NULL UNIQUE,password_hash VARCHAR(255) NOT NULL,created_at TIMESTAMP WITH TIME ZONE NOT NULL)");
  jdbc.execute("CREATE TABLE IF NOT EXISTS shadowcraft_member_sessions(token_hash VARCHAR(64) PRIMARY KEY,member_id VARCHAR(36) NOT NULL REFERENCES shadowcraft_members(id) ON DELETE CASCADE,expires_at TIMESTAMP WITH TIME ZONE NOT NULL)");
  jdbc.execute("CREATE TABLE IF NOT EXISTS shadowcraft_member_steam(steam_id VARCHAR(20) PRIMARY KEY,member_id VARCHAR(36) NOT NULL UNIQUE REFERENCES shadowcraft_members(id) ON DELETE CASCADE,linked_at TIMESTAMP WITH TIME ZONE NOT NULL)");
  jdbc.update("DELETE FROM shadowcraft_member_steam");
  when(verifier.endpoint()).thenReturn(ENDPOINT);when(verifier.verify(anyMap())).thenReturn(true);
 }
 /** The current test browser: the Steam binding cookie set by start/link, sent back like a real browser. */
 jakarta.servlet.http.Cookie browser;
 Map<String,String> query(String url){var p=new HashMap<String,String>();for(String part:URI.create(url).getRawQuery().split("&")){var kv=part.split("=",2);p.put(URLDecoder.decode(kv[0],StandardCharsets.UTF_8),URLDecoder.decode(kv[1],StandardCharsets.UTF_8));}return p;}
 String start()throws Exception{var res=mvc.perform(get(API+"/start").with(r->{r.setRemoteAddr(address);return r;})).andExpect(status().isFound()).andExpect(header().string("Cache-Control","no-store")).andReturn().getResponse();browser=res.getCookie("asbc_steam");assertThat(browser).isNotNull();assertThat(browser.isHttpOnly()).isTrue();return res.getHeader("Location");}
 Map<String,String> assertion(String url,String steam){var q=query(url);var p=new HashMap<String,String>();p.put("state",query(q.get("openid.return_to")).get("state"));p.put("openid.mode","id_res");p.put("openid.op_endpoint",ENDPOINT);p.put("openid.claimed_id","https://steamcommunity.com/openid/id/"+steam);p.put("openid.identity",p.get("openid.claimed_id"));p.put("openid.return_to",q.get("openid.return_to"));p.put("openid.signed","op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle");return p;}
 String callback(Map<String,String> p)throws Exception{var r=get(API+"/callback");p.forEach(r::param);if(browser!=null)r.cookie(browser);return mvc.perform(r).andExpect(status().isFound()).andExpect(header().string("Cache-Control","no-store")).andReturn().getResponse().getHeader("Location");}
 String code(String url,String kind){assertThat(url).startsWith("https://juhyeonl.dev/lab/shadowcraft/#"+kind+"=");return url.substring(url.indexOf('=')+1);}
 JsonNode postJson(String path,Map<String,String> body,int expected)throws Exception{var req=post(path);if(browser!=null)req.cookie(browser);return mapper.readTree(mvc.perform(req.with(r->{r.setRemoteAddr(address);return r;}).contentType("application/json").content(mapper.writeValueAsString(body))).andExpect(status().is(expected)).andExpect(header().string("Cache-Control","no-store")).andReturn().getResponse().getContentAsString());}
 JsonNode member(String name)throws Exception{return postJson("/api/community/auth/register",Map.of("username",name,"password","testPassword123!"),200);}
 String link(String token)throws Exception{var res=mvc.perform(post(API+"/link").header("Authorization","Bearer "+token)).andExpect(status().isOk()).andReturn().getResponse();browser=res.getCookie("asbc_steam");assertThat(browser).isNotNull();return mapper.readTree(res.getContentAsString()).path("url").asText();}
 @Test void startParametersAndLinkProtection()throws Exception{
  String url=start();assertThat(url).startsWith(ENDPOINT+"?");var p=query(url);
  assertThat(p).containsEntry("openid.realm","https://juhyeonl.dev/").containsEntry("openid.mode","checkid_setup").containsEntry("openid.ns","http://specs.openid.net/auth/2.0");
  assertThat(p.get("openid.return_to")).matches("https://juhyeonl.dev/api/community/auth/steam/callback\\?state=[A-Za-z0-9_-]{43}");
  mvc.perform(post(API+"/link")).andExpect(status().isForbidden());
 }
 @Test void registrationLoginAndOneTimeCodes()throws Exception{
  String c=code(callback(assertion(start(),STEAM)),"steam-new");var result=postJson(API+"/register",Map.of("code",c,"username","steam_"+System.nanoTime()),200);
  assertThat(result.path("member").path("steamLinked").asBoolean()).isTrue();assertThat(result.toString()).doesNotContain(STEAM);
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_member_steam WHERE member_id=?",Integer.class,result.path("member").path("id").asText())).isEqualTo(1);
  mvc.perform(get("/api/community/me").header("Authorization","Bearer "+result.path("token").asText())).andExpect(status().isOk()).andExpect(jsonPath("$.steamLinked").value(true)).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString(STEAM))));
  postJson(API+"/register",Map.of("code",c,"username","unused_name"),401);
  String login=code(callback(assertion(start(),STEAM)),"steam-code");assertThat(postJson(API+"/exchange",Map.of("code",login),200).path("member").path("id")).isEqualTo(result.path("member").path("id"));postJson(API+"/exchange",Map.of("code",login),401);
 }
 @Test void forgedCallbacksAndStateReplay()throws Exception{
  var p=assertion(start(),STEAM);when(verifier.verify(anyMap())).thenReturn(false);assertThat(callback(p)).endsWith("#steam-error=failed");when(verifier.verify(anyMap())).thenReturn(true);assertThat(callback(p)).endsWith("#steam-error=expired");
  for(String key:List.of("openid.claimed_id","openid.return_to","openid.op_endpoint","openid.identity","openid.mode","openid.signed")){var bad=assertion(start(),STEAM);bad.put(key,"forged");assertThat(callback(bad)).endsWith("#steam-error=failed");}
  var missing=assertion(start(),STEAM);missing.remove("state");assertThat(callback(missing)).endsWith("#steam-error=expired");
 }
 @Test void linkingConflictsAndPasswordLogin()throws Exception{
  String name="pw_"+System.nanoTime();var m=member(name);String token=m.path("token").asText();
  mvc.perform(get("/api/community/me").header("Authorization","Bearer "+token)).andExpect(jsonPath("$.steamLinked").value(false));
  assertThat(callback(assertion(link(token),STEAM))).endsWith("#steam-linked=1");assertThat(callback(assertion(link(token),STEAM))).endsWith("#steam-linked=1");
  assertThat(callback(assertion(link(token),"76561191234567891"))).endsWith("#steam-error=already");String other=member("pw_"+System.nanoTime()).path("token").asText();assertThat(callback(assertion(link(other),STEAM))).endsWith("#steam-error=taken");
  postJson("/api/community/auth/login",Map.of("username",name,"password","testPassword123!"),200);
 }
 @Test void flowsAreBoundToTheStartingBrowser()throws Exception{
  // Login CSRF: a callback URL completed in another browser (no or different cookie) is rejected.
  var p=assertion(start(),STEAM);browser=null;assertThat(callback(p)).endsWith("#steam-error=expired");
  var q=assertion(start(),STEAM);var other=new jakarta.servlet.http.Cookie("asbc_steam","x".repeat(43));browser=other;assertThat(callback(q)).endsWith("#steam-error=expired");
  // Codes issued to one browser cannot be redeemed by another, and are burned by the attempt.
  String name="bind_"+System.nanoTime();String c=code(callback(assertion(start(),"76561198111111111")),"steam-new");var mine=browser;
  browser=other;postJson(API+"/register",Map.of("code",c,"username",name),401);browser=mine;postJson(API+"/register",Map.of("code",c,"username",name),401);
  String n=code(callback(assertion(start(),"76561198222222222")),"steam-new");postJson(API+"/register",Map.of("code",n,"username",name),200);
  String login=code(callback(assertion(start(),"76561198222222222")),"steam-code");mine=browser;browser=other;postJson(API+"/exchange",Map.of("code",login),401);browser=mine;postJson(API+"/exchange",Map.of("code",login),401);
  // Link CSRF: an attacker's link URL completed by a victim browser does not link the victim's Steam.
  String attacker=member("atk_"+System.nanoTime()).path("token").asText();var url=link(attacker);var victim=new jakarta.servlet.http.Cookie("asbc_steam","v".repeat(43));browser=victim;
  assertThat(callback(assertion(url,"76561198333333333"))).endsWith("#steam-error=expired");
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_member_steam WHERE steam_id=?",Integer.class,"76561198333333333")).isZero();
 }
 @Test void signedFieldsAndUsernameNormalisation()throws Exception{
  for(String signed:List.of("op_endpoint,claimed_id,identity,response_nonce","claimed_id,identity,return_to","op_endpoint,claimed_id,return_to")){var p=assertion(start(),STEAM);p.put("openid.signed",signed);assertThat(callback(p)).endsWith("#steam-error=failed");}
  String c=code(callback(assertion(start(),"76561198765432101")),"steam-new");String name="Steam_Upper_"+(System.nanoTime()%100000);
  assertThat(postJson(API+"/register",Map.of("code",c,"username",name),200).path("member").path("username").asText()).isEqualTo(name.toLowerCase(java.util.Locale.ROOT));
 }
 @Test void duplicateNameCanRetrySameCode()throws Exception{
  String name="dup_"+System.nanoTime();member(name);String c=code(callback(assertion(start(),STEAM)),"steam-new");
  postJson(API+"/register",Map.of("code",c,"username","INVALID!"),400);postJson(API+"/register",Map.of("code",c,"username",name),409);postJson(API+"/register",Map.of("code",c,"username","new_"+System.nanoTime()),200);
 }
}
