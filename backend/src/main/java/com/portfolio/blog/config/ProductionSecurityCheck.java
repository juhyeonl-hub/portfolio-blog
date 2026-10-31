package com.portfolio.blog.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Refuse known development credentials instead of silently starting an exposed production service. */
@Component @Profile("prod")
public class ProductionSecurityCheck {
 public ProductionSecurityCheck(@Value("${app.api-key:}")String api,@Value("${app.jwt.secret:}")String jwt,@Value("${app.admin.password:}")String password,@Value("${app.steam.public-url:https://juhyeonl.dev}")String url){
  if(weak(api)||weak(jwt)||password.isBlank()||java.util.Set.of("changeme","admin","password").contains(password.toLowerCase(java.util.Locale.ROOT))||!url.startsWith("https://"))throw new IllegalStateException("Production credentials and HTTPS public URL must be configured; development defaults are forbidden.");
 }
 private boolean weak(String value){return value==null||value.length()<32||value.toLowerCase(java.util.Locale.ROOT).matches("^(dev-|test-|changeme).*?");}
}
