package com.portfolio.blog.controller;

import com.portfolio.blog.model.Post;
import com.portfolio.blog.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/posts")
public class PublicPostController {

    private final PostService postService;

    public PublicPostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<Page<Post>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String search) {
        Page<Post> posts;
        if (tag != null && !tag.isBlank()) {
            posts = postService.getPostsByTag(tag, page, size);
        } else if (search != null && !search.isBlank()) {
            posts = postService.searchPosts(search, page, size);
        } else {
            posts = postService.getPublishedPosts(page, size);
        }
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Post> getPost(@PathVariable String slug) {
        return ResponseEntity.ok(postService.getBySlug(slug));
    }
}
