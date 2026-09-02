package com.portfolio.blog.security;

import com.portfolio.blog.config.AppProperties;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;

@Component
public class GitHubWebhookVerifier {

    private static final String SIGNATURE_PREFIX = "sha256=";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final AppProperties appProperties;

    public GitHubWebhookVerifier(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public boolean isConfigured() {
        String secret = appProperties.getGithub().getWebhookSecret();
        return secret != null && !secret.isBlank();
    }

    public boolean isValid(byte[] payload, String providedSignature) {
        if (!isConfigured()
                || providedSignature == null
                || !providedSignature.startsWith(SIGNATURE_PREFIX)) {
            return false;
        }

        try {
            String secret = appProperties.getGithub().getWebhookSecret();
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            String expectedSignature = SIGNATURE_PREFIX
                    + HexFormat.of().formatHex(mac.doFinal(payload));

            return MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.US_ASCII),
                    providedSignature.getBytes(StandardCharsets.US_ASCII));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Unable to verify GitHub webhook signature", e);
        }
    }
}
