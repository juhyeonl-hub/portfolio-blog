package com.portfolio.blog.controller;

import com.portfolio.blog.service.GuestbookService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/guestbook")
public class AdminGuestbookController {

    private final GuestbookService service;

    public AdminGuestbookController(GuestbookService service) {
        this.service = service;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
