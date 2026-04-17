package com.portfolio.blog.controller;

import com.portfolio.blog.dto.PostRequest;
import com.portfolio.blog.model.Post;
import com.portfolio.blog.model.Tag;
import com.portfolio.blog.service.PostService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/posts")
public class AdminPostController {

    private final PostService postService;

    public AdminPostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<List<Post>> getAll() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    @GetMapping("/tags")
    public ResponseEntity<List<Tag>> getAllTags() {
        return ResponseEntity.ok(postService.getAllTags());
    }

    @PostMapping
    public ResponseEntity<Post> create(@Valid @RequestBody PostRequest request) {
        return ResponseEntity.ok(postService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> update(@PathVariable Long id, @Valid @RequestBody PostRequest request) {
        return ResponseEntity.ok(postService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        postService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
