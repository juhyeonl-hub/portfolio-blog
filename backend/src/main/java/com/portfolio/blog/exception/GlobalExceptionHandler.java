package com.portfolio.blog.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String message = e.getMessage();

        if (message != null && message.contains("Invalid credentials")) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (message != null && message.contains("Invalid TOTP")) {
            status = HttpStatus.UNAUTHORIZED;
        }

        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
