package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.blog.service.ShadowcraftService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ShadowcraftControllerTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper mapper;
    @Autowired ShadowcraftService service;
    @BeforeEach void setup() {
        jdbc.execute("CREATE TABLE IF NOT EXISTS shadowcraft_catalogs(class_key VARCHAR(32) PRIMARY KEY,payload TEXT NOT NULL)");
        jdbc.execute("DELETE FROM shadowcraft_catalogs");
    }
    @Test void preservesEightSnapshotsAndRejectsForgedUserHeaders() throws Exception {
        for(String key : new String[]{"assassin","gladiator","templar","ranger","elementalist","sorcerer","cleric","chanter"})
            mvc.perform(get("/api/public/shadowcraft/catalog").param("class",key)).andExpect(status().isOk()).andExpect(jsonPath("$.catalog.classKey").value(key)).andExpect(jsonPath("$.catalog.version").value("2.0.7.0"));
        mvc.perform(put("/api/admin/shadowcraft/catalog/assassin").header("oai-authenticated-user-id","owner").contentType("application/json").content("{}")).andExpect(status().isForbidden());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM shadowcraft_catalogs",Integer.class)).isZero();
    }
    @Test @WithMockUser(roles="USER") void ordinaryUsersCannotUpdateCatalogOrNews() throws Exception {
        mvc.perform(put("/api/admin/shadowcraft/catalog/assassin").contentType("application/json").content("{}")).andExpect(status().isForbidden());
        mvc.perform(put("/api/admin/shadowcraft/news").contentType("application/json").content("{}")).andExpect(status().isForbidden());
    }
    @Test void validatesLookupBeforeAnyExternalRequest() throws Exception {
        for(String body : new String[]{"bad","[]","{\"region\":\"invalid\"}","{\"action\":\"search\",\"name\":\"\"}","{\"action\":\"profile\",\"server\":\"../x\"}","{\"class\":\"other\"}"})
            mvc.perform(post("/api/public/shadowcraft/armory").contentType("application/json").content(body)).andExpect(status().isBadRequest());
        mvc.perform(post("/api/public/shadowcraft/armory").content("x".repeat(2001))).andExpect(status().isBadRequest());
    }
    @Test @WithMockUser(roles="ADMIN") void badCatalogAndNewsCannotReplaceExistingData() throws Exception {
        var before=service.catalog("assassin");
        mvc.perform(put("/api/admin/shadowcraft/catalog/assassin").contentType("application/json").content("{}")).andExpect(status().isBadRequest());
        mvc.perform(put("/api/admin/shadowcraft/catalog/assassin").contentType("application/json").content("x".repeat(3_000_001))).andExpect(status().isPayloadTooLarge());
        mvc.perform(put("/api/admin/shadowcraft/news").contentType("application/json").content("{\"contentList\":false}")).andExpect(status().isBadRequest());
        assertThat(service.catalog("assassin")).isEqualTo(before);
    }
}
