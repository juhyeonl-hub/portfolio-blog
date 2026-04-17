package com.portfolio.blog.controller;

import com.portfolio.blog.service.ProjectReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
public class AdminReviewController {

    private final ProjectReviewService service;

    public AdminReviewController(ProjectReviewService service) {
        this.service = service;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
