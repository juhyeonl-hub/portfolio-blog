package com.portfolio.blog.service;

import com.portfolio.blog.model.ResumeSection;
import com.portfolio.blog.repository.ResumeSectionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResumeSectionService {

    private final ResumeSectionRepository repository;

    public ResumeSectionService(ResumeSectionRepository repository) {
        this.repository = repository;
    }

    public List<ResumeSection> getAll() {
        return repository.findAllByOrderByDisplayOrderAsc();
    }

    public ResumeSection getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume section not found"));
    }

    public ResumeSection create(ResumeSection section) {
        return repository.save(section);
    }

    public ResumeSection update(Long id, ResumeSection updated) {
        ResumeSection section = getById(id);
        section.setSectionType(updated.getSectionType());
        section.setTitle(updated.getTitle());
        section.setContent(updated.getContent());
        section.setDisplayOrder(updated.getDisplayOrder());
        return repository.save(section);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
