package com.portfolio.blog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Admin admin = new Admin();
    private Jwt jwt = new Jwt();
    private String apiKey;
    private String uploadDir;

    public Admin getAdmin() { return admin; }
    public void setAdmin(Admin admin) { this.admin = admin; }
    public Jwt getJwt() { return jwt; }
    public void setJwt(Jwt jwt) { this.jwt = jwt; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getUploadDir() { return uploadDir; }
    public void setUploadDir(String uploadDir) { this.uploadDir = uploadDir; }

    public static class Admin {
        private String username;
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class Jwt {
        private String secret;
        private long expirationMs;

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getExpirationMs() { return expirationMs; }
        public void setExpirationMs(long expirationMs) { this.expirationMs = expirationMs; }
    }
}
