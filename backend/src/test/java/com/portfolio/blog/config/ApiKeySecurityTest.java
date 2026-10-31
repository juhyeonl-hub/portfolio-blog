package com.portfolio.blog.config;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.*;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.assertj.core.api.Assertions.*;
class ApiKeySecurityTest {
 @AfterEach void clear(){SecurityContextHolder.clearContext();}
 @Test void absentEmptyWhitespaceAndWrongKeysNeverAuthenticate()throws Exception{
  for(String configured:new String[]{null,"","   ","real-secret"}){var p=new AppProperties();p.setApiKey(configured);var r=new MockHttpServletRequest();r.addHeader("X-API-Key",configured==null?"":configured.equals("real-secret")?"wrong":configured);new ApiKeyAuthenticationFilter(p).doFilter(r,new MockHttpServletResponse(),new MockFilterChain());assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();}
 }
 @Test void configuredKeyRetainsAdminFunctionality()throws Exception{var p=new AppProperties();p.setApiKey("valid-secret");var r=new MockHttpServletRequest();r.addHeader("X-API-Key","valid-secret");new ApiKeyAuthenticationFilter(p).doFilter(r,new MockHttpServletResponse(),new MockFilterChain());assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities()).extracting("authority").containsExactly("ROLE_ADMIN");}
}
