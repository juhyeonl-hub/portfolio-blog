package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.blog.service.CommunityService;
import com.portfolio.blog.service.MemberSessionService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class CommunityController {
    private final CommunityService community;
    private final MemberSessionService sessions;
    private final ObjectMapper mapper;
    public CommunityController(CommunityService community,MemberSessionService sessions,ObjectMapper mapper){this.community=community;this.sessions=sessions;this.mapper=mapper;}
    @PostMapping("/api/community/auth/{action:register|login}")
    public ResponseEntity<?> login(@PathVariable String action,HttpServletRequest request)throws Exception {
        JsonNode input=body(request);
        String username=input==null?"":input.path("username").asText();
        if(username.length()>32)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"아이디는 32자 이하로 입력하세요.");
        community.throttle(request.getRemoteAddr()+"|"+username.toLowerCase(java.util.Locale.ROOT));
        return response(community.authenticate(input,action.equals("register")));
    }
    @GetMapping("/api/community/me")
    public ResponseEntity<?> me(Authentication auth){return response(community.member(auth.getName()));}
    @PostMapping("/api/community/logout")
    public ResponseEntity<?> logout(HttpServletRequest request){sessions.revoke(request.getHeader("Authorization").substring(7));return ResponseEntity.noContent().build();}
    @PostMapping("/api/community/builds")
    public ResponseEntity<?> create(Authentication auth,HttpServletRequest request)throws Exception{return ResponseEntity.status(201).cacheControl(CacheControl.noStore()).body(community.save(auth.getName(),null,body(request)));}
    @PutMapping("/api/community/builds/{id}")
    public ResponseEntity<?> update(Authentication auth,@PathVariable String id,HttpServletRequest request)throws Exception{return response(community.save(auth.getName(),id,body(request)));}
    @DeleteMapping("/api/community/builds/{id}")
    public ResponseEntity<?> delete(Authentication auth,@PathVariable String id,@RequestParam long revision){community.delete(auth.getName(),id,revision);return ResponseEntity.noContent().build();}
    @GetMapping("/api/public/shadowcraft/builds/{id}/community")
    public ResponseEntity<?> social(Authentication auth,@PathVariable String id,@RequestParam(defaultValue="0")int page){return response(community.social(id,auth!=null?auth.getName():null,page));}
    @PutMapping("/api/community/builds/{id}/vote")
    public ResponseEntity<?> vote(Authentication auth,@PathVariable String id){return response(community.vote(auth.getName(),id,true));}
    @DeleteMapping("/api/community/builds/{id}/vote")
    public ResponseEntity<?> unvote(Authentication auth,@PathVariable String id){return response(community.vote(auth.getName(),id,false));}
    @PostMapping("/api/community/builds/{id}/comments")
    public ResponseEntity<?> comment(Authentication auth,@PathVariable String id,HttpServletRequest request)throws Exception{community.comment(auth.getName(),id,body(request));return ResponseEntity.status(201).build();}
    @DeleteMapping("/api/community/builds/{id}/comments/{comment}")
    public ResponseEntity<?> deleteComment(Authentication auth,@PathVariable String id,@PathVariable String comment){community.deleteComment(auth.getName(),id,comment,false);return ResponseEntity.noContent().build();}
    @DeleteMapping("/api/admin/shadowcraft/builds/{id}/comments/{comment}")
    public ResponseEntity<?> moderate(Authentication auth,@PathVariable String id,@PathVariable String comment){community.deleteComment(auth.getName(),id,comment,true);return ResponseEntity.noContent().build();}
    private JsonNode body(HttpServletRequest request)throws Exception {
        byte[] bytes=request.getInputStream().readNBytes(32001);
        if(bytes.length>32000)throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,"입력이 너무 큽니다.");
        try{return mapper.readTree(bytes);}catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"JSON 형식을 확인하세요.");}
    }
    private ResponseEntity<?> response(Object value){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(value);}
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> failure(ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).cacheControl(CacheControl.noStore()).body(Map.of("error",e.getReason()==null?"요청 실패":e.getReason()));}
}
