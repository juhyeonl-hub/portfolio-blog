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
 @Test @WithMockUser(roles="ADMIN") void eightClassesAndStablePagination()throws Exception {
  for(String key:new String[]{"assassin","gladiator","templar","ranger","sorcerer","elementalist","cleric","chanter"}){var input=payload(key);input.put("published",true);create(input);}
  for(int i=0;i<13;i++){var input=payload("assassin");input.put("published",true);create(input);}
  mvc.perform(get(PUBLIC)).andExpect(jsonPath("$.totalElements").value(21)).andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.items.length()").value(20));
  mvc.perform(get(PUBLIC).param("page","1")).andExpect(jsonPath("$.items.length()").value(1));
 }
}
