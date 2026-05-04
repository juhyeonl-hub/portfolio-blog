package com.portfolio.blog.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class PostRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    private String excerpt;
    private String titleKo;
    private String contentKo;
    private String excerptKo;
    private boolean published = false;
    private List<String> tags;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getExcerpt() { return excerpt; }
    public void setExcerpt(String excerpt) { this.excerpt = excerpt; }
    public String getTitleKo() { return titleKo; }
    public void setTitleKo(String titleKo) { this.titleKo = titleKo; }
    public String getContentKo() { return contentKo; }
    public void setContentKo(String contentKo) { this.contentKo = contentKo; }
    public String getExcerptKo() { return excerptKo; }
    public void setExcerptKo(String excerptKo) { this.excerptKo = excerptKo; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}
