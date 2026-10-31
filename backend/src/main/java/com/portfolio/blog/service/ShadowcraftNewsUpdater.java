package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/** Only official public news is polled. Catalogs require an explicit manual import. */
@Component
@EnableScheduling
@ConditionalOnProperty(name = "app.shadowcraft.news-refresh-enabled", havingValue = "true")
public class ShadowcraftNewsUpdater {
    private static final Logger log = LoggerFactory.getLogger(ShadowcraftNewsUpdater.class);
    private static final URI SOURCE = URI.create("https://api-global-community.plaync.com/aion2_global/board/update_en/article/search/moreArticle?moreSize=5&moreDirection=BEFORE&previousArticleId=0");
    private final ShadowcraftService service;
    private final ObjectMapper mapper;
    private final HttpClient client;

    @Autowired
    public ShadowcraftNewsUpdater(ShadowcraftService service, ObjectMapper mapper) {
        this(service, mapper, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
    }

    ShadowcraftNewsUpdater(ShadowcraftService service, ObjectMapper mapper, HttpClient client) {
        this.service = service;
        this.mapper = mapper;
        this.client = client;
    }

    @Scheduled(fixedDelayString = "${app.shadowcraft.news-refresh-ms:900000}",
               initialDelayString = "${app.shadowcraft.news-initial-delay-ms:10000}")
    public void refresh() {
        try {
            var request = HttpRequest.newBuilder(SOURCE).timeout(Duration.ofSeconds(15))
                    .header("Accept", "application/json").header("User-Agent", "a2bc/1.0").build();
            var response = com.portfolio.blog.security.BoundedHttp.send(client, request, 1_000_000);
            if (response.statusCode() != 200 || response.body().length > 1_000_000)
                throw new IllegalStateException("Official news response rejected");
            service.updateNews(mapper.readTree(response.body()));
            log.info("a2bc official news refreshed; catalog and recommendation review unchanged");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("a2bc official news refresh interrupted; previous news retained");
        } catch (Exception e) {
            // No response body, credentials or character data in logs.
            log.warn("a2bc official news refresh failed; previous news retained ({})", e.getClass().getSimpleName());
        }
    }
}
