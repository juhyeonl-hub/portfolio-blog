package com.portfolio.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GuestbookRequest {

    @NotBlank
    @Size(max = 50)
    private String nickname;

    @NotBlank
    @Size(max = 2000)
    private String message;

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
