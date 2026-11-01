package com.portfolio.blog.service;
import com.portfolio.blog.config.AppProperties;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class JwtJsonCompatibilityTest {
 private JwtService service(){var p=new AppProperties();p.getJwt().setSecret("test-jwt-secret-key-for-testing-only-minimum-256-bits-long-string");p.getJwt().setExpirationMs(60_000);return new JwtService(p);}
 @Test void preMigrationSignedTokenStillWorks(){var s=service();String token="eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtaWdyYXRpb24tYWRtaW4iLCJpYXQiOjE3OTM0MDQ4MDAsImV4cCI6NDA3MDkwODgwMH0.dZXTG0HbLQTovvqITYfIU4y5O4kVY3Iq7t63T6eK2B5gqsYwpn_gXq5UdbVgrHHfTGDHv3_00OdSGr9dPzFB3A";assertThat(s.isTokenValid(token)).isTrue();assertThat(s.extractUsername(token)).isEqualTo("migration-admin");}
 @Test void mintVerifyAndTamper(){var s=service();var token=s.generateToken("관리자");assertThat(s.isTokenValid(token)).isTrue();assertThat(s.extractUsername(token)).isEqualTo("관리자");String[] parts=token.split("\\.");parts[1]=Base64.getUrlEncoder().withoutPadding().encodeToString("{\"sub\":\"attacker\",\"exp\":4070908800}".getBytes(StandardCharsets.UTF_8));assertThat(s.isTokenValid(String.join(".",parts))).isFalse();assertThat(s.isTokenValid("bad.token")).isFalse();}
 @Test void malformedDuplicateAndTrailingClaimsAreRejected(){for(String input:new String[]{"{\"sub\":\"one\",\"sub\":\"two\"}","{\"sub\":\"one\"} {}","[]","null"})assertThatThrownBy(()->JwtJson.DESERIALIZER.deserialize(input.getBytes(StandardCharsets.UTF_8))).as(input).isInstanceOf(io.jsonwebtoken.io.DeserializationException.class);}
}
