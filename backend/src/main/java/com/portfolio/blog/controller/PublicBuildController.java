package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.portfolio.blog.service.PublicBuildService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class PublicBuildController {
    private final PublicBuildService service;private final ObjectMapper mapper;
    public PublicBuildController(PublicBuildService service,ObjectMapper mapper){this.service=service;this.mapper=mapper;}
    @GetMapping("/api/public/shadowcraft/builds")
    public ResponseEntity<?> list(@RequestParam(defaultValue="",name="class")String key,@RequestParam(defaultValue="")String q,@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="")String author,@RequestParam(defaultValue="latest")String sort){return response(service.list(false,key,q,page,author,sort));}
    @GetMapping("/api/admin/shadowcraft/builds")
    public ResponseEntity<?> adminList(@RequestParam(defaultValue="",name="class")String key,@RequestParam(defaultValue="")String q,@RequestParam(defaultValue="0")int page){return response(service.list(true,key,q,page));}
    @GetMapping("/api/public/shadowcraft/build-authors")
    public ResponseEntity<?> authors(@RequestParam(defaultValue="")String q,@RequestParam(defaultValue="0")int page){return response(service.authors(q,page));}
    @GetMapping("/api/public/shadowcraft/builds/{id}")
    public ResponseEntity<?> detail(@PathVariable String id){return response(service.get(id,false));}
    @GetMapping("/api/admin/shadowcraft/builds/{id}")
    public ResponseEntity<?> adminDetail(@PathVariable String id){return response(service.get(id,true));}
    @PostMapping("/api/admin/shadowcraft/builds")
    public ResponseEntity<?> create(HttpServletRequest request)throws Exception{return ResponseEntity.status(201).cacheControl(CacheControl.noStore()).body(service.save(null,body(request)));}
    @PutMapping("/api/admin/shadowcraft/builds/{id}")
    public ResponseEntity<?> update(@PathVariable String id,HttpServletRequest request)throws Exception{return response(service.save(id,body(request)));}
    @DeleteMapping("/api/admin/shadowcraft/builds/{id}")
    public ResponseEntity<?> delete(@PathVariable String id,@RequestParam long revision){service.delete(id,revision);return ResponseEntity.noContent().build();}
    private JsonNode body(HttpServletRequest request)throws Exception{byte[] bytes=request.getInputStream().readNBytes(32001);if(bytes.length>32000)throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,"입력이 너무 큽니다.");try{return mapper.readTree(bytes);}catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"빌드 데이터를 읽을 수 없습니다. 작성 내용을 따로 보관한 뒤 다시 시도해 주세요.");}}
    private ResponseEntity<?> response(Object value){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(value);}
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> failure(ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).body(Map.of("error",e.getReason()==null?"요청 실패":e.getReason()));}
}
