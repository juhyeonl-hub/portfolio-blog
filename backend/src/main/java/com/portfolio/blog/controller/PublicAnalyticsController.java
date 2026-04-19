package com.portfolio.blog.controller;

import com.portfolio.blog.model.PageView;
import com.portfolio.blog.repository.PageViewRepository;
import jakarta.servlet.http.HttpServletRequest;
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

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getPublicStats() {
        return ResponseEntity.ok(Map.of(
                "total", pageViewRepository.count(),
                "today", pageViewRepository.countToday()
        ));
    }

    @PostMapping("/pageview")
    public ResponseEntity<Void> trackPageView(@RequestBody Map<String, String> body,
                                              HttpServletRequest request) {
        String path = body.get("path");
        if (path == null || path.isBlank()) {
            return ResponseEntity.ok().build();
        }

        PageView pv = new PageView();
        pv.setPagePath(truncate(path, 500));
        pv.setUserAgent(truncate(request.getHeader("User-Agent"), 500));
        pv.setReferer(truncate(request.getHeader("Referer"), 500));
        pv.setSessionId(truncate(body.get("sessionId"), 64));
        pageViewRepository.save(pv);

        return ResponseEntity.ok().build();
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
