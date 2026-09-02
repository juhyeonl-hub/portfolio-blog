package com.portfolio.blog.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.blog.config.AppProperties;
import com.portfolio.blog.security.GitHubWebhookVerifier;
import com.portfolio.blog.service.GitHubSyncService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/public/webhook")
public class WebhookController {

    private static final TypeReference<Map<String, Object>> PAYLOAD_TYPE = new TypeReference<>() {};

    private final GitHubSyncService syncService;
    private final GitHubWebhookVerifier signatureVerifier;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    public WebhookController(GitHubSyncService syncService,
                             GitHubWebhookVerifier signatureVerifier,
                             AppProperties appProperties,
                             ObjectMapper objectMapper) {
        this.syncService = syncService;
        this.signatureVerifier = signatureVerifier;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/github")
    public ResponseEntity<Map<String, String>> handleGitHubWebhook(
            @RequestHeader(value = "X-GitHub-Event", required = false) String event,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody byte[] rawPayload) {

        if (!"push".equals(event)) {
            return ResponseEntity.ok(Map.of("status", "ignored", "reason", "not a push event"));
        }

        if (!signatureVerifier.isConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("status", "rejected", "reason", "webhook verification is not configured"));
        }

        if (!signatureVerifier.isValid(rawPayload, signature)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "rejected", "reason", "invalid signature"));
        }

        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(rawPayload, PAYLOAD_TYPE);
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("status", "rejected", "reason", "invalid JSON payload"));
        }

        String actualRepository = repositoryFullName(payload);
        String expectedRepository = appProperties.getGithub().getRepository();
        if (expectedRepository == null || !expectedRepository.equals(actualRepository)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("status", "rejected", "reason", "unexpected repository"));
        }

        syncService.processPushEvent(payload);
        return ResponseEntity.ok(Map.of("status", "processed"));
    }

    private String repositoryFullName(Map<String, Object> payload) {
        Object repositoryObject = payload.get("repository");
        if (!(repositoryObject instanceof Map<?, ?> repository)) {
            return null;
        }
        Object fullName = repository.get("full_name");
        return fullName instanceof String value ? value : null;
    }
}
