package com.portfolio.blog.service;

import com.portfolio.blog.dto.GuestbookRequest;
import com.portfolio.blog.model.GuestbookEntry;
import com.portfolio.blog.repository.GuestbookRepository;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GuestbookServiceTest {

    @Test
    void createsServerOwnedEntityFromPublicRequest() {
        GuestbookRepository repository = mock(GuestbookRepository.class);
        when(repository.save(any(GuestbookEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        GuestbookRequest request = new GuestbookRequest();
        request.setNickname("  Visitor  ");
        request.setMessage("  Hello  ");

        GuestbookEntry saved = new GuestbookService(repository).create(request);

        assertThat(saved.getId()).isNull();
        assertThat(saved.getNickname()).isEqualTo("Visitor");
        assertThat(saved.getMessage()).isEqualTo("Hello");
        assertThat(saved.getCreatedAt()).isNotNull();
    }
}
