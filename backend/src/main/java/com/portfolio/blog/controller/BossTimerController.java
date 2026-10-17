package com.portfolio.blog.controller;
import com.portfolio.blog.service.BossTimerService;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController
public class BossTimerController {
    private final BossTimerService service;
    public BossTimerController(BossTimerService service) { this.service = service; }
    @GetMapping("/api/public/shadowcraft/boss-timers")
    public ResponseEntity<ObjectNode> get(@RequestParam String region, @RequestParam int server) {
        return ResponseEntity.ok().header("Cache-Control", "no-store").body(service.get(region, server));
    }
}
