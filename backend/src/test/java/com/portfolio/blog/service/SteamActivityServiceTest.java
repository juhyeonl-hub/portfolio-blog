package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SteamActivityServiceTest {
    @SuppressWarnings("unchecked")
    private HttpResponse<InputStream> response(int status,String body) {
        HttpResponse<InputStream> r=mock(HttpResponse.class);
        when(r.statusCode()).thenReturn(status);
        when(r.body()).thenAnswer(inv->new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));
        return r;
    }
    @Test void cachesAndRetainsTimestampOnFailureThenRecovers() throws Exception {
        var client=mock(HttpClient.class);var now=new AtomicLong(1000);
        var firstResponse=response(200,"{\"response\":{\"player_count\":42,\"result\":1}}");
        var failedResponse=response(503,"unavailable");
        var recoveredResponse=response(200,"{\"response\":{\"player_count\":0,\"result\":1}}");
        when(client.send(any(HttpRequest.class),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<InputStream>>any()))
            .thenReturn(firstResponse)
            .thenReturn(failedResponse)
            .thenReturn(recoveredResponse);
        var service=new SteamActivityService(new ObjectMapper(),client,now::get);
        var first=service.current();assertEquals(42,first.players());assertFalse(first.stale());
        service.current();verify(client,times(1)).send(argThat(r->r.uri().toString().equals(SteamActivityService.SOURCE)),any());
        now.addAndGet(60000);var failed=service.current();assertTrue(failed.stale());assertEquals(first.checkedAt(),failed.checkedAt());assertEquals(42,failed.players());
        service.current();verify(client,times(2)).send(any(),any());
        now.addAndGet(60000);assertEquals(0,service.current().players());assertFalse(service.current().stale());
    }
    @Test void rejectsInvalidCountsAndLimitsFailureRequests() throws Exception {
        for(String body:new String[]{"{}","null","<html>","{\"response\":{\"result\":1,\"player_count\":-1}}","{\"response\":{\"result\":1,\"player_count\":1.5}}","{\"response\":{\"result\":1,\"player_count\":\"42\"}}","{\"response\":{\"result\":0,\"player_count\":42}}","{\"response\":{\"result\":4294967297,\"player_count\":42}}","x".repeat(65537)}) {
            var client=mock(HttpClient.class);
            var invalidResponse=response(200,body);
            when(client.send(any(HttpRequest.class),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<InputStream>>any())).thenReturn(invalidResponse);
            var service=new SteamActivityService(new ObjectMapper(),client,()->1000);
            assertThrows(ResponseStatusException.class,service::current);assertThrows(ResponseStatusException.class,service::current);
            verify(client,times(1)).send(any(),any());
        }
    }
}
