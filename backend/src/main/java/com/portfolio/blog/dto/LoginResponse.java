package com.portfolio.blog.dto;

public class LoginResponse {

    private String token;
    private boolean totpRequired;
    private String totpQrCode;

    public LoginResponse(String token) {
        this.token = token;
        this.totpRequired = false;
    }

    public LoginResponse(boolean totpRequired, String totpQrCode) {
        this.totpRequired = totpRequired;
        this.totpQrCode = totpQrCode;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public boolean isTotpRequired() { return totpRequired; }
    public void setTotpRequired(boolean totpRequired) { this.totpRequired = totpRequired; }
    public String getTotpQrCode() { return totpQrCode; }
    public void setTotpQrCode(String totpQrCode) { this.totpQrCode = totpQrCode; }
}
