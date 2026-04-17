package com.portfolio.blog.repository;

import com.portfolio.blog.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByPublishedTrueOrderByCreatedAtDesc(Pageable pageable);
    Optional<Post> findBySlug(String slug);
    List<Post> findAllByOrderByCreatedAtDesc();

    @Query("SELECT p FROM Post p JOIN p.tags t WHERE p.published = true AND t.name = :tagName ORDER BY p.createdAt DESC")
    Page<Post> findByTagName(String tagName, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.published = true AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Post> searchByTitle(String query, Pageable pageable);
}
