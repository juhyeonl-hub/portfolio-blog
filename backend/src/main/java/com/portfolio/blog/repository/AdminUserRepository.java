package com.portfolio.blog.repository;

import com.portfolio.blog.model.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
    Optional<AdminUser> findByUsername(String username);
    boolean existsByUsername(String username);
}
