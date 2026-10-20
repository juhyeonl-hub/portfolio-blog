package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.portfolio.blog.service.OfficialRankingProbe;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Read-only status of the official Abyss/Arena ranking probe; no character data. */
@RestController
public class OfficialRankingController {
    private final OfficialRankingProbe probe;

    public OfficialRankingController(OfficialRankingProbe probe) { this.probe = probe; }

    @GetMapping("/api/public/shadowcraft/ranking-availability")
    public JsonNode availability() { return probe.status(); }
}
