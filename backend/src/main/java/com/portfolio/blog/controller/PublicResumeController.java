package com.portfolio.blog.controller;

import com.portfolio.blog.model.ResumeSection;
import com.portfolio.blog.service.ResumeSectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/resume")
public class PublicResumeController {

    private final ResumeSectionService service;

    public PublicResumeController(ResumeSectionService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ResumeSection>> getSections() {
        return ResponseEntity.ok(service.getAll());
    }
}
