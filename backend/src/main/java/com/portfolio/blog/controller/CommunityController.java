package com.portfolio.blog.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.blog.service.ClientAddress;
import com.portfolio.blog.service.CommunityService;
import com.portfolio.blog.service.SteamLoginService;
import com.portfolio.blog.service.MemberSessionService;
import com.portfolio.blog.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class CommunityController {
    private final com.portfolio.blog.service.MemberCookies cookies;
    private final CommunityService community;
    private final MemberSessionService sessions;
    private final ObjectMapper mapper;
    private final SteamLoginService steam;
    private final ReportService reports;
    private final ClientAddress address;
    public CommunityController(CommunityService community,MemberSessionService sessions,ObjectMapper mapper,SteamLoginService steam,ReportService reports,ClientAddress address,com.portfolio.blog.service.MemberCookies cookies){this.address=address;this.reports=reports;this.steam=steam;this.community=community;this.sessions=sessions;this.mapper=mapper;this.cookies=cookies;}
    @org.springframework.beans.factory.annotation.Value("${app.community.password-auth-enabled:false}")
    private boolean passwordAuthEnabled;
    @PostMapping("/api/community/auth/{action:register|login}")
    public ResponseEntity<?> login(@PathVariable String action,HttpServletRequest request)throws Exception {
        if(!passwordAuthEnabled)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Steam으로 로그인해 주세요.");
        JsonNode input=body(request);
        String username=input==null?"":input.path("username").asText();
        if(username.length()>32)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"아이디는 32자 이하로 입력하세요.");
        community.throttle(address.of(request)+"|"+username.toLowerCase(java.util.Locale.ROOT));
        return signedIn(community.authenticate(input,action.equals("register")),false,request);
    }
    @GetMapping("/api/community/auth/steam/start")
    public ResponseEntity<?> steamStart(HttpServletRequest request){community.throttle(address.of(request)+"|steam");var start=steam.start(null);return ResponseEntity.status(HttpStatus.FOUND).header(HttpHeaders.LOCATION,start.url()).header(HttpHeaders.SET_COOKIE,steamCookie(start.browserSecret(),300).toString()).cacheControl(CacheControl.noStore()).build();}
    @GetMapping("/api/community/auth/steam/callback")
    public ResponseEntity<?> steamCallback(@RequestParam Map<String,String> params,@CookieValue(value=STEAM_COOKIE,required=false)String browser){return redirect(steam.callback(params,browser));}
    @PostMapping("/api/community/auth/steam/exchange")
    public ResponseEntity<?> steamExchange(HttpServletRequest request,@CookieValue(value=STEAM_COOKIE,required=false)String browser)throws Exception{JsonNode input=body(request);var result=steam.exchange(input==null?null:input.path("code").asText(null),browser);return signedIn(result,true,request);}
    @PostMapping("/api/community/auth/steam/register")
    public ResponseEntity<?> steamRegister(HttpServletRequest request,@CookieValue(value=STEAM_COOKIE,required=false)String browser)throws Exception{community.throttle(address.of(request)+"|steam");JsonNode input=body(request);var result=steam.register(input==null?null:input.path("code").asText(null),input==null?null:input.path("username").asText(null),browser);return signedIn(result,true,request);}
    @PostMapping("/api/community/auth/steam/link")
    public ResponseEntity<?> steamLink(Authentication auth){var start=steam.start(auth.getName());return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE,steamCookie(start.browserSecret(),300).toString()).cacheControl(CacheControl.noStore()).body(Map.of("url",start.url()));}
    // Browser binding for Steam sign-in (CSRF): HttpOnly, SameSite=Lax so it survives the top-level return from Steam.
    private static final String STEAM_COOKIE="asbc_steam";
    private ResponseCookie steamCookie(String value,long maxAgeSeconds){return ResponseCookie.from(STEAM_COOKIE,value).httpOnly(true).secure(steam.secureCookie()).sameSite("Lax").path("/api/community/auth/steam").maxAge(maxAgeSeconds).build();}
    private ResponseEntity<?> redirect(String url){return ResponseEntity.status(HttpStatus.FOUND).cacheControl(CacheControl.noStore()).location(java.net.URI.create(url)).build();}
    private ResponseEntity<?> signedIn(Map<String,Object> result,boolean clearSteam,HttpServletRequest request){
        // Replace only this browser's previous session; other devices retain their independent sessions.
        String previous=cookies.read(request);if(previous!=null&&!previous.equals(result.get("token")))sessions.revoke(previous);
        var response=ResponseEntity.ok().cacheControl(CacheControl.noStore()).header(HttpHeaders.SET_COOKIE,cookies.set((String)result.get("token")));
        if(clearSteam)response.header(HttpHeaders.SET_COOKIE,steamCookie("",0).toString());
        return response.body(cookies.response(result));
    }
    /** Existing browser bearer sessions migrate once; another already signed-in account cannot be overwritten. */
    @PostMapping("/api/community/session")
    public ResponseEntity<?> migrate(Authentication auth,HttpServletRequest request){
        String existing=cookies.read(request),owner=sessions.member(existing),old=cookies.credential(request);
        if(owner!=null&&!owner.equals(auth.getName()))throw new ResponseStatusException(HttpStatus.CONFLICT,"로그인이 필요하거나 세션이 만료되었습니다. 다시 로그인하세요.");
        if(owner!=null){if(!existing.equals(old))sessions.revoke(old);return response(Map.of("member",community.member(owner),"csrfToken",cookies.csrf(existing)));}
        String token=sessions.rotate(old);if(token==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"다시 로그인하세요.");
        return signedIn(Map.of("token",token,"member",community.member(auth.getName())),false,request);
    }
    @GetMapping("/api/community/me")
    public ResponseEntity<?> me(Authentication auth,HttpServletRequest request){var member=new java.util.HashMap<String,Object>(community.member(auth.getName()));member.put("csrfToken",cookies.csrf(cookies.credential(request)));return response(member);}
    @DeleteMapping("/api/community/me")
    public ResponseEntity<?> deleteAccount(Authentication auth,HttpServletRequest request)throws Exception{community.deleteAccount(auth.getName(),body(request));return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE,cookies.set("")).build();}
    @PostMapping("/api/community/logout")
    public ResponseEntity<?> logout(HttpServletRequest request){sessions.revoke(cookies.credential(request));return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE,cookies.set("")).build();}
    @PostMapping("/api/community/builds")
    public ResponseEntity<?> create(Authentication auth,HttpServletRequest request)throws Exception{return ResponseEntity.status(201).cacheControl(CacheControl.noStore()).body(community.save(auth.getName(),null,body(request)));}
    @PutMapping("/api/community/builds/{id}")
    public ResponseEntity<?> update(Authentication auth,@PathVariable String id,HttpServletRequest request)throws Exception{return response(community.save(auth.getName(),id,body(request)));}
    @DeleteMapping("/api/community/builds/{id}")
    public ResponseEntity<?> delete(Authentication auth,@PathVariable String id,@RequestParam long revision){community.delete(auth.getName(),id,revision);return ResponseEntity.noContent().build();}
    @GetMapping("/api/public/shadowcraft/builds/{id}/community")
    public ResponseEntity<?> social(Authentication auth,@PathVariable String id){return response(community.social(id,auth!=null?auth.getName():null));}
    @PutMapping("/api/community/builds/{id}/vote")
    public ResponseEntity<?> vote(Authentication auth,@PathVariable String id){return response(community.vote(auth.getName(),id,true));}
    @DeleteMapping("/api/community/builds/{id}/vote")
    public ResponseEntity<?> unvote(Authentication auth,@PathVariable String id){return response(community.vote(auth.getName(),id,false));}
    @PostMapping("/api/community/builds/{id}/report")
    public ResponseEntity<?> reportBuild(Authentication auth,@PathVariable String id,HttpServletRequest request)throws Exception{reports.report(auth.getName(),id,body(request));return ResponseEntity.status(201).cacheControl(CacheControl.noStore()).build();}
    @GetMapping("/api/admin/shadowcraft/reports")
    public ResponseEntity<?> reportQueue(){return response(Map.of("items",reports.openQueue()));}
    @PostMapping("/api/admin/shadowcraft/reports/resolve")
    public ResponseEntity<?> resolveReport(HttpServletRequest request)throws Exception{JsonNode input=body(request);return response(reports.resolve(input==null?null:input.path("targetKey").asText(null),input==null?null:input.path("action").asText(null)));}
    private JsonNode body(HttpServletRequest request)throws Exception {
        byte[] bytes=request.getInputStream().readNBytes(32001);
        if(bytes.length>32000)throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,"입력이 너무 큽니다.");
        try{return mapper.readTree(bytes);}catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"JSON 형식을 확인하세요.");}
    }
    private ResponseEntity<?> response(Object value){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(value);}
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> failure(ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).cacheControl(CacheControl.noStore()).body(Map.of("error",e.getReason()==null?"요청 실패":e.getReason()));}
}
