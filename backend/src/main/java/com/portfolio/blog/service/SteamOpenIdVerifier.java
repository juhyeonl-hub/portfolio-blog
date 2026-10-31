package com.portfolio.blog.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Confirms a Steam OpenID 2.0 positive assertion directly with Steam (check_authentication). */
@Component
public class SteamOpenIdVerifier {
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NEVER).build();
    private final String endpoint;
    public SteamOpenIdVerifier(@Value("${app.steam.openid-endpoint:https://steamcommunity.com/openid/login}") String endpoint) { this.endpoint = endpoint; }
    public String endpoint() { return endpoint; }
    /** Returns true only when Steam answers "is_valid:true" for exactly these signed parameters. */
    public boolean verify(Map<String, String> openid) {
        try {
            String form = openid.entrySet().stream()
                    .map(e -> e.getKey().equals("openid.mode") ? Map.entry(e.getKey(), "check_authentication") : e)
                    .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                    .collect(Collectors.joining("&"));
            HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint)).timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(form)).build();
            HttpResponse<byte[]> response = com.portfolio.blog.security.BoundedHttp.send(http, request, 16_384);
            return response.statusCode() == 200 && new String(response.body(), StandardCharsets.UTF_8).lines().anyMatch(line -> line.trim().equals("is_valid:true"));
        } catch (java.io.IOException e) {
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
}
