package com.portfolio.blog.dto;

import jakarta.validation.constraints.NotBlank;

public class ProjectRequest {

    @NotBlank
    private String title;

    private String shortDescription;
    private String fullDescription;
    private String thumbnailUrl;
    private String githubUrl;
    private String demoUrl;
    private String techStack;
    private int displayOrder = 0;
    private boolean published = false;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }
    public String getFullDescription() { return fullDescription; }
    public void setFullDescription(String fullDescription) { this.fullDescription = fullDescription; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getGithubUrl() { return githubUrl; }
    public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }
    public String getDemoUrl() { return demoUrl; }
    public void setDemoUrl(String demoUrl) { this.demoUrl = demoUrl; }
    public String getTechStack() { return techStack; }
    public void setTechStack(String techStack) { this.techStack = techStack; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
}
