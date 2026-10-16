package com.portfolio.blog.controller;

import com.portfolio.blog.service.SteamActivityService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SteamActivityController {
    private final SteamActivityService service;
    public SteamActivityController(SteamActivityService service) {this.service=service;}
    @GetMapping("/api/public/shadowcraft/activity")
    public ResponseEntity<SteamActivityService.Activity> activity() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.current());
    }
}
