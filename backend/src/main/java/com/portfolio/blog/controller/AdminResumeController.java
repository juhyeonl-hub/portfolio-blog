package com.portfolio.blog.controller;

import com.portfolio.blog.model.ResumeSection;
import com.portfolio.blog.service.ResumeSectionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/resume")
public class AdminResumeController {

    private final ResumeSectionService service;

    public AdminResumeController(ResumeSectionService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ResumeSection>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping
    public ResponseEntity<ResumeSection> create(@Valid @RequestBody ResumeSection section) {
        return ResponseEntity.ok(service.create(section));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResumeSection> update(@PathVariable Long id, @Valid @RequestBody ResumeSection section) {
        return ResponseEntity.ok(service.update(id, section));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
