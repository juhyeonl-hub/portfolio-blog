package com.portfolio.blog.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** ASBC's own domain is allowed only when configured; existing origins keep working and others stay refused. */
@SpringBootTest(properties = "app.cors.extra-origins=https://asbc.test, https://*.asbc-test.pages.dev")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CorsExtraOriginsTest {
    @Autowired MockMvc mvc;

    @Test
    void configuredOriginsAreAllowedAndOthersRefused() throws Exception {
        for (String origin : new String[]{"https://asbc.test", "https://preview.asbc-test.pages.dev", "https://juhyeonl.dev", "http://localhost:5173"})
            mvc.perform(get("/api/health").header("Origin", origin)).andExpect(status().isOk());
        for (String origin : new String[]{"https://evil.test", "https://asbc.test.evil.test", "http://127.0.0.1:5173"})
            mvc.perform(get("/api/health").header("Origin", origin)).andExpect(status().isForbidden());
    }
}
