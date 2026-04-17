package com.portfolio.blog.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "page_views")
public class PageView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "page_path", nullable = false, length = 500)
    private String pagePath;

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPagePath() { return pagePath; }
    public void setPagePath(String pagePath) { this.pagePath = pagePath; }
    public LocalDateTime getViewedAt() { return viewedAt; }
    public void setViewedAt(LocalDateTime viewedAt) { this.viewedAt = viewedAt; }
}
