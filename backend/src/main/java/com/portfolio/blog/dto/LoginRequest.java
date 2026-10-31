package com.portfolio.blog.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank
    @jakarta.validation.constraints.Size(max=64)
    private String username;

    @NotBlank
    @jakarta.validation.constraints.Size(max=72)
    private String password;

    @jakarta.validation.constraints.Pattern(regexp="(?:[0-9]{6})?")
    private String totpCode;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getTotpCode() { return totpCode; }
    public void setTotpCode(String totpCode) { this.totpCode = totpCode; }
}
