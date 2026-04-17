package com.portfolio.blog.controller;

import com.portfolio.blog.model.ProjectReview;
import com.portfolio.blog.service.ProjectReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/reviews")
public class PublicReviewController {

    private final ProjectReviewService service;

    public PublicReviewController(ProjectReviewService service) {
        this.service = service;
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ProjectReview>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(service.getByProjectId(projectId));
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<ProjectReview> create(
            @PathVariable Long projectId,
            @RequestBody Map<String, Object> body) {
        String nickname = (String) body.get("nickname");
        int rating = (int) body.get("rating");
        String comment = (String) body.get("comment");
        return ResponseEntity.ok(service.create(projectId, nickname, rating, comment));
    }
}
