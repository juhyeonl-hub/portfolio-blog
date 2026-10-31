package com.portfolio.blog.config;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import static org.assertj.core.api.Assertions.*;
class SecurityOriginsTest {
 @Test void defaultOriginsDoNotTrustOtherVercelTenantsOrLocalhost(){
  var config=new SecurityConfig(null,null,"").corsConfigurationSource().getCorsConfiguration(new MockHttpServletRequest("GET","/api/community/me"));
  assertThat(config.checkOrigin("https://asbc.app")).isEqualTo("https://asbc.app");
  assertThat(config.checkOrigin("https://attacker.vercel.app")).isNull();
  assertThat(config.checkOrigin("http://localhost:3000")).isNull();
  assertThat(config.checkOrigin("https://asbc.app.attacker.test")).isNull();
 }
}
