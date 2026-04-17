package com.portfolio.blog.repository;

import com.portfolio.blog.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByPublishedTrueOrderByDisplayOrderAsc();
    Optional<Project> findBySlug(String slug);
    List<Project> findAllByOrderByDisplayOrderAsc();
}
