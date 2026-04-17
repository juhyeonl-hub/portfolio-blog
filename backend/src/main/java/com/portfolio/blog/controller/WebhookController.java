package com.portfolio.blog.controller;

import com.portfolio.blog.service.GitHubSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public/webhook")
public class WebhookController {

    private final GitHubSyncService syncService;

    public WebhookController(GitHubSyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/github")
    public ResponseEntity<Map<String, String>> handleGitHubWebhook(
            @RequestHeader(value = "X-GitHub-Event", required = false) String event,
            @RequestBody Map<String, Object> payload) {

        if (!"push".equals(event)) {
            return ResponseEntity.ok(Map.of("status", "ignored", "reason", "not a push event"));
        }

        syncService.processPushEvent(payload);
        return ResponseEntity.ok(Map.of("status", "processed"));
    }
}
