package com.portfolio.blog.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    private String totpCode;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getTotpCode() { return totpCode; }
    public void setTotpCode(String totpCode) { this.totpCode = totpCode; }
}
