package com.portfolio.blog.controller;

import com.portfolio.blog.model.PageView;
import com.portfolio.blog.repository.PageViewRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public/analytics")
public class PublicAnalyticsController {

    private final PageViewRepository pageViewRepository;

    public PublicAnalyticsController(PageViewRepository pageViewRepository) {
        this.pageViewRepository = pageViewRepository;
    }

    @PostMapping("/pageview")
    public ResponseEntity<Void> trackPageView(@RequestBody Map<String, String> body) {
        String path = body.get("path");
        if (path != null && !path.isBlank()) {
            PageView pv = new PageView();
            pv.setPagePath(path);
            pageViewRepository.save(pv);
        }
        return ResponseEntity.ok().build();
    }
}
