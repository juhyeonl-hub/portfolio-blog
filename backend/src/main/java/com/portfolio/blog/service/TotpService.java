package com.portfolio.blog.service;

import dev.samstevens.totp.code.*;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
public class TotpService {

    private static final String ISSUER = "PortfolioBlog";

    public String generateSecret() {
        return new DefaultSecretGenerator().generate();
    }

    public String generateQrCodeDataUri(String secret, String username) {
        QrData qrData = new QrData.Builder()
                .label(username)
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        try {
            ZxingPngQrGenerator generator = new ZxingPngQrGenerator();
            byte[] imageData = generator.generate(qrData);
            String mimeType = generator.getImageMimeType();
            return "data:" + mimeType + ";base64," + Base64.getEncoder().encodeToString(imageData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    public boolean verifyCode(String secret, String code) {
        CodeVerifier verifier = new DefaultCodeVerifier(
                new DefaultCodeGenerator(),
                new SystemTimeProvider()
        );
        return verifier.isValidCode(secret, code);
    }
}
