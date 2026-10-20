package com.portfolio.blog.service;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * The visitor's address for rate limits. Requests from ASBC's Cloudflare Pages proxy reach the backend from
 * Cloudflare's own addresses, shared by every visitor, so the proxy sends the visitor's address with a shared
 * secret. The header is trusted only when the secret matches; otherwise the connection address is used.
 */
@Component
public class ClientAddress {
    public static final String SECRET_HEADER = "X-ASBC-Proxy-Secret";
    public static final String ADDRESS_HEADER = "X-ASBC-Client-IP";
    // IPv4 or IPv6 text form (45 chars is the longest IPv6 with an embedded IPv4).
    private static final String ADDRESS = "[0-9A-Fa-f:.]{2,45}";
    private final byte[] secret;

    public ClientAddress(@Value("${app.proxy.client-ip-secret:}") String secret) {
        this.secret = secret.isBlank() ? null : secret.getBytes(StandardCharsets.UTF_8);
    }

    public String of(HttpServletRequest request) {
        String sent = request.getHeader(SECRET_HEADER), address = request.getHeader(ADDRESS_HEADER);
        if (secret != null && sent != null && address != null && address.matches(ADDRESS)
                && MessageDigest.isEqual(secret, sent.getBytes(StandardCharsets.UTF_8)))
            return address;
        return request.getRemoteAddr();
    }
}
