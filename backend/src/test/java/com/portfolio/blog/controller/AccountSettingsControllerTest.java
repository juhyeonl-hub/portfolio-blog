package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.portfolio.blog.service.MemberSessionService;
import com.portfolio.blog.service.JwtService;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
@TestPropertySource(properties="spring.datasource.url=jdbc:h2:mem:accountsettings")
class AccountSettingsControllerTest {
    private static final String API="/api/community/settings";
    @Autowired MockMvc mvc;@Autowired ObjectMapper mapper;@Autowired JdbcTemplate jdbc;
    @Autowired MemberSessionService sessions;@Autowired JwtService jwt;
    private String alice,bob;
    @BeforeEach void setup()throws Exception{
        jdbc.execute("DROP TABLE IF EXISTS shadowcraft_account_settings");
        jdbc.execute("DROP TABLE IF EXISTS shadowcraft_member_sessions");
        jdbc.execute("DROP TABLE IF EXISTS shadowcraft_members");
        jdbc.execute("CREATE TABLE shadowcraft_members(id VARCHAR(36) PRIMARY KEY,username VARCHAR(32),password_hash VARCHAR(100),created_at TIMESTAMP WITH TIME ZONE)");
        jdbc.execute("CREATE TABLE shadowcraft_member_sessions(token_hash VARCHAR(64) PRIMARY KEY,member_id VARCHAR(36),expires_at TIMESTAMP WITH TIME ZONE)");
        try(var in=new ClassPathResource("db/migration/V18__shadowcraft_account_settings.sql").getInputStream()){
            for(String sql:new String(in.readAllBytes(),StandardCharsets.UTF_8).split(";"))if(!sql.isBlank())jdbc.execute(sql);
        }
        jdbc.update("INSERT INTO shadowcraft_members(id,username) VALUES ('alice','alice'),('bob','bob')");
        alice=sessions.create("alice");bob=sessions.create("bob");
    }
    ObjectNode body(long revision){var n=mapper.createObjectNode().put("version",1).put("revision",revision);n.putObject("entries").put("asbc-locale","en");return n;}
    void save(String token,ObjectNode body,int status)throws Exception{mvc.perform(put(API).header("Authorization","Bearer "+token).contentType("application/json").content(body.toString())).andExpect(status().is(status));}
    @Test void onlyAuthenticatedOwnerCanReadAndWrite()throws Exception{
        mvc.perform(get(API)).andExpect(status().isForbidden());
        mvc.perform(put(API).contentType("application/json").content(body(0).toString())).andExpect(status().isForbidden());
        mvc.perform(get(API).header("Authorization","Bearer "+jwt.generateToken("admin"))).andExpect(status().isForbidden());
        mvc.perform(put(API).header("Authorization","Bearer "+jwt.generateToken("admin")).contentType("application/json").content(body(0).toString())).andExpect(status().isForbidden());
        mvc.perform(get(API).header("Authorization","Bearer "+alice)).andExpect(jsonPath("$.revision").value(0));
        save(alice,body(0),200);
        mvc.perform(get(API+"?memberId=alice").header("Authorization","Bearer "+bob)).andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(0));
        var b=body(0);((ObjectNode)b.get("entries")).put("asbc-locale","fi");save(bob,b,200);
        mvc.perform(get(API).header("Authorization","Bearer "+alice)).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andExpect(jsonPath("$.entries.asbc-locale").value("en"));
        var forged=body(1).put("memberId","bob");save(alice,forged,400);
        sessions.revoke(alice);mvc.perform(get(API).header("Authorization","Bearer "+alice)).andExpect(status().isForbidden());
    }
    @Test void schemaTypesAllowlistAndSizeAreValidated()throws Exception{
        for(String json:new String[]{"null","[]","{}","{bad","{\"version\":2,\"revision\":0,\"entries\":{}}","{\"version\":1,\"revision\":-1,\"entries\":{}}","{\"version\":1,\"revision\":0.5,\"entries\":{}}"})
            mvc.perform(put(API).header("Authorization","Bearer "+alice).contentType("application/json").content(json)).andExpect(status().isBadRequest());
        for(String key:new String[]{"token","a2bc-member-session-v1","__proto__","shadowcraft-plan-v1:unknown","asbc-account-cache-v1:bob"}){var b=body(0);((ObjectNode)b.get("entries")).put(key,"secret");save(alice,b,400);}
        var invalid=body(0);((ObjectNode)invalid.get("entries")).put("asbc-locale","xx");save(alice,invalid,400);
        ((ObjectNode)invalid.get("entries")).put("asbc-locale",42);save(alice,invalid,400);
        mvc.perform(put(API).header("Authorization","Bearer "+alice).contentType("application/json").content(" ".repeat(1_000_001))).andExpect(status().isPayloadTooLarge());
        mvc.perform(get(API).header("Authorization","Bearer "+alice)).andExpect(jsonPath("$.revision").value(0));
    }
    @Test void settingsRoundTripAndSensitivePlanFieldsAreRejected()throws Exception{
        var b=body(0);var entries=(ObjectNode)b.get("entries");
        var plan=mapper.createObjectNode().put("classKey","templar").put("level",39).put("mode","safe").putNull("character");
        plan.putObject("base").put("100",5);plan.putObject("bonus");plan.putObject("specs");plan.putArray("nodes");plan.putArray("checked");plan.putObject("confirmedRemaining").put("sp",17);
        plan.putObject("confirmedRemainingContext").put("region","eu").put("serverId","1001").put("characterId","char-1").put("level",39);
        plan.putArray("stigmaSkills").add("100").add("101");
        entries.put("shadowcraft-plan-v1:templar",plan.toString());
        entries.put("favorites","[\"map\",\"quick\"]");
        entries.put("a2bc-event-timers-v1","{\"version\":2,\"region\":\"eu\",\"server\":\"1001\",\"pinned\":[\"rift\"],\"profiles\":{\"eu:1001\":{\"offset\":null,\"timeZone\":\"Europe/Helsinki\",\"hidden\":[],\"times\":{\"rift\":\"09:00, 21:00\"}}}}");
        entries.put("a2bc-map-progress-v1:"+"a".repeat(64),"{\"schema\":\"a2bc-map-progress-v1\",\"completed\":[\"marker-1\"]}");
        save(alice,b,200);
        var response=mapper.readTree(mvc.perform(get(API).header("Authorization","Bearer "+alice)).andReturn().getResponse().getContentAsString());
        assertThat(response.path("entries")).isEqualTo(entries);
        b.put("revision",1);plan.putObject("searchPrefs").put("name","private");entries.put("shadowcraft-plan-v1:templar",plan.toString());save(alice,b,400);
        plan.remove("searchPrefs");plan.putObject("character").put("name","private");entries.put("shadowcraft-plan-v1:templar",plan.toString());save(alice,b,400);
        plan.putNull("character");plan.putObject("confirmedRemaining").put("sp",-1);entries.put("shadowcraft-plan-v1:templar",plan.toString());save(alice,b,400);
    }
    @Test void revisionsPreventLostUpdatesAndDeletionCascades()throws Exception{
        save(alice,body(0),200);save(alice,body(0),409);
        save(alice,body(1),200);
        mvc.perform(get(API).header("Authorization","Bearer "+alice)).andExpect(jsonPath("$.revision").value(2));
        jdbc.update("DELETE FROM shadowcraft_members WHERE id='alice'");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_account_settings",Integer.class)).isZero();
    }
    @Test void serverSaveTimestampIsStableOnReadAndCannotBeForged()throws Exception{
        mvc.perform(get(API).header("Authorization","Bearer "+alice)).andExpect(jsonPath("$.updatedAt").doesNotExist());
        var written=mapper.readTree(mvc.perform(put(API).header("Authorization","Bearer "+alice).contentType("application/json").content(body(0).toString())).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(java.time.Instant.parse(written.path("updatedAt").asText())).isBeforeOrEqualTo(java.time.Instant.now());
        var read=mapper.readTree(mvc.perform(get(API).header("Authorization","Bearer "+alice)).andReturn().getResponse().getContentAsString());
        assertThat(read.path("updatedAt")).isEqualTo(written.path("updatedAt"));
        save(alice,body(1).put("updatedAt","2099-01-01T00:00:00Z"),400);
        save(alice,body(1),200); // Existing clients still send only version/revision/entries.
        mvc.perform(get(API).header("Authorization","Bearer "+alice)).andExpect(jsonPath("$.revision").value(2)).andExpect(jsonPath("$.updatedAt").isString());
    }
    @Test void concurrentFirstSavesCannotOverwriteEachOther()throws Exception{
        var codes=java.util.Collections.synchronizedList(new java.util.ArrayList<Integer>());
        try(var executor=java.util.concurrent.Executors.newFixedThreadPool(2)){
            var start=new java.util.concurrent.CountDownLatch(1);
            var jobs=new java.util.ArrayList<java.util.concurrent.Future<?>>();
            for(int i=0;i<2;i++)jobs.add(executor.submit(()->{try{start.await();codes.add(mvc.perform(put(API).header("Authorization","Bearer "+alice).contentType("application/json").content(body(0).toString())).andReturn().getResponse().getStatus());}catch(Exception e){throw new RuntimeException(e);}}));
            start.countDown();for(var job:jobs)job.get();
        }
        assertThat(codes).containsExactlyInAnyOrder(200,409);
    }
    @Test void tradeBooksAndCraftPlansRoundTripWithoutCrossAccountAccess()throws Exception{
        var b=body(0);var e=(ObjectNode)b.get("entries");
        String workbook="""
            {"version":1,"selected":"ore","legacyImported":false,"books":[{"id":"ore","name":"순수한 오드","entries":[{"id":"buy","kind":"buy","quantity":"100","amount":"13000000","at":"2026-10-25T10:00:00.000Z"},{"id":"sale","kind":"sale","quantity":"25","amount":"3375000","at":"2026-10-25T10:01:00.000Z"}]}]}
            """;
        String plans="""
            {"version":1,"selected":"one","plans":[{"id":"one","name":"제작 계획","draft":{"item":"오드","materials":[{"id":"m","name":"재료","quantity":"10","price":"100","owned":"4"}],"cost":"100","output":"2","sell":"1000","tax":"10","fee":"0","rounding":"up"}}]}
            """;
        e.put("asbc-trade-workbook-v1",workbook);e.put("asbc-craft-plans-v1",plans);save(alice,b,200);
        var response=mapper.readTree(mvc.perform(get(API).header("Authorization","Bearer "+alice)).andReturn().getResponse().getContentAsString());assertThat(response.path("entries")).isEqualTo(e);
        mvc.perform(get(API).header("Authorization","Bearer "+bob)).andExpect(jsonPath("$.entries.asbc-trade-workbook-v1").doesNotExist());
        for(String invalid:new String[]{workbook.replace("\"quantity\":\"25\"","\"quantity\":\"101\""),workbook.replace("\"id\":\"sale\"","\"id\":\"buy\""),workbook.replace("3375000","1000000000000000001"),workbook.replace("2026-10-25T10:01:00.000Z","not-a-date"),workbook.replace("\"name\":\"순수한 오드\"","\"name\":\"순수한 오드\",\"token\":\"secret\"")}){
            var bad=body(1);((ObjectNode)bad.get("entries")).put("asbc-trade-workbook-v1",invalid);save(alice,bad,400);
        }
        var bad=body(1);((ObjectNode)bad.get("entries")).put("asbc-craft-plans-v1",plans.replace("\"owned\":\"4\"","\"owned\":4"));save(alice,bad,400);
        mvc.perform(get(API).header("Authorization","Bearer "+alice)).andExpect(jsonPath("$.revision").value(1));
    }

    @Test void steamLocalesRoundTripWithoutChangingOtherSettings()throws Exception{
        long revision=0;
        for(String language:java.util.List.of("ko","en","ja","fi","fr","de","es","pt-BR","ru")){
            var b=body(revision++);((ObjectNode)b.get("entries")).put("asbc-locale",language).put("shadowcraft-selected-class","templar");save(alice,b,200);
            mvc.perform(get(API).header("Authorization","Bearer "+alice)).andExpect(status().isOk()).andExpect(jsonPath("$.entries.asbc-locale").value(language)).andExpect(jsonPath("$.entries.shadowcraft-selected-class").value("templar"));
        }
        var invalid=body(revision);((ObjectNode)invalid.get("entries")).put("asbc-locale","pt");save(alice,invalid,400);
    }
}
