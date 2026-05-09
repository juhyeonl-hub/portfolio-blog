package com.portfolio.blog.config;

import com.portfolio.blog.websocket.StackFlightRelayHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class StackFlightWebSocketConfig implements WebSocketConfigurer {

    private final StackFlightRelayHandler relayHandler;

    public StackFlightWebSocketConfig(StackFlightRelayHandler relayHandler) {
        this.relayHandler = relayHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(relayHandler, "/ws/stack-flight")
            .setAllowedOriginPatterns(
                "http://localhost:*",
                "https://*.vercel.app",
                "https://juhyeonl.dev",
                "https://www.juhyeonl.dev"
            );
    }
}
