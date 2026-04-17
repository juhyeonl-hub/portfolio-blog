package com.portfolio.blog.config;

import com.portfolio.blog.service.AuthService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements ApplicationRunner {

    private final AuthService authService;

    public AdminInitializer(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public void run(ApplicationArguments args) {
        authService.initializeAdminUser();
    }
}
