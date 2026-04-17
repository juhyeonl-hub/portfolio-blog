package com.portfolio.blog.service;

import com.portfolio.blog.model.Project;
import com.portfolio.blog.model.ProjectReview;
import com.portfolio.blog.repository.ProjectRepository;
import com.portfolio.blog.repository.ProjectReviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectReviewService {

    private final ProjectReviewRepository reviewRepository;
    private final ProjectRepository projectRepository;

    public ProjectReviewService(ProjectReviewRepository reviewRepository, ProjectRepository projectRepository) {
        this.reviewRepository = reviewRepository;
        this.projectRepository = projectRepository;
    }

    public List<ProjectReview> getByProjectId(Long projectId) {
        return reviewRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public ProjectReview create(Long projectId, String nickname, int rating, String comment) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        ProjectReview review = new ProjectReview();
        review.setProject(project);
        review.setNickname(nickname);
        review.setRating(rating);
        review.setComment(comment);
        return reviewRepository.save(review);
    }

    public void delete(Long id) {
        reviewRepository.deleteById(id);
    }
}
