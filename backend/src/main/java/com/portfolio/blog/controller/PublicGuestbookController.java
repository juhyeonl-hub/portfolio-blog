package com.portfolio.blog.controller;

import com.portfolio.blog.model.GuestbookEntry;
import com.portfolio.blog.service.GuestbookService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/guestbook")
public class PublicGuestbookController {

    private final GuestbookService service;

    public PublicGuestbookController(GuestbookService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<GuestbookEntry>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping
    public ResponseEntity<GuestbookEntry> create(@Valid @RequestBody GuestbookEntry entry) {
        return ResponseEntity.ok(service.create(entry));
    }
}
