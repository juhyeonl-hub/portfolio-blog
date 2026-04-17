package com.portfolio.blog.repository;

import com.portfolio.blog.model.ProjectReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectReviewRepository extends JpaRepository<ProjectReview, Long> {
    List<ProjectReview> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}
