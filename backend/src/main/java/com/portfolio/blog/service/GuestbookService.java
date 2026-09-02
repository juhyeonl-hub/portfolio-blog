package com.portfolio.blog.service;

import com.portfolio.blog.dto.GuestbookRequest;
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

    public GuestbookEntry create(GuestbookRequest request) {
        GuestbookEntry entry = new GuestbookEntry();
        entry.setNickname(request.getNickname().trim());
        entry.setMessage(request.getMessage().trim());
        return repository.save(entry);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
