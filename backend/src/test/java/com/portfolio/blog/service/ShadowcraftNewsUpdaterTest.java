package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class ShadowcraftNewsUpdaterTest {
    @SuppressWarnings("unchecked")
    @Test void successUpdatesOnlyNews() throws Exception {
        var service=mock(ShadowcraftService.class);
        var client=mock(HttpClient.class);
        HttpResponse<byte[]> response=mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"contentList\":[{\"id\":1,\"title\":\"Official update\"}]}".getBytes());
        when(client.send(any(HttpRequest.class),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<byte[]>>any())).thenReturn(response);
        new ShadowcraftNewsUpdater(service,new ObjectMapper(),client).refresh();
        verify(service).updateNews(argThat(n->n.path("contentList").isArray()));
        verify(service,never()).update(anyString(),any());
    }
    @SuppressWarnings("unchecked")
    @Test void blockedAndMalformedResponsesDoNotWrite() throws Exception {
        var service=mock(ShadowcraftService.class);
        var client=mock(HttpClient.class);
        HttpResponse<byte[]> response=mock(HttpResponse.class);
        when(client.send(any(HttpRequest.class),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<byte[]>>any())).thenReturn(response);
        when(response.statusCode()).thenReturn(403);
        var updater=new ShadowcraftNewsUpdater(service,new ObjectMapper(),client);
        updater.refresh();
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("<html>invalid</html>".getBytes());
        updater.refresh();
        when(response.body()).thenReturn(new byte[1_000_001]);
        updater.refresh();
        verifyNoInteractions(service);
    }
}
