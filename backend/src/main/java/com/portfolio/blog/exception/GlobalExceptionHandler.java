package com.portfolio.blog.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Database errors are logged here and answered with a generic message: SQL text and constraint names never reach clients. */
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> handleDataAccessException(DataAccessException e) {
        log.error("Database request failed ({})", e.getClass().getSimpleName());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "요청을 처리하지 못했습니다."));
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<Map<String,String>> handleStatus(org.springframework.web.server.ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).cacheControl(org.springframework.http.CacheControl.noStore()).body(Map.of("error", e.getReason() == null ? "요청을 처리하지 못했습니다." : e.getReason()));
    }

    @ExceptionHandler({org.springframework.http.converter.HttpMessageNotReadableException.class, org.springframework.web.bind.MethodArgumentNotValidException.class})
    public ResponseEntity<Map<String,String>> handleInput(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", "입력 형식을 확인하세요."));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        String message = e.getMessage();
        if ("Invalid credentials".equals(message) || "Invalid TOTP code".equals(message))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        // Only these intentional business messages can leave the server; arbitrary exceptions cannot.
        if (java.util.Set.of("Post not found", "Project not found", "Guestbook entry not found", "Review not found", "Resume item not found", "Admin not found", "TOTP not set up yet").contains(message == null ? "" : message))
            return ResponseEntity.badRequest().body(Map.of("error", message));
        log.warn("Request failed ({})", e.getClass().getSimpleName());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "요청을 처리하지 못했습니다."));
    }
}
