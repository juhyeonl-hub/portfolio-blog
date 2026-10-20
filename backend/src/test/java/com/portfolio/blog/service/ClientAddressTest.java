package com.portfolio.blog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

/** The proxy's visitor address is used only with the configured secret and a well-formed address. */
class ClientAddressTest {
    private static MockHttpServletRequest request(String secret, String address) {
        var request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.9");
        if (secret != null) request.addHeader(ClientAddress.SECRET_HEADER, secret);
        if (address != null) request.addHeader(ClientAddress.ADDRESS_HEADER, address);
        return request;
    }

    @Test
    void trustsTheProxyAddressOnlyWithTheSecret() {
        var resolver = new ClientAddress("s3cret-value");
        assertEquals("198.51.100.7", resolver.of(request("s3cret-value", "198.51.100.7")));
        assertEquals("2001:db8::1", resolver.of(request("s3cret-value", "2001:db8::1")));
        assertEquals("203.0.113.9", resolver.of(request("wrong", "198.51.100.7")));
        assertEquals("203.0.113.9", resolver.of(request(null, "198.51.100.7")));
        assertEquals("203.0.113.9", resolver.of(request("s3cret-value", null)));
        for (String bad : new String[]{"198.51.100.7, 10.0.0.1", "evil|steam", "", "x".repeat(46)})
            assertEquals("203.0.113.9", resolver.of(request("s3cret-value", bad)), bad);
    }

    @Test
    void withoutAConfiguredSecretHeadersAreIgnored() {
        var resolver = new ClientAddress("");
        assertEquals("203.0.113.9", resolver.of(request("", "198.51.100.7")));
        assertEquals("203.0.113.9", resolver.of(request("anything", "198.51.100.7")));
    }
}
