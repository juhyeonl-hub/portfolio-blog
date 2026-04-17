package com.portfolio.blog.controller;

import com.portfolio.blog.model.Project;
import com.portfolio.blog.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/projects")
public class PublicProjectController {

    private final ProjectService projectService;

    public PublicProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<Project>> getProjects() {
        return ResponseEntity.ok(projectService.getPublishedProjects());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Project> getProject(@PathVariable String slug) {
        return ResponseEntity.ok(projectService.getBySlug(slug));
    }
}
