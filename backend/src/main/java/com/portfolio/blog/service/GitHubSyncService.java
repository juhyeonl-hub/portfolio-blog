package com.portfolio.blog.service;

import com.portfolio.blog.model.Post;
import com.portfolio.blog.model.Tag;
import com.portfolio.blog.repository.PostRepository;
import com.portfolio.blog.repository.TagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GitHubSyncService {

    private final PostRepository postRepository;
    private final TagRepository tagRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public GitHubSyncService(PostRepository postRepository, TagRepository tagRepository) {
        this.postRepository = postRepository;
        this.tagRepository = tagRepository;
    }

    @SuppressWarnings("unchecked")
    public void processPushEvent(Map<String, Object> payload) {
        List<Map<String, Object>> commits = (List<Map<String, Object>>) payload.get("commits");
        if (commits == null) return;

        Map<String, Object> repository = (Map<String, Object>) payload.get("repository");
        String repoFullName = (String) repository.get("full_name");

        for (Map<String, Object> commit : commits) {
            List<String> added = (List<String>) commit.getOrDefault("added", List.of());
            List<String> modified = (List<String>) commit.getOrDefault("modified", List.of());

            Set<String> filesToProcess = new HashSet<>();
            filesToProcess.addAll(added);
            filesToProcess.addAll(modified);

            for (String file : filesToProcess) {
                if (file.startsWith("journal/") && file.endsWith(".md")) {
                    processMarkdownFile(repoFullName, file);
                }
            }

            List<String> removed = (List<String>) commit.getOrDefault("removed", List.of());
            for (String file : removed) {
                if (file.startsWith("journal/") && file.endsWith(".md")) {
                    String slug = fileToSlug(file);
                    postRepository.findBySlug(slug).ifPresent(postRepository::delete);
                }
            }
        }
    }

    @Transactional
    void processMarkdownFile(String repoFullName, String filePath) {
        String rawUrl = "https://raw.githubusercontent.com/" + repoFullName + "/main/" + filePath;
        String content;
        try {
            content = restTemplate.getForObject(rawUrl, String.class);
        } catch (Exception e) {
            return;
        }
        if (content == null || content.isBlank()) return;

        ParsedPost parsed = parseMarkdown(content, filePath);
        String slug = fileToSlug(filePath);

        Optional<Post> existing = postRepository.findBySlug(slug);
        Post post;
        if (existing.isPresent()) {
            post = existing.get();
        } else {
            post = new Post();
            post.setSlug(slug);
        }

        post.setTitle(parsed.title);
        post.setContent(parsed.content);
        post.setExcerpt(parsed.excerpt);
        post.setPublished(true);
        post.setTags(resolveTags(parsed.tags));
        postRepository.save(post);
    }

    private ParsedPost parseMarkdown(String raw, String filePath) {
        ParsedPost result = new ParsedPost();
        String content = raw;

        // Parse YAML frontmatter: ---\n...\n---
        if (raw.startsWith("---")) {
            int endIndex = raw.indexOf("---", 3);
            if (endIndex > 0) {
                String frontmatter = raw.substring(3, endIndex).trim();
                content = raw.substring(endIndex + 3).trim();

                for (String line : frontmatter.split("\n")) {
                    line = line.trim();
                    if (line.startsWith("title:")) {
                        result.title = stripQuotes(line.substring(6).trim());
                    } else if (line.startsWith("excerpt:")) {
                        result.excerpt = stripQuotes(line.substring(8).trim());
                    } else if (line.startsWith("tags:")) {
                        String tagsStr = line.substring(5).trim();
                        // tags: [Dev, TIL] or tags: Dev, TIL
                        tagsStr = tagsStr.replaceAll("[\\[\\]]", "");
                        result.tags = Arrays.stream(tagsStr.split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .toList();
                    }
                }
            }
        }

        // If no title from frontmatter, use first # heading or filename
        if (result.title == null || result.title.isBlank()) {
            Matcher m = Pattern.compile("^#\\s+(.+)$", Pattern.MULTILINE).matcher(content);
            if (m.find()) {
                result.title = m.group(1).trim();
                content = content.substring(0, m.start()) + content.substring(m.end()).trim();
            } else {
                result.title = fileToTitle(filePath);
            }
        }

        result.content = content.trim();

        if (result.excerpt == null && result.content.length() > 10) {
            result.excerpt = result.content.substring(0, Math.min(200, result.content.length()))
                    .replaceAll("[#*`>\\-]", "").trim();
        }

        return result;
    }

    private String fileToSlug(String filePath) {
        // journal/my-first-post.md -> my-first-post
        String name = filePath.substring(filePath.lastIndexOf('/') + 1);
        return name.replace(".md", "").toLowerCase()
                .replaceAll("[^a-z0-9\\-]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private String fileToTitle(String filePath) {
        String slug = fileToSlug(filePath);
        return Arrays.stream(slug.split("-"))
                .map(w -> w.substring(0, 1).toUpperCase() + w.substring(1))
                .reduce((a, b) -> a + " " + b)
                .orElse(slug);
    }

    private String stripQuotes(String s) {
        if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'"))) {
            return s.substring(1, s.length() - 1);
        }
        return s;
    }

    private Set<Tag> resolveTags(List<String> tagNames) {
        Set<Tag> tags = new HashSet<>();
        if (tagNames == null) return tags;
        for (String name : tagNames) {
            Tag tag = tagRepository.findByName(name)
                    .orElseGet(() -> tagRepository.save(new Tag(name)));
            tags.add(tag);
        }
        return tags;
    }

    private static class ParsedPost {
        String title;
        String content;
        String excerpt;
        List<String> tags;
    }
}
