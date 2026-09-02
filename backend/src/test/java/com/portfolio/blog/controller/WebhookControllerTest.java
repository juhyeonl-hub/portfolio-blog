package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.blog.config.AppProperties;
import com.portfolio.blog.security.GitHubWebhookVerifier;
import com.portfolio.blog.service.GitHubSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class WebhookControllerTest {

    private static final String SECRET = "test-webhook-secret";

    private GitHubSyncService syncService;
    private AppProperties appProperties;
    private WebhookController controller;

    @BeforeEach
    void setUp() {
        syncService = mock(GitHubSyncService.class);
        appProperties = new AppProperties();
        appProperties.getGithub().setWebhookSecret(SECRET);
        appProperties.getGithub().setRepository("juhyeonl-hub/portfolio-blog");
        controller = new WebhookController(
                syncService,
                new GitHubWebhookVerifier(appProperties),
                appProperties,
                new ObjectMapper());
    }

    @Test
    void acceptsValidSignedPushFromConfiguredRepository() throws Exception {
        byte[] payload = payloadFor("juhyeonl-hub/portfolio-blog");

        ResponseEntity<Map<String, String>> response = controller.handleGitHubWebhook(
                "push", signatureFor(payload), payload);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).containsEntry("status", "processed");
        verify(syncService).processPushEvent(anyMap());
    }

    @Test
    void rejectsInvalidSignatureWithoutCallingSync() {
        byte[] payload = payloadFor("juhyeonl-hub/portfolio-blog");

        ResponseEntity<Map<String, String>> response = controller.handleGitHubWebhook(
                "push", "sha256=invalid", payload);

        assertThat(response.getStatusCode().value()).isEqualTo(401);
        verifyNoInteractions(syncService);
    }

    @Test
    void rejectsUnexpectedRepositoryWithoutCallingSync() throws Exception {
        byte[] payload = payloadFor("attacker/untrusted-repository");

        ResponseEntity<Map<String, String>> response = controller.handleGitHubWebhook(
                "push", signatureFor(payload), payload);

        assertThat(response.getStatusCode().value()).isEqualTo(403);
        verifyNoInteractions(syncService);
    }

    @Test
    void failsClosedWhenSecretIsMissing() {
        appProperties.getGithub().setWebhookSecret("");
        byte[] payload = payloadFor("juhyeonl-hub/portfolio-blog");

        ResponseEntity<Map<String, String>> response = controller.handleGitHubWebhook(
                "push", null, payload);

        assertThat(response.getStatusCode().value()).isEqualTo(503);
        verifyNoInteractions(syncService);
    }

    private byte[] payloadFor(String repository) {
        return ("{\"repository\":{\"full_name\":\"" + repository
                + "\"},\"commits\":[]}").getBytes(StandardCharsets.UTF_8);
    }

    private String signatureFor(byte[] payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return "sha256=" + HexFormat.of().formatHex(mac.doFinal(payload));
    }
}
