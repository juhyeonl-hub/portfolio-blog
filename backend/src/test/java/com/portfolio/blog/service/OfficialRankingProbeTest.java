package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class OfficialRankingProbeTest {
    @SuppressWarnings("unchecked")
    private static HttpClient client(int status, byte[]... bodies) throws Exception {
        var client = mock(HttpClient.class);
        HttpResponse<byte[]> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        var stub = when(response.body());
        for (byte[] body : bodies) stub = stub.thenReturn(body);
        when(client.sendAsync(any(HttpRequest.class), org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<byte[]>>any())).thenReturn(java.util.concurrent.CompletableFuture.completedFuture(response));
        return client;
    }

    @Test void beforeFirstProbeStatusIsUnknown() {
        var status = new OfficialRankingProbe(new ObjectMapper(), mock(HttpClient.class)).status();
        assertTrue(status.get("checkedAt").isNull());
        assertTrue(status.get("failed").asBoolean());
        for (String kind : OfficialRankingProbe.kinds()) assertFalse(status.path("published").path(kind).asBoolean(true));
    }

    @Test void emptyListsMeanNotPublished() throws Exception {
        var probe = new OfficialRankingProbe(new ObjectMapper(), client(200, "{\"friendRankingList\":null,\"myRanking\":null,\"rankingList\":[],\"season\":null}".getBytes()));
        probe.probe();
        var status = probe.status();
        assertFalse(status.get("checkedAt").isNull());
        assertFalse(status.get("failed").asBoolean());
        for (String kind : OfficialRankingProbe.kinds()) assertFalse(status.path("published").path(kind).asBoolean(true));
        assertEquals(0, status.path("counts").path("eu").path("abyss").asInt(-1));
        assertEquals(OfficialRankingProbe.SAMPLE_SERVERS.size(), status.path("counts").size());
    }

    @Test void anyRowsMarkThatKindPublishedWithoutStoringThem() throws Exception {
        var rows = "{\"rankingList\":[{\"rank\":1,\"characterId\":\"abc\",\"characterName\":\"Someone\",\"classId\":17,\"point\":1234}],\"season\":{\"id\":1}}";
        var probe = new OfficialRankingProbe(new ObjectMapper(), client(200, rows.getBytes()));
        probe.probe();
        var status = probe.status();
        for (String kind : OfficialRankingProbe.kinds()) assertTrue(status.path("published").path(kind).asBoolean(false));
        assertFalse(status.toString().contains("Someone"), "no character data in the status");
        assertFalse(status.toString().contains("abc"));
    }

    @Test void failuresAndMalformedBodiesAreCountedAsFailedNotPublished() throws Exception {
        var probe = new OfficialRankingProbe(new ObjectMapper(), client(503, "down".getBytes()));
        probe.probe();
        assertTrue(probe.status().get("failed").asBoolean());
        assertFalse(probe.status().path("published").path("abyss").asBoolean(true));
        var malformed = new OfficialRankingProbe(new ObjectMapper(), client(200, "<html>challenge</html>".getBytes()));
        malformed.probe();
        assertTrue(malformed.status().get("failed").asBoolean());
        var wrongShape = new OfficialRankingProbe(new ObjectMapper(), client(200, "{\"rankingList\":\"no\"}".getBytes()));
        wrongShape.probe();
        assertTrue(wrongShape.status().get("failed").asBoolean());
        assertFalse(wrongShape.status().path("published").path("arenaOfSolitude").asBoolean(true));
    }

    @Test void statusIsACopy() throws Exception {
        var probe = new OfficialRankingProbe(new ObjectMapper(), client(200, "{\"rankingList\":[]}".getBytes()));
        probe.probe();
        ((com.fasterxml.jackson.databind.node.ObjectNode) probe.status()).put("failed", true);
        assertFalse(probe.status().get("failed").asBoolean());
    }
}
