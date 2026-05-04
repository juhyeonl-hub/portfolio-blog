package com.portfolio.blog.service;

import com.portfolio.blog.dto.PostRequest;
import com.portfolio.blog.model.Post;
import com.portfolio.blog.model.Tag;
import com.portfolio.blog.repository.PostRepository;
import com.portfolio.blog.repository.TagRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final TagRepository tagRepository;

    public PostService(PostRepository postRepository, TagRepository tagRepository) {
        this.postRepository = postRepository;
        this.tagRepository = tagRepository;
    }

    public Page<Post> getPublishedPosts(int page, int size) {
        return postRepository.findByPublishedTrueOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    public Page<Post> getPostsByTag(String tag, int page, int size) {
        return postRepository.findByTagName(tag, PageRequest.of(page, size));
    }

    public Page<Post> searchPosts(String query, int page, int size) {
        return postRepository.searchByTitle(query, PageRequest.of(page, size));
    }

    public Post getBySlug(String slug) {
        return postRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Tag> getAllTags() {
        return tagRepository.findAll();
    }

    @Transactional
    public Post create(PostRequest request) {
        Post post = new Post();
        post.setTitle(request.getTitle());
        post.setSlug(generateSlug(request.getTitle()));
        post.setContent(request.getContent());
        post.setExcerpt(request.getExcerpt());
        post.setTitleKo(request.getTitleKo());
        post.setContentKo(request.getContentKo());
        post.setExcerptKo(request.getExcerptKo());
        post.setPublished(request.isPublished());
        post.setTags(resolveTags(request.getTags()));
        return postRepository.save(post);
    }

    @Transactional
    public Post update(Long id, PostRequest request) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setExcerpt(request.getExcerpt());
        post.setTitleKo(request.getTitleKo());
        post.setContentKo(request.getContentKo());
        post.setExcerptKo(request.getExcerptKo());
        post.setPublished(request.isPublished());
        post.setTags(resolveTags(request.getTags()));
        return postRepository.save(post);
    }

    public void delete(Long id) {
        postRepository.deleteById(id);
    }

    private Set<Tag> resolveTags(List<String> tagNames) {
        Set<Tag> tags = new HashSet<>();
        if (tagNames == null) return tags;
        for (String name : tagNames) {
            String trimmed = name.trim();
            if (trimmed.isEmpty()) continue;
            Tag tag = tagRepository.findByName(trimmed)
                    .orElseGet(() -> tagRepository.save(new Tag(trimmed)));
            tags.add(tag);
        }
        return tags;
    }

    private String generateSlug(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
