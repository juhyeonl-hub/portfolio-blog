package com.portfolio.blog.repository;

import com.portfolio.blog.model.ResumeSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResumeSectionRepository extends JpaRepository<ResumeSection, Long> {
    List<ResumeSection> findAllByOrderByDisplayOrderAsc();
}
