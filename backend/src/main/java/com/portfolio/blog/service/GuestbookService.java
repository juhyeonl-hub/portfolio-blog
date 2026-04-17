package com.portfolio.blog.service;

import com.portfolio.blog.model.GuestbookEntry;
import com.portfolio.blog.repository.GuestbookRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GuestbookService {

    private final GuestbookRepository repository;

    public GuestbookService(GuestbookRepository repository) {
        this.repository = repository;
    }

    public List<GuestbookEntry> getAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    public GuestbookEntry create(GuestbookEntry entry) {
        return repository.save(entry);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
