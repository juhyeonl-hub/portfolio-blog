package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class PublicBuildControllerTest {
 @Autowired MockMvc mvc;@Autowired ObjectMapper mapper;@Autowired JdbcTemplate jdbc;
 private static final String ADMIN="/api/admin/shadowcraft/builds",PUBLIC="/api/public/shadowcraft/builds";
 @BeforeEach void setup()throws Exception {
  jdbc.execute("CREATE TABLE IF NOT EXISTS shadowcraft_catalogs(class_key VARCHAR(32) PRIMARY KEY,payload TEXT NOT NULL)");
  jdbc.execute("DELETE FROM shadowcraft_catalogs");
  for(String table:new String[]{"shadowcraft_build_comments","shadowcraft_build_votes","shadowcraft_member_sessions","shadowcraft_public_builds","shadowcraft_members"})jdbc.execute("DROP TABLE IF EXISTS "+table);
  for(String migration:new String[]{"V13__shadowcraft_public_builds.sql","V14__shadowcraft_community.sql"})try(var input=new ClassPathResource("db/migration/"+migration).getInputStream()){for(String sql:new String(input.readAllBytes(),StandardCharsets.UTF_8).split(";"))if(!sql.isBlank())jdbc.execute(sql);}
 }
 private ObjectNode payload(String key)throws Exception {
  ObjectNode request=mapper.createObjectNode().put("title","Example 100%_ build").put("description","Reviewed allocation").put("published",false);
  var shared=request.putObject("shared");shared.put("schema","a2bc-share-v1").put("catalogVersion","2.0.7.0");
  var p=shared.putObject("plan");p.put("classKey",key).put("level",45).put("mode","safe").put("extraSP",0).put("extraStigma",0).put("extraCrystal",0).put("extraBattle",0).putNull("character");
  p.putObject("base");p.putObject("bonus");p.putObject("specs");p.putArray("nodes");p.putArray("checked");return request;
 }
 private ObjectNode create(ObjectNode input)throws Exception{return (ObjectNode)mapper.readTree(mvc.perform(post(ADMIN).contentType("application/json").content(input.toString())).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());}
 @Test void anonymousCannotPublishAndSpoofedHeadersDoNotAuthenticate()throws Exception {
  mvc.perform(post(ADMIN).header("oai-authenticated-user-id","owner").contentType("application/json").content(payload("assassin").toString())).andExpect(status().isForbidden());
  mvc.perform(get(ADMIN)).andExpect(status().isForbidden());
  mvc.perform(get(PUBLIC)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
  mvc.perform(get("/api/public/shadowcraft/build-authors")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
 }
 @Test @WithMockUser(roles="USER") void ordinaryUsersCannotWrite()throws Exception{mvc.perform(post(ADMIN).contentType("application/json").content(payload("assassin").toString())).andExpect(status().isForbidden());}
 @Test @WithMockUser(roles="ADMIN") void draftPublishSearchConflictUnpublishDelete()throws Exception {
  var input=payload("assassin");var saved=create(input);String id=saved.path("id").asText();
  mvc.perform(get(PUBLIC+"/"+id)).andExpect(status().isNotFound());mvc.perform(get(PUBLIC)).andExpect(jsonPath("$.totalElements").value(0));
  mvc.perform(get(ADMIN+"/"+id)).andExpect(status().isOk()).andExpect(jsonPath("$.shared.plan.character").isEmpty());
  input.put("published",true).put("revision",0);
  mvc.perform(put(ADMIN+"/"+id).contentType("application/json").content(input.toString())).andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(1));
  mvc.perform(get(PUBLIC).param("class","assassin").param("q","100%_")).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.items[0].shared").doesNotExist());
  mvc.perform(get(PUBLIC).param("class","gladiator")).andExpect(jsonPath("$.totalElements").value(0));
  mvc.perform(get(PUBLIC+"/"+id)).andExpect(status().isOk());
  mvc.perform(put(ADMIN+"/"+id).contentType("application/json").content(input.toString())).andExpect(status().isConflict());
  mvc.perform(delete(ADMIN+"/"+id).param("revision","0")).andExpect(status().isConflict());
  input.put("published",false).put("revision",1);
  mvc.perform(put(ADMIN+"/"+id).contentType("application/json").content(input.toString())).andExpect(status().isOk());
  mvc.perform(get(PUBLIC+"/"+id)).andExpect(status().isNotFound());
  mvc.perform(delete(ADMIN+"/"+id).param("revision","2")).andExpect(status().isNoContent());
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_public_builds",Integer.class)).isZero();
 }
 @Test @WithMockUser(roles="ADMIN") void rejectsPrivateMalformedUnknownAndOversizedInputs()throws Exception {
  for(String json:new String[]{"null","[]","bad","{}"})mvc.perform(post(ADMIN).contentType("application/json").content(json)).andExpect(status().isBadRequest());
  var input=payload("assassin");((ObjectNode)input.path("shared").path("plan")).put("searchPrefs","private");
  mvc.perform(post(ADMIN).contentType("application/json").content(input.toString())).andExpect(status().isBadRequest());
  input=payload("assassin");((ObjectNode)input.path("shared").path("plan").path("base")).put("999999999",1);
  mvc.perform(post(ADMIN).contentType("application/json").content(input.toString())).andExpect(status().isBadRequest());
  input=payload("assassin");((ObjectNode)input.path("shared").path("plan")).put("extraSP",4294967297L);
  mvc.perform(post(ADMIN).contentType("application/json").content(input.toString())).andExpect(status().isBadRequest());
  mvc.perform(post(ADMIN).contentType("application/json").content("x".repeat(32001))).andExpect(status().isPayloadTooLarge());
  mvc.perform(get(PUBLIC).param("page","-1")).andExpect(status().isBadRequest());
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_public_builds",Integer.class)).isZero();
 }
 @Test @WithMockUser(roles="ADMIN") void validationMessagesIdentifyTheInputWithoutChangingAcceptance()throws Exception {
  var input=payload("assassin").put("title","");
  mvc.perform(post(ADMIN).contentType("application/json").content(input.toString())).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("제목은 1~80자로 입력해 주세요."));
  input=payload("assassin").put("description","x".repeat(2001));
  mvc.perform(post(ADMIN).contentType("application/json").content(input.toString())).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("설명은 2,000자 이하로 입력해 주세요."));
  input=payload("assassin").put("published","yes");
  mvc.perform(post(ADMIN).contentType("application/json").content(input.toString())).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("게시물의 공개 설정을 확인하지 못했습니다. 작성 내용을 따로 보관한 뒤 페이지를 새로고침해 주세요."));
  input=payload("assassin");((ObjectNode)input.path("shared").path("plan")).put("level",46);
  mvc.perform(post(ADMIN).contentType("application/json").content(input.toString())).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("공개할 빌드의 레벨과 플레이 목적을 확인해 주세요."));
  input=payload("assassin");((ObjectNode)input.path("shared").path("plan")).putObject("character");
  mvc.perform(post(ADMIN).contentType("application/json").content(input.toString())).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("공개 빌드에는 연결한 캐릭터와 개인 완료 기록을 포함할 수 없습니다. 빌드 편집 화면에서 다시 저장해 주세요."));
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_public_builds",Integer.class)).isZero();
  create(payload("assassin").put("title","x".repeat(80)).put("description","x".repeat(2000)));
  assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_public_builds",Integer.class)).isEqualTo(1);
 }
 @Test @WithMockUser(roles="ADMIN") void eightClassesAndStablePagination()throws Exception {
  for(String key:new String[]{"assassin","gladiator","templar","ranger","sorcerer","elementalist","cleric","chanter"}){var input=payload(key);input.put("published",true);create(input);}
  for(int i=0;i<13;i++){var input=payload("assassin");input.put("published",true);create(input);}
  mvc.perform(get(PUBLIC)).andExpect(jsonPath("$.totalElements").value(21)).andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.items.length()").value(20));
  mvc.perform(get(PUBLIC).param("page","1")).andExpect(jsonPath("$.items.length()").value(1));
 }
 private String author(String name){String id=java.util.UUID.randomUUID().toString();jdbc.update("INSERT INTO shadowcraft_members(id,username,password_hash,created_at) VALUES (?,?,?,CURRENT_TIMESTAMP)",id,name,"test-only");return id;}
 private void authored(String author,boolean published)throws Exception{var value=payload("templar");value.put("published",published);String id=create(value).path("id").asText();jdbc.update("UPDATE shadowcraft_public_builds SET author_id=? WHERE id=?",author,id);}
 @Test @WithMockUser(roles="ADMIN") void authorsExposeOnlyPublishedAccountsAndLiteralNames()throws Exception {
  String visible=author("Player%_One"),privateOnly=author("Private Only");author("No Posts");
  authored(visible,true);authored(visible,true);authored(visible,false);authored(privateOnly,false);create(payload("templar").put("published",true));
  mvc.perform(get("/api/public/shadowcraft/build-authors").param("q","PLAYER%_"))
   .andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.items[0].id").value(visible)).andExpect(jsonPath("$.items[0].builds").value(2)).andExpect(jsonPath("$.items[0].password_hash").doesNotExist());
  mvc.perform(get("/api/public/shadowcraft/build-authors").param("q","Private")).andExpect(jsonPath("$.totalElements").value(0));
  mvc.perform(get("/api/public/shadowcraft/build-authors").param("q","No Posts")).andExpect(jsonPath("$.totalElements").value(0));
  mvc.perform(get(PUBLIC).param("author",visible)).andExpect(jsonPath("$.totalElements").value(2)).andExpect(jsonPath("$.items[0].authorId").value(visible));
  mvc.perform(get("/api/public/shadowcraft/build-authors").param("q","x".repeat(33))).andExpect(status().isBadRequest());
  mvc.perform(get("/api/public/shadowcraft/build-authors").param("page","-1")).andExpect(status().isBadRequest());
 }
 @Test @WithMockUser(roles="ADMIN") void authorsPaginateWithoutDuplicateRows()throws Exception {
  for(int i=0;i<21;i++){String id=author(String.format("Writer%02d",i));authored(id,true);authored(id,true);}
  mvc.perform(get("/api/public/shadowcraft/build-authors")).andExpect(jsonPath("$.totalElements").value(21)).andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.items.length()").value(20)).andExpect(jsonPath("$.items[0].name").value("Writer00"));
  mvc.perform(get("/api/public/shadowcraft/build-authors").param("page","1")).andExpect(jsonPath("$.items.length()").value(1)).andExpect(jsonPath("$.items[0].name").value("Writer20")).andExpect(jsonPath("$.items[0].builds").value(2));
 }
}
