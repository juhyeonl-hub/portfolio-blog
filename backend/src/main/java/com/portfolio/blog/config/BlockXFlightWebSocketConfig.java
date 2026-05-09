package com.portfolio.blog.config;

import com.portfolio.blog.websocket.BlockXFlightRelayHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class BlockXFlightWebSocketConfig implements WebSocketConfigurer {

    private final BlockXFlightRelayHandler relayHandler;

    public BlockXFlightWebSocketConfig(BlockXFlightRelayHandler relayHandler) {
        this.relayHandler = relayHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(relayHandler, "/ws/block-x-flight", "/ws/stack-flight")
            .setAllowedOriginPatterns(
                "http://localhost:*",
                "https://*.vercel.app",
                "https://juhyeonl.dev",
                "https://www.juhyeonl.dev"
            );
    }
}
