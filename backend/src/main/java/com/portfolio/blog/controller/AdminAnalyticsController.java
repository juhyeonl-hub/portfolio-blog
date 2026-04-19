package com.portfolio.blog.controller;

import com.portfolio.blog.model.PageView;
import com.portfolio.blog.repository.PageViewRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm:ss");

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

    @GetMapping("/today-sessions")
    public ResponseEntity<List<Map<String, Object>>> getTodaySessions() {
        List<PageView> views = pageViewRepository.findTodayViews();

        Map<String, List<PageView>> grouped = new LinkedHashMap<>();
        int fallbackCounter = 0;
        for (PageView pv : views) {
            String key = pv.getSessionId();
            if (key == null || key.isBlank()) {
                key = "anon-" + (pv.getIpAddress() == null ? "unknown" : pv.getIpAddress()) + "-" + (fallbackCounter++);
            }
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(pv);
        }

        List<Map<String, Object>> sessions = grouped.entrySet().stream().map(entry -> {
            List<PageView> list = entry.getValue();
            PageView first = list.get(0);
            PageView last = list.get(list.size() - 1);

            Map<String, Object> s = new LinkedHashMap<>();
            s.put("sessionId", entry.getKey());
            s.put("firstSeen", first.getViewedAt().format(TIME_FMT));
            s.put("lastSeen", last.getViewedAt().format(TIME_FMT));
            s.put("pageCount", list.size());
            s.put("ipAddress", first.getIpAddress());
            s.put("userAgent", first.getUserAgent());
            s.put("referer", first.getReferer());
            s.put("paths", list.stream().map(PageView::getPagePath).collect(Collectors.toList()));
            return s;
        }).sorted((a, b) -> ((String) b.get("firstSeen")).compareTo((String) a.get("firstSeen")))
          .collect(Collectors.toList());

        return ResponseEntity.ok(sessions);
    }
}
