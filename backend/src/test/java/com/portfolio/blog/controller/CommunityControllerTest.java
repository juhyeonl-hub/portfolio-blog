package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.portfolio.blog.service.JwtService;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class CommunityControllerTest {
 @Autowired MockMvc mvc;@Autowired ObjectMapper mapper;@Autowired JdbcTemplate jdbc;@Autowired JwtService jwt;
 private static final String API="/api/community",PUBLIC="/api/public/shadowcraft/builds";
 @BeforeEach void setup()throws Exception{
  jdbc.execute("CREATE TABLE IF NOT EXISTS shadowcraft_catalogs(class_key VARCHAR(32) PRIMARY KEY,payload TEXT NOT NULL)");
  jdbc.execute("DELETE FROM shadowcraft_catalogs");
  for(String table:new String[]{"shadowcraft_build_comments","shadowcraft_build_votes","shadowcraft_member_sessions","shadowcraft_member_steam","shadowcraft_public_builds","shadowcraft_members"})jdbc.execute("DROP TABLE IF EXISTS "+table);
  for(String file:new String[]{"V13__shadowcraft_public_builds.sql","V14__shadowcraft_community.sql","V15__shadowcraft_steam_links.sql"})try(var in=new ClassPathResource("db/migration/"+file).getInputStream()){for(String sql:new String(in.readAllBytes(),StandardCharsets.UTF_8).split(";"))if(!sql.isBlank())jdbc.execute(sql);}
 }
 String register(String name)throws Exception{return mapper.readTree(mvc.perform(post(API+"/auth/register").contentType("application/json").content("{\"username\":\""+name+"\",\"password\":\"testPassword123!\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.member.username").value(name)).andReturn().getResponse().getContentAsString()).path("token").asText();}
 ObjectNode payload(){var r=mapper.createObjectNode().put("title","Member build").put("description","My allocation").put("published",true);var shared=r.putObject("shared");shared.put("schema","a2bc-share-v1").put("catalogVersion","2.0.7.0");var p=shared.putObject("plan");p.put("classKey","assassin").put("level",45).put("mode","safe").put("extraSP",0).put("extraStigma",0).put("extraCrystal",0).put("extraBattle",0).putNull("character");p.putObject("base");p.putObject("bonus");p.putObject("specs");p.putArray("nodes");p.putArray("checked");return r;}
 String create(String token)throws Exception{return mapper.readTree(mvc.perform(post(API+"/builds").header("Authorization","Bearer "+token).contentType("application/json").content(payload().toString())).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asText();}
 @Test void rolesSessionsAndPasswordValidation()throws Exception{
  String token=register("member_auth");
  mvc.perform(get(API+"/me").header("Authorization","Bearer "+token)).andExpect(status().isOk()).andExpect(jsonPath("$.username").value("member_auth"));
  mvc.perform(get("/api/admin/shadowcraft/builds").header("Authorization","Bearer "+token)).andExpect(status().isForbidden());
  mvc.perform(get("/api/admin/shadowcraft/builds").header("Authorization","Bearer "+jwt.generateToken("admin"))).andExpect(status().isOk());
  mvc.perform(get("/api/admin/shadowcraft/builds").header("X-API-Key","test-api-key")).andExpect(status().isOk());
  mvc.perform(post(API+"/builds").contentType("application/json").content(payload().toString())).andExpect(status().isForbidden());
  mvc.perform(post(API+"/auth/login").contentType("application/json").content("{\"username\":\"member_auth\",\"password\":\"wrongPassword123\"}")).andExpect(status().isUnauthorized());
  mvc.perform(post(API+"/auth/register").contentType("application/json").content("{\"username\":\"member_auth\",\"password\":\"testPassword123!\"}")).andExpect(status().isConflict());
  mvc.perform(post(API+"/auth/register").contentType("application/json").content("{\"username\":\"bad\",\"password\":\"short\"}")).andExpect(status().isBadRequest());
  assertThat(jdbc.queryForObject("SELECT password_hash FROM shadowcraft_members",String.class)).startsWith("$2");
  assertThat(jdbc.queryForObject("SELECT token_hash FROM shadowcraft_member_sessions",String.class)).doesNotContain(token);
  mvc.perform(post(API+"/logout").header("Authorization","Bearer "+token)).andExpect(status().isNoContent());
  mvc.perform(get(API+"/me").header("Authorization","Bearer "+token)).andExpect(status().isForbidden());
  String other=register("expired_member");jdbc.update("UPDATE shadowcraft_member_sessions SET expires_at=?",java.sql.Timestamp.from(java.time.Instant.now().minusSeconds(1)));
  mvc.perform(get(API+"/me").header("Authorization","Bearer "+other)).andExpect(status().isForbidden());
 }
 @Test void ownershipPrivacyVotesCommentsAndCascade()throws Exception{
  String owner=register("owner_flow"),other=register("other_flow"),id=create(owner),path=API+"/builds/"+id;
  mvc.perform(get(PUBLIC)).andExpect(jsonPath("$.items[0].author").value("owner_flow"));
  var input=payload().put("revision",0).put("title","Changed");
  mvc.perform(put(path).header("Authorization","Bearer "+other).contentType("application/json").content(input.toString())).andExpect(status().isNotFound());
  mvc.perform(delete(path).param("revision","0").header("Authorization","Bearer "+other)).andExpect(status().isNotFound());
  mvc.perform(put(path).header("Authorization","Bearer "+owner).contentType("application/json").content(input.toString())).andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(1));
  mvc.perform(put(path).header("Authorization","Bearer "+owner).contentType("application/json").content(input.toString())).andExpect(status().isConflict());
  var privateBody=payload();((ObjectNode)privateBody.path("shared").path("plan")).putObject("character").put("name","private");
  mvc.perform(post(API+"/builds").header("Authorization","Bearer "+owner).contentType("application/json").content(privateBody.toString())).andExpect(status().isBadRequest());
  for(int i=0;i<2;i++)mvc.perform(put(path+"/vote").header("Authorization","Bearer "+other)).andExpect(status().isOk()).andExpect(jsonPath("$.votes").value(1)).andExpect(jsonPath("$.voted").value(true));
  mvc.perform(get(PUBLIC+"/"+id+"/community")).andExpect(jsonPath("$.voted").value(false));
  mvc.perform(delete(path+"/vote").header("Authorization","Bearer "+other)).andExpect(jsonPath("$.votes").value(0));
  mvc.perform(post(path+"/comments").header("Authorization","Bearer "+other).contentType("application/json").content("{\"body\":\"Good build <script>not html</script>\"}")).andExpect(status().isCreated());
  var social=mapper.readTree(mvc.perform(get(PUBLIC+"/"+id+"/community")).andExpect(jsonPath("$.comments[0].author").value("other_flow")).andReturn().getResponse().getContentAsString());
  String comment=social.path("comments").get(0).path("id").asText();
  mvc.perform(delete(path+"/comments/"+comment).header("Authorization","Bearer "+owner)).andExpect(status().isNotFound());
  mvc.perform(delete(path+"/comments/"+comment).header("Authorization","Bearer "+other)).andExpect(status().isNoContent());
  for(int i=0;i<5;i++)mvc.perform(post(path+"/comments").header("Authorization","Bearer "+owner).contentType("application/json").content("{\"body\":\"comment\"}")).andExpect(status().isCreated());
  mvc.perform(post(path+"/comments").header("Authorization","Bearer "+owner).contentType("application/json").content("{\"body\":\"too many\"}")).andExpect(status().isTooManyRequests());
  mvc.perform(put(path+"/vote").header("Authorization","Bearer "+other)).andExpect(status().isOk());
  mvc.perform(delete(path).param("revision","1").header("Authorization","Bearer "+owner)).andExpect(status().isNoContent());
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_build_comments",Integer.class)).isZero();
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_build_votes",Integer.class)).isZero();
 }
 @Test void malformedHiddenAndLegacyAdminBuilds()throws Exception{
  String token=register("legacy_test");var input=payload().put("published",false);
  var result=mvc.perform(post("/api/admin/shadowcraft/builds").header("X-API-Key","test-api-key").contentType("application/json").content(input.toString())).andExpect(status().isCreated()).andReturn();
  String id=mapper.readTree(result.getResponse().getContentAsString()).path("id").asText();
  mvc.perform(put(API+"/builds/"+id+"/vote").header("Authorization","Bearer "+token)).andExpect(status().isNotFound());
  mvc.perform(delete(API+"/builds/"+id).param("revision","0").header("Authorization","Bearer "+token)).andExpect(status().isNotFound());
  mvc.perform(post(API+"/builds").header("Authorization","Bearer "+token).contentType("application/json").content("x".repeat(32001))).andExpect(status().isPayloadTooLarge());
  mvc.perform(post(API+"/auth/login").contentType("application/json").content("null")).andExpect(status().isBadRequest());
 }
 @Test void concurrentRecommendationsRemainUnique()throws Exception {
  String token=register("concurrent_vote"),id=create(token);
  try(var executor=java.util.concurrent.Executors.newFixedThreadPool(6)) {
   var jobs=new java.util.ArrayList<java.util.concurrent.Future<?>>();
   for(int i=0;i<6;i++)jobs.add(executor.submit(()->{try{mvc.perform(put(API+"/builds/"+id+"/vote").header("Authorization","Bearer "+token)).andExpect(status().isOk());}catch(Exception e){throw new RuntimeException(e);}}));
   for(var job:jobs)job.get();
  }
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_build_votes",Integer.class)).isEqualTo(1);
 }

 @Test void authorFilterAndRecommendationOrder()throws Exception {
  String one=register("filter_one"),two=register("filter_two"),first=create(one),second=create(two);
  mvc.perform(put(API+"/builds/"+first+"/vote").header("Authorization","Bearer "+two)).andExpect(status().isOk());
  String author=jdbc.queryForObject("SELECT id FROM shadowcraft_members WHERE username='filter_one'",String.class);
  mvc.perform(get(PUBLIC).param("sort","votes")).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].id").value(first));
  mvc.perform(get(PUBLIC).param("author",author)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.items[0].id").value(first));
  mvc.perform(get(PUBLIC).param("author","invalid")).andExpect(status().isBadRequest());
  mvc.perform(get(PUBLIC).param("sort","unknown")).andExpect(status().isBadRequest());
  var revised=payload().put("revision",0);((ObjectNode)revised.path("shared").path("plan")).put("level",44);
  mvc.perform(put(API+"/builds/"+first).header("Authorization","Bearer "+one).contentType("application/json").content(revised.toString())).andExpect(status().isOk()).andExpect(jsonPath("$.shared.plan.level").value(44)).andExpect(jsonPath("$.votes").value(1));
  mvc.perform(get(PUBLIC+"/"+second)).andExpect(jsonPath("$.shared.plan.level").value(45));
 }

}
