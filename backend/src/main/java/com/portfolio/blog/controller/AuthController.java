package com.portfolio.blog.controller;

import com.portfolio.blog.dto.LoginRequest;
import com.portfolio.blog.dto.LoginResponse;
import com.portfolio.blog.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/totp/setup")
    public ResponseEntity<LoginResponse> setupTotp(Authentication auth) {
        LoginResponse response = authService.setupTotp(auth.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/totp/enable")
    public ResponseEntity<Map<String, String>> enableTotp(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        authService.enableTotp(auth.getName(), body.get("code"));
        return ResponseEntity.ok(Map.of("message", "TOTP enabled successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("authenticated", false));
        }
        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "username", auth.getName()
        ));
    }
}
