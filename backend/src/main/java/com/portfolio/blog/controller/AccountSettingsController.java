package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.blog.service.AccountSettingsService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/community/settings")
public class AccountSettingsController {
    private final AccountSettingsService settings;
    private final ObjectMapper mapper;
    public AccountSettingsController(AccountSettingsService settings,ObjectMapper mapper){this.settings=settings;this.mapper=mapper;}
    @GetMapping
    public ResponseEntity<?> get(Authentication auth){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(settings.get(auth.getName()));}
    @PutMapping
    public ResponseEntity<?> save(Authentication auth,HttpServletRequest request)throws java.io.IOException {
        byte[] bytes=request.getInputStream().readNBytes(AccountSettingsService.MAX_BYTES+1);
        if(bytes.length>AccountSettingsService.MAX_BYTES)throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,"설정은 1 MB 이하여야 합니다.");
        com.fasterxml.jackson.databind.JsonNode input;
        try{input=mapper.readTree(bytes);}catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"JSON 형식을 확인하세요.");}
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(settings.save(auth.getName(),input));
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> failure(ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).cacheControl(CacheControl.noStore()).body(Map.of("error",e.getReason()==null?"요청 실패":e.getReason()));}
}
