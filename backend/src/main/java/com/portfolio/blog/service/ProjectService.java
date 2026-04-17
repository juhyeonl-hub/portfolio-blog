package com.portfolio.blog.service;

import com.portfolio.blog.dto.ProjectRequest;
import com.portfolio.blog.model.Project;
import com.portfolio.blog.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<Project> getPublishedProjects() {
        return projectRepository.findByPublishedTrueOrderByDisplayOrderAsc();
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAllByOrderByDisplayOrderAsc();
    }

    public Project getBySlug(String slug) {
        return projectRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    public Project getById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    public Project create(ProjectRequest request) {
        Project project = new Project();
        project.setTitle(request.getTitle());
        project.setSlug(generateSlug(request.getTitle()));
        applyRequest(project, request);
        return projectRepository.save(project);
    }

    public Project update(Long id, ProjectRequest request) {
        Project project = getById(id);
        applyRequest(project, request);
        return projectRepository.save(project);
    }

    public void delete(Long id) {
        projectRepository.deleteById(id);
    }

    private void applyRequest(Project project, ProjectRequest request) {
        project.setTitle(request.getTitle());
        project.setShortDescription(request.getShortDescription());
        project.setFullDescription(request.getFullDescription());
        project.setThumbnailUrl(request.getThumbnailUrl());
        project.setGithubUrl(request.getGithubUrl());
        project.setDemoUrl(request.getDemoUrl());
        project.setTechStack(request.getTechStack());
        project.setDisplayOrder(request.getDisplayOrder());
        project.setPublished(request.isPublished());
    }

    private String generateSlug(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
