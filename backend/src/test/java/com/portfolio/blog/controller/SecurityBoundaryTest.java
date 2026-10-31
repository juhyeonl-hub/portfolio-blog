package com.portfolio.blog.controller;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class SecurityBoundaryTest {
 @Autowired MockMvc mvc;
 @Test void adminSetupAndIdentityRequireAdmin()throws Exception{for(String path:new String[]{"/api/auth/totp/setup","/api/auth/totp/enable"})mvc.perform(post(path)).andExpect(status().isForbidden());mvc.perform(get("/api/auth/me")).andExpect(status().isForbidden());}
 @Test void rotatedUsernamesAndForgedForwardedIpsCannotBypassAdminThrottle()throws Exception{
  String source=java.util.UUID.randomUUID().toString();for(int i=0;i<21;i++)mvc.perform(post("/api/auth/login").with(r->{r.setRemoteAddr(source);return r;}).header("X-Forwarded-For","198.51.100."+i).contentType("application/json").content("{\"username\":\"unknown_"+i+"\",\"password\":\"incorrect-password\"}")).andExpect(status().is(i<20?401:429));
 }
 @Test void oversizedChunkedAnonymousBodiesAreRejectedBeforeDeserialization()throws Exception{mvc.perform(post("/api/public/analytics/pageview").contentType("application/json").content("x".repeat(64001)).with(r->{r.removeHeader("Content-Length");return r;})).andExpect(status().isPayloadTooLarge());}
 @Test void malformedJsonDoesNotRevealDeserializerOrPayload()throws Exception{mvc.perform(post("/api/public/analytics/pageview").contentType("application/json").content("{\"path\": {\"secret-sentinel\": 1}} ")).andExpect(status().isBadRequest()).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("secret-sentinel"))));}
 @Test void oversizedAdminRequestsAreRejectedByAuthorizationBeforeReading()throws Exception{mvc.perform(put("/api/admin/posts/1").contentType("application/json").content("x".repeat(64001))).andExpect(status().isForbidden());}
 @Test void oneVisitorCannotExhaustTheSharedArmoryBudget()throws Exception{
  for(int i=0;i<41;i++)mvc.perform(post("/api/public/shadowcraft/armory").with(r->{r.setRemoteAddr("203.0.113.44");return r;}).header("X-Forwarded-For","198.51.100."+i).contentType("application/json").content("[]")).andExpect(status().is(i<40?400:429));
  mvc.perform(post("/api/public/shadowcraft/armory").with(r->{r.setRemoteAddr("203.0.113.45");return r;}).contentType("application/json").content("[]")).andExpect(status().isBadRequest());
 }
}
