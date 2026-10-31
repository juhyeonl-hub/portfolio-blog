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
@org.springframework.test.context.TestPropertySource(properties="app.community.password-auth-enabled=true")
class CommunityControllerTest {
 @Autowired MockMvc mvc;@Autowired ObjectMapper mapper;@Autowired JdbcTemplate jdbc;@Autowired JwtService jwt;
 private static final String API="/api/community",PUBLIC="/api/public/shadowcraft/builds";
 @BeforeEach void setup()throws Exception{
  jdbc.execute("CREATE TABLE IF NOT EXISTS shadowcraft_catalogs(class_key VARCHAR(32) PRIMARY KEY,payload TEXT NOT NULL)");
  jdbc.execute("DELETE FROM shadowcraft_catalogs");
  for(String table:new String[]{"shadowcraft_reports","shadowcraft_build_comments","shadowcraft_build_votes","shadowcraft_member_sessions","shadowcraft_member_steam","shadowcraft_public_builds","shadowcraft_members"})jdbc.execute("DROP TABLE IF EXISTS "+table);
  for(String file:new String[]{"V13__shadowcraft_public_builds.sql","V14__shadowcraft_community.sql","V15__shadowcraft_steam_links.sql","V16__shadowcraft_reports.sql","V17__shadowcraft_drop_comments.sql"})try(var in=new ClassPathResource("db/migration/"+file).getInputStream()){for(String sql:new String(in.readAllBytes(),StandardCharsets.UTF_8).split(";"))if(!sql.isBlank())jdbc.execute(sql);}
 }
 String register(String name)throws Exception{var result=mvc.perform(post(API+"/auth/register").contentType("application/json").content("{\"username\":\""+name+"\",\"password\":\"testPassword123!\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.member.username").value(name)).andExpect(jsonPath("$.token").doesNotExist()).andReturn();return result.getResponse().getCookie("__Host-asbc_session").getValue();}
 ObjectNode payload(){var r=mapper.createObjectNode().put("title","Member build").put("description","My allocation").put("published",true);var shared=r.putObject("shared");shared.put("schema","a2bc-share-v1").put("catalogVersion","2.0.7.0");var p=shared.putObject("plan");p.put("classKey","assassin").put("level",45).put("mode","safe").put("extraSP",0).put("extraStigma",0).put("extraCrystal",0).put("extraBattle",0).putNull("character");p.putObject("base");p.putObject("bonus");p.putObject("specs");p.putArray("nodes");p.putArray("checked");return r;}
 String create(String token)throws Exception{return mapper.readTree(mvc.perform(post(API+"/builds").header("Authorization","Bearer "+token).contentType("application/json").content(payload().toString())).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asText();}
 @Test void authorCanPublishAndEditStructuredGuideWithoutReplacingOtherPosts()throws Exception{
  String owner=register("guide_owner"),other=register("guide_other");var body=payload();
  var shared=(ObjectNode)body.path("shared");((ObjectNode)shared.path("plan")).putArray("stigmaSkills").add("13270000");
  var guide=shared.putObject("guide").put("skills","Use this skill first").put("daevanion","Connect from the center").put("equipment","Keep a small budget");
  guide.putArray("items").addObject().put("slot","MainHand").put("name","Author weapon").put("upgrade","+7").put("options","Skill +1").put("reason","Temporary choice");
  var result=mvc.perform(post(API+"/builds").header("Authorization","Bearer "+owner).contentType("application/json").content(body.toString())).andExpect(status().isCreated()).andReturn();
  String id=mapper.readTree(result.getResponse().getContentAsString()).path("id").asText();
  mvc.perform(get(PUBLIC+"/"+id)).andExpect(status().isOk()).andExpect(jsonPath("$.shared.guide.items[0].name").value("Author weapon")).andExpect(jsonPath("$.shared.plan.stigmaSkills[0]").value("13270000"));
  body.put("revision",0);guide.put("skills","Changed guidance");
  mvc.perform(put(API+"/builds/"+id).header("Authorization","Bearer "+other).contentType("application/json").content(body.toString())).andExpect(status().isNotFound());
  mvc.perform(put(API+"/builds/"+id).header("Authorization","Bearer "+owner).contentType("application/json").content(body.toString())).andExpect(status().isOk()).andExpect(jsonPath("$.shared.guide.skills").value("Changed guidance"));
  mvc.perform(put(API+"/builds/"+id).header("Authorization","Bearer "+owner).contentType("application/json").content(body.toString())).andExpect(status().isConflict());
 }
 @Test void rejectsInvalidGuideAndStigmaWithoutSaving()throws Exception{
  String token=register("guide_invalid");
  for(String bad:new String[]{"private","length","duplicate","slot","stigma"}){
   var body=payload();var shared=(ObjectNode)body.path("shared");var g=shared.putObject("guide").put("skills","").put("daevanion","").put("equipment","");
   var items=g.putArray("items");var item=items.addObject().put("slot","MainHand").put("name","Weapon").put("upgrade","").put("options","").put("reason","");
   switch(bad){case "private"->item.put("owner","private");case "length"->g.put("skills","x".repeat(601));case "duplicate"->items.add(item.deepCopy());case "slot"->item.put("slot","unknown");case "stigma"->((ObjectNode)shared.path("plan")).putArray("stigmaSkills").add("13010000");}
   mvc.perform(post(API+"/builds").header("Authorization","Bearer "+token).contentType("application/json").content(body.toString())).andExpect(status().isBadRequest());
  }
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_public_builds",Integer.class)).isZero();
 }
 @Test void pvpModeBuildsCanBePublishedAndReplaced()throws Exception{
  String token=register("member_pvp");
  var body=payload();((ObjectNode)body.path("shared").path("plan")).put("mode","pvp");
  String id=mapper.readTree(mvc.perform(post(API+"/builds").header("Authorization","Bearer "+token).contentType("application/json").content(body.toString())).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asText();
  mvc.perform(get("/api/public/shadowcraft/builds/"+id)).andExpect(status().isOk()).andExpect(jsonPath("$.shared.plan.mode").value("pvp"));
  body.put("revision",0);
  mvc.perform(put(API+"/builds/"+id).header("Authorization","Bearer "+token).contentType("application/json").content(body.toString())).andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(1));
  body.remove("revision");
  ((ObjectNode)body.path("shared").path("plan")).put("mode","arena");
  mvc.perform(post(API+"/builds").header("Authorization","Bearer "+token).contentType("application/json").content(body.toString())).andExpect(status().isBadRequest());
 }
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
 @Test void deletingAnAccountRemovesEverythingItOwns()throws Exception{
  String leaving=register("leaving_member"),staying=register("staying_member");
  String leavingId=mapper.readTree(mvc.perform(get(API+"/me").header("Authorization","Bearer "+leaving)).andReturn().getResponse().getContentAsString()).path("id").asText();
  String own=create(leaving),other=create(staying);
  jdbc.update("INSERT INTO shadowcraft_member_steam(steam_id,member_id,linked_at) VALUES ('76561190000000001',?,CURRENT_TIMESTAMP)",leavingId);
  mvc.perform(put(API+"/builds/"+other+"/vote").header("Authorization","Bearer "+leaving)).andExpect(status().is2xxSuccessful());
  mvc.perform(post(API+"/builds/"+other+"/report").header("Authorization","Bearer "+leaving).contentType("application/json").content("{\"reason\":\"spam\"}")).andExpect(status().isCreated());
  // Not signed in, or the username not typed again exactly: nothing is deleted.
  mvc.perform(delete(API+"/me").contentType("application/json").content("{\"username\":\"leaving_member\"}")).andExpect(status().isForbidden());
  mvc.perform(delete(API+"/me").header("Authorization","Bearer "+leaving).contentType("application/json").content("{\"username\":\"staying_member\"}")).andExpect(status().isBadRequest());
  mvc.perform(delete(API+"/me").header("Authorization","Bearer "+leaving)).andExpect(status().isBadRequest());
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_members",Integer.class)).isEqualTo(2);
  mvc.perform(delete(API+"/me").header("Authorization","Bearer "+leaving).contentType("application/json").content("{\"username\":\" Leaving_Member \"}")).andExpect(status().isNoContent());
  for(String table:new String[]{"shadowcraft_member_sessions","shadowcraft_member_steam","shadowcraft_build_votes","shadowcraft_reports"})
   assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM "+table+" WHERE "+(table.equals("shadowcraft_reports")?"reporter_id":"member_id")+"=?",Integer.class,leavingId)).as(table).isZero();
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_public_builds WHERE author_id=?",Integer.class,leavingId)).isZero();
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_public_builds WHERE id=?",Integer.class,other)).isEqualTo(1);
  mvc.perform(get(API+"/me").header("Authorization","Bearer "+leaving)).andExpect(status().isForbidden());
  mvc.perform(post(API+"/auth/login").contentType("application/json").content("{\"username\":\"leaving_member\",\"password\":\"testPassword123!\"}")).andExpect(status().isUnauthorized());
  mvc.perform(get(API+"/me").header("Authorization","Bearer "+staying)).andExpect(status().isOk());
 }
 @Test void parallelReportsRespectTheHourlyLimit()throws Exception{
  String owner=register("limit_owner"),reporter=register("limit_reporter"),id=create(owner),path=API+"/builds/"+id;
  String me=mapper.readTree(mvc.perform(get("/api/community/me").header("Authorization","Bearer "+reporter)).andReturn().getResponse().getContentAsString()).path("id").asText();
  // 19 reports already filed this hour (distinct earlier targets on the same build).
  for(int i=0;i<19;i++)jdbc.update("INSERT INTO shadowcraft_reports(id,target_key,build_id,reporter_id,reason,created_at) VALUES (?,?,?,?, 'spam', CURRENT_TIMESTAMP)",java.util.UUID.randomUUID().toString(),"build:earlier-"+i,id,me);
  var targets=new java.util.ArrayList<String>();
  for(int i=0;i<5;i++)targets.add(create(owner));
  var codes=java.util.Collections.synchronizedList(new java.util.ArrayList<Integer>());
  try(var executor=java.util.concurrent.Executors.newFixedThreadPool(5)){
   var jobs=new java.util.ArrayList<java.util.concurrent.Future<?>>();
   for(String target:targets)jobs.add(executor.submit(()->{try{codes.add(mvc.perform(post(API+"/builds/"+target+"/report").header("Authorization","Bearer "+reporter).contentType("application/json").content("{\"reason\":\"spam\"}")).andReturn().getResponse().getStatus());}catch(Exception e){throw new RuntimeException(e);}}));
   for(var job:jobs)job.get();
  }
  assertThat(codes.stream().filter(c->c==201).count()).isEqualTo(1);assertThat(codes.stream().filter(c->c==429).count()).isEqualTo(4);
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_reports WHERE reporter_id=?",Integer.class,me)).isEqualTo(20);
 }
 @Test void reportsQueueAndModeration()throws Exception{
  String owner=register("report_owner"),other=register("report_other"),third=register("report_third"),id=create(owner),path=API+"/builds/"+id;
  String admin="Bearer "+jwt.generateToken("admin");
  // Members only, valid reasons, not one's own content, once per target.
  mvc.perform(post(path+"/report").contentType("application/json").content("{\"reason\":\"spam\"}")).andExpect(status().isForbidden());
  mvc.perform(post(path+"/report").header("Authorization","Bearer "+other).contentType("application/json").content("{\"reason\":\"bogus\"}")).andExpect(status().isBadRequest());
  mvc.perform(post(path+"/report").header("Authorization","Bearer "+owner).contentType("application/json").content("{\"reason\":\"spam\"}")).andExpect(status().isBadRequest());
  mvc.perform(post(path+"/report").header("Authorization","Bearer "+other).contentType("application/json").content("{\"reason\":\"spam\",\"detail\":\"ad link\"}")).andExpect(status().isCreated());
  mvc.perform(post(path+"/report").header("Authorization","Bearer "+other).contentType("application/json").content("{\"reason\":\"abuse\"}")).andExpect(status().isConflict());
  mvc.perform(post(path+"/report").header("Authorization","Bearer "+third).contentType("application/json").content("{\"reason\":\"hate\"}")).andExpect(status().isCreated());
  mvc.perform(post(API+"/builds/missing/report").header("Authorization","Bearer "+other).contentType("application/json").content("{\"reason\":\"abuse\"}")).andExpect(status().isNotFound());
  // Admin queue: grouped by target, most reported first; members cannot read it.
  mvc.perform(get("/api/admin/shadowcraft/reports").header("Authorization","Bearer "+other)).andExpect(status().isForbidden());
  var queue=mapper.readTree(mvc.perform(get("/api/admin/shadowcraft/reports").header("Authorization",admin)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).path("items");
  assertThat(queue.size()).isEqualTo(1);assertThat(queue.get(0).path("targetKey").asText()).isEqualTo("build:"+id);assertThat(queue.get(0).path("count").asInt()).isEqualTo(2);
  assertThat(queue.get(0).path("details").toString()).contains("ad link");assertThat(queue.get(0).path("type").asText()).isEqualTo("build");assertThat(queue.get(0).path("author").asText()).isEqualTo("report_owner");
  // Comment targets no longer exist.
  mvc.perform(post("/api/admin/shadowcraft/reports/resolve").header("Authorization",admin).contentType("application/json").content("{\"targetKey\":\"comment:x\",\"action\":\"dismiss\"}")).andExpect(status().isBadRequest());
  // Hide unpublishes the build and closes its reports.
  mvc.perform(post("/api/admin/shadowcraft/reports/resolve").header("Authorization",admin).contentType("application/json").content("{\"targetKey\":\"build:"+id+"\",\"action\":\"hide\"}")).andExpect(status().isOk());
  mvc.perform(get(PUBLIC+"/"+id)).andExpect(status().isNotFound());
  assertThat(mapper.readTree(mvc.perform(get("/api/admin/shadowcraft/reports").header("Authorization",admin)).andReturn().getResponse().getContentAsString()).path("items").size()).isZero();
  mvc.perform(post("/api/admin/shadowcraft/reports/resolve").header("Authorization",admin).contentType("application/json").content("{\"targetKey\":\"build:"+id+"\",\"action\":\"dismiss\"}")).andExpect(status().isNotFound());
  // Delete removes a reported build and its reports.
  String id2=create(owner),path2=API+"/builds/"+id2;
  mvc.perform(post(path2+"/report").header("Authorization","Bearer "+other).contentType("application/json").content("{\"reason\":\"abuse\"}")).andExpect(status().isCreated());
  mvc.perform(post("/api/admin/shadowcraft/reports/resolve").header("Authorization",admin).contentType("application/json").content("{\"targetKey\":\"build:"+id2+"\",\"action\":\"delete\"}")).andExpect(status().isOk());
  mvc.perform(get(PUBLIC+"/"+id2)).andExpect(status().isNotFound());
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_reports WHERE build_id=?",Integer.class,id2)).isZero();
 }
 @Test void offensiveTitlesAndDescriptionsAreRefused()throws Exception{
  String owner=register("content_check"),id=create(owner),path=API+"/builds/"+id;
  for(String[] f:new String[][]{{"title","씨발 빌드"},{"description","heil hitler"},{"title","kim jong un ranger"}}){
   var bad=payload().put(f[0],f[1]);
   mvc.perform(post(API+"/builds").header("Authorization","Bearer "+owner).contentType("application/json").content(bad.toString())).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("부적절한 표현이 포함되어 있습니다. 수정한 뒤 다시 시도하세요."));
   mvc.perform(put(path).header("Authorization","Bearer "+owner).contentType("application/json").content(bad.put("revision",0).toString())).andExpect(status().isBadRequest());
  }
  mvc.perform(put(path).header("Authorization","Bearer "+owner).contentType("application/json").content(payload().put("title","Assassin classic burst").put("revision",0).toString())).andExpect(status().isOk());
 }
 @Test void ownershipPrivacyVotesAndCascade()throws Exception{
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
  mvc.perform(put(path+"/vote").header("Authorization","Bearer "+other)).andExpect(status().isOk());
  mvc.perform(delete(path).param("revision","1").header("Authorization","Bearer "+owner)).andExpect(status().isNoContent());
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
