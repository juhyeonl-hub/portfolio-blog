package com.portfolio.blog.controller;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import java.net.*;import java.net.http.*;
import static org.assertj.core.api.Assertions.*;
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT) @ActiveProfiles("test")
class ForwardedHeaderSecurityTest {
 @LocalServerPort int port;
 @Test void realServerCannotBypassLoginLimitsWithForwardedOrUnsignedProxyHeaders()throws Exception {
  var client=HttpClient.newHttpClient();for(int i=0;i<21;i++) {
   var req=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/auth/login")).header("Content-Type","application/json").header("X-Forwarded-For","203.0.113."+(i+1)).header("X-ASBC-Client-IP","198.51.100."+(i+1)).header("X-ASBC-Proxy-Secret","forged").POST(HttpRequest.BodyPublishers.ofString("{\"username\":\"rotating_"+i+"\",\"password\":\"not-a-real-password\"}")).build();
   var result=client.send(req,HttpResponse.BodyHandlers.ofString());assertThat(result.statusCode()).isEqualTo(i<20?401:429);if(i==20)assertThat(result.headers().firstValue("Retry-After")).contains("600");
  }
 }
}
