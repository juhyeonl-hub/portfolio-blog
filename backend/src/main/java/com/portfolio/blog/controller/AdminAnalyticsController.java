package com.portfolio.blog.controller;

import com.portfolio.blog.repository.PageViewRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {

    private final PageViewRepository pageViewRepository;

    public AdminAnalyticsController(PageViewRepository pageViewRepository) {
        this.pageViewRepository = pageViewRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalViews", pageViewRepository.count());
        stats.put("todayViews", pageViewRepository.countToday());

        List<Object[]> topPages = pageViewRepository.getTopPages();
        List<Map<String, Object>> topPagesList = topPages.stream()
                .limit(10)
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("path", row[0]);
                    m.put("views", row[1]);
                    return m;
                })
                .collect(Collectors.toList());
        stats.put("topPages", topPagesList);

        return ResponseEntity.ok(stats);
    }
}
