package com.portfolio.blog.repository;

import com.portfolio.blog.model.GuestbookEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuestbookRepository extends JpaRepository<GuestbookEntry, Long> {
    List<GuestbookEntry> findAllByOrderByCreatedAtDesc();
}
