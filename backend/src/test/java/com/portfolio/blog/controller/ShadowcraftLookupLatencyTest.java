package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class ShadowcraftLookupLatencyTest {
    @Test void acceptsOfficialResponsesSlowerThanFiveSecondsAndCachesThem() throws Exception {
        var count=new AtomicInteger();
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/profile",exchange->{
            count.incrementAndGet();
            try { Thread.sleep(5500); } catch(InterruptedException e) { Thread.currentThread().interrupt(); }
            byte[] payload="{\"profile\":{\"characterLevel\":45}}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type","application/json");
            exchange.sendResponseHeaders(200,payload.length);
            try(var body=exchange.getResponseBody()){body.write(payload);}
        });
        server.start();
        try {
            var controller=new ShadowcraftController(null,new ObjectMapper());
            var get=ShadowcraftController.class.getDeclaredMethod("get",String.class);
            get.setAccessible(true);
            String url="http://127.0.0.1:"+server.getAddress().getPort()+"/profile";
            var first=(JsonNode)get.invoke(controller,url);
            assertThat(first.path("profile").path("characterLevel").asInt()).isEqualTo(45);
            assertThat(get.invoke(controller,url)).isEqualTo(first);
            assertThat(count.get()).isEqualTo(1);
        } finally {server.stop(0);}
    }
}
