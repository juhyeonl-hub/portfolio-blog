package com.portfolio.blog.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class BlockXFlightRelayHandler extends TextWebSocketHandler {

    private static final int MAX_MESSAGE_BYTES = 16 * 1024;

    private final ObjectMapper objectMapper;
    private final Map<String, RoomState> rooms = new ConcurrentHashMap<>();

    public BlockXFlightRelayHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String roomCode = normalizeRoomCode(queryParam(session.getUri(), "code"));
        String role = normalizeRole(queryParam(session.getUri(), "role"));
        if (roomCode.isBlank() || role.isBlank()) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        session.getAttributes().put("roomCode", roomCode);
        session.getAttributes().put("role", role);
        RoomState room = rooms.computeIfAbsent(roomCode, ignored -> new RoomState());
        WebSocketSession existing = room.sessions.putIfAbsent(role, session);
        if (existing != null) {
            if (existing.isOpen()) {
                session.close(new CloseStatus(1008, "Role already connected"));
                return;
            }
            room.sessions.put(role, session);
        }
        sendSystem(session, "joined", roomCode);
        broadcastRoomStatus(roomCode);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        if (message.getPayloadLength() > MAX_MESSAGE_BYTES) {
            session.close(new CloseStatus(1009, "Message too large"));
            return;
        }

        String roomCode = (String) session.getAttributes().get("roomCode");
        String role = (String) session.getAttributes().get("role");
        if (roomCode == null || role == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        JsonNode incoming = objectMapper.readTree(message.getPayload());
        ObjectNode outgoing = incoming.isObject() ? ((ObjectNode) incoming).deepCopy() : objectMapper.createObjectNode();
        outgoing.put("role", role);
        outgoing.put("relayTime", Instant.now().toEpochMilli());

        TextMessage relay = new TextMessage(objectMapper.writeValueAsString(outgoing));
        RoomState room = rooms.get(roomCode);
        if (room == null) return;
        for (WebSocketSession peer : room.sessions.values()) {
            if (peer != null && peer.isOpen() && !peer.getId().equals(session.getId())) {
                send(peer, relay);
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomCode = (String) session.getAttributes().get("roomCode");
        if (roomCode == null) return;

        RoomState room = rooms.get(roomCode);
        if (room == null) return;
        room.sessions.entrySet().removeIf(entry -> entry.getValue().getId().equals(session.getId()));
        if (room.sessions.isEmpty()) {
            rooms.remove(roomCode);
            return;
        }
        broadcastRoomStatus(roomCode);
    }

    private void sendSystem(WebSocketSession session, String type, String roomCode) throws IOException {
        ObjectNode message = objectMapper.createObjectNode();
        message.put("role", "relay");
        message.put("type", type);
        message.put("roomCode", roomCode);
        send(session, new TextMessage(objectMapper.writeValueAsString(message)));
    }

    private void broadcastRoomStatus(String roomCode) {
        RoomState room = rooms.get(roomCode);
        if (room == null) return;
        ObjectNode message = objectMapper.createObjectNode();
        message.put("role", "relay");
        message.put("type", "room-status");
        message.put("roomCode", roomCode);
        message.put("hostConnected", room.isConnected("host"));
        message.put("guestConnected", room.isConnected("guest"));
        message.put("readyToStart", room.isConnected("host") && room.isConnected("guest"));
        TextMessage status = new TextMessage(message.toString());
        for (WebSocketSession session : room.sessions.values()) {
            if (session != null && session.isOpen()) {
                try {
                    send(session, status);
                } catch (IOException ignored) {
                    // Connection cleanup is handled by the close callback.
                }
            }
        }
    }

    private void send(WebSocketSession session, TextMessage message) throws IOException {
        synchronized (session) {
            session.sendMessage(message);
        }
    }

    private String queryParam(URI uri, String key) {
        if (uri == null) return "";
        return UriComponentsBuilder.fromUri(uri).build().getQueryParams().getFirst(key);
    }

    private String normalizeRoomCode(String value) {
        if (value == null) return "";
        String cleaned = value.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        return cleaned.substring(0, Math.min(cleaned.length(), 8));
    }

    private String normalizeRole(String value) {
        if (value == null) return "";
        String role = value.toLowerCase(Locale.ROOT);
        return role.equals("host") || role.equals("guest") ? role : "";
    }

    private static class RoomState {
        private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

        private boolean isConnected(String role) {
            WebSocketSession session = sessions.get(role);
            return session != null && session.isOpen();
        }
    }
}
