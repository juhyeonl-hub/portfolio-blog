package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.blog.service.ShadowcraftService;
import java.util.concurrent.CompletableFuture;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ShadowcraftEquippedItemTest {
    private final ObjectMapper mapper=new ObjectMapper();
    private final String input="{\"action\":\"item\",\"class\":\"gladiator\",\"region\":\"eu\",\"server\":\"1304\",\"id\":\"character+id=\",\"itemId\":\"123\",\"slot\":\"1\",\"enchant\":\"15\"}";
    private ShadowcraftController controller(HttpClient client) throws Exception {
        var service=mock(ShadowcraftService.class);when(service.profile("gladiator")).thenReturn(mapper.readTree("{}"));
        var c=new ShadowcraftController(service,mapper);ReflectionTestUtils.setField(c,"client",client);return c;
    }
    private MockHttpServletRequest request(String input){var r=new MockHttpServletRequest();r.setContent(input.getBytes(StandardCharsets.UTF_8));return r;}
    @SuppressWarnings("unchecked")
    private HttpResponse<byte[]> response(String text){var r=(HttpResponse<byte[]>)mock(HttpResponse.class);when(r.statusCode()).thenReturn(200);when(r.body()).thenReturn(text.getBytes(StandardCharsets.UTF_8));return r;}
    @Test void validatesBeforeNetworking() throws Exception {
        var client=mock(HttpClient.class);var c=controller(client);
        for(String patch:new String[]{"../x","0","-1","10000000000","https://other.test"}){
            var p=mapper.readTree(input);((com.fasterxml.jackson.databind.node.ObjectNode)p).put("itemId",patch);
            assertThat(c.armory(request(p.toString())).getStatusCode().value()).isEqualTo(400);
        }
        for(String key:new String[]{"slot","enchant"})for(String value:new String[]{"-1","100","x"}){
            var p=(com.fasterxml.jackson.databind.node.ObjectNode)mapper.readTree(input);p.put(key,value);
            assertThat(c.armory(request(p.toString())).getStatusCode().value()).isEqualTo(400);
        }
        verifyNoInteractions(client);
    }
    @Test void validatesEquippedSlotAndReturnsBoundIdentity() throws Exception {
        var client=mock(HttpClient.class);var c=controller(client);
        when(client.sendAsync(any(HttpRequest.class),any(HttpResponse.BodyHandler.class))).thenAnswer(invocation->{
            HttpRequest req=invocation.getArgument(0);
            assertThat(req.uri().getHost()).isEqualTo("aion2.plaync.com");assertThat(req.uri().getRawQuery()).contains("characterId=character%2Bid%3D");
            return CompletableFuture.completedFuture(response(req.uri().getPath().endsWith("/item")?"{\"id\":123,\"enchantLevel\":15,\"subStats\":[{\"id\":\"STR\",\"name\":\"Might\",\"value\":\"32\"}]}":"{\"equipment\":{\"equipmentList\":[{\"id\":123,\"slotPos\":1,\"enchantLevel\":15}]}}"));
        });
        var result=c.armory(request(input));assertThat(result.getStatusCode().value()).isEqualTo(200);
        var out=mapper.valueToTree(result.getBody());assertThat(out.path("characterId").asText()).isEqualTo("character+id=");assertThat(out.path("slotPos").asInt()).isEqualTo(1);assertThat(out.path("item").path("subStats").size()).isEqualTo(1);
        verify(client,times(2)).sendAsync(any(HttpRequest.class),any(HttpResponse.BodyHandler.class));
    }
    @Test void refusesChangedEquipmentBeforeFetchingDetails() throws Exception {
        var client=mock(HttpClient.class);var c=controller(client);
        when(client.sendAsync(any(HttpRequest.class),any(HttpResponse.BodyHandler.class))).thenAnswer(invocation->CompletableFuture.completedFuture(response("{\"equipment\":{\"equipmentList\":[{\"id\":999,\"slotPos\":1,\"enchantLevel\":15}]}}")));
        assertThat(c.armory(request(input)).getStatusCode().value()).isEqualTo(400);
        verify(client,times(1)).sendAsync(any(HttpRequest.class),any(HttpResponse.BodyHandler.class));
    }
}
