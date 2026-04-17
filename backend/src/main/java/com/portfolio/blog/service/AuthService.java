package com.portfolio.blog.service;

import com.portfolio.blog.config.AppProperties;
import com.portfolio.blog.dto.LoginRequest;
import com.portfolio.blog.dto.LoginResponse;
import com.portfolio.blog.model.AdminUser;
import com.portfolio.blog.repository.AdminUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TotpService totpService;
    private final AppProperties appProperties;

    public AuthService(AdminUserRepository adminUserRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       TotpService totpService,
                       AppProperties appProperties) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.totpService = totpService;
        this.appProperties = appProperties;
    }

    public LoginResponse login(LoginRequest request) {
        AdminUser admin = adminUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (admin.isTotpEnabled()) {
            if (request.getTotpCode() == null || request.getTotpCode().isBlank()) {
                return new LoginResponse(true, null);
            }
            if (!totpService.verifyCode(admin.getTotpSecret(), request.getTotpCode())) {
                throw new RuntimeException("Invalid TOTP code");
            }
        }

        String token = jwtService.generateToken(admin.getUsername());
        return new LoginResponse(token);
    }

    public LoginResponse setupTotp(String username) {
        AdminUser admin = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        String secret = totpService.generateSecret();
        String qrCode = totpService.generateQrCodeDataUri(secret, username);

        admin.setTotpSecret(secret);
        adminUserRepository.save(admin);

        return new LoginResponse(true, qrCode);
    }

    public void enableTotp(String username, String code) {
        AdminUser admin = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getTotpSecret() == null) {
            throw new RuntimeException("TOTP not set up yet");
        }

        if (!totpService.verifyCode(admin.getTotpSecret(), code)) {
            throw new RuntimeException("Invalid TOTP code");
        }

        admin.setTotpEnabled(true);
        adminUserRepository.save(admin);
    }

    public void initializeAdminUser() {
        String username = appProperties.getAdmin().getUsername();
        String password = appProperties.getAdmin().getPassword();

        if (username == null || password == null) {
            return;
        }

        if (!adminUserRepository.existsByUsername(username)) {
            AdminUser admin = new AdminUser();
            admin.setUsername(username);
            admin.setPasswordHash(passwordEncoder.encode(password));
            adminUserRepository.save(admin);
        }
    }
}
