package com.portfolio.blog.config;

import com.portfolio.blog.service.ClientAddress;
import com.portfolio.blog.service.RequestRateLimit;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/** Runs after authorization: unauthorized admin bodies never enter memory. */
public class ApiRequestGuard extends OncePerRequestFilter {
    private final ClientAddress addresses;private final RequestRateLimit limits;
    public ApiRequestGuard(ClientAddress addresses,RequestRateLimit limits){this.addresses=addresses;this.limits=limits;}
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException {
        String path=request.getRequestURI(),method=request.getMethod();
        if(!path.startsWith("/api/")){chain.doFilter(request,response);return;}
        String client=addresses.of(request);
        if(path.equals("/api/auth/login") && !limits.allow("admin-login:"+client,20,600000)){reject(response,429,"로그인 시도가 많습니다. 10분 후 다시 시도하세요.",600);return;}
        boolean write=java.util.Set.of("POST","PUT","PATCH","DELETE").contains(method);
        var auth=SecurityContextHolder.getContext().getAuthentication();
        boolean member=auth!=null&&auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_MEMBER"));
        boolean admin=auth!=null&&auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));
        if(!admin && !limits.allow((write?"write:":"read:")+(member?"member:"+auth.getName():client),write?180:1200,60000)){reject(response,429,"요청이 많습니다. 잠시 후 다시 시도하세요.");return;}
        // A single visitor must not consume the armory's entire shared upstream quota.
        if(!admin&&path.equals("/api/public/shadowcraft/armory")&&!limits.allow("armory:"+client,40,60000)){reject(response,429,"조회가 많습니다. 잠시 후 다시 시도하세요.");return;}
        if(!write){chain.doFilter(request,response);return;}
        int max=admin?8_000_000:path.equals("/api/community/settings")?1_100_000:path.equals("/api/public/webhook/github")?2_000_000:64_000;
        if(request.getContentLengthLong()>max){reject(response,413,"입력이 너무 큽니다.");return;}
        if(admin&&request.getContentType()!=null&&request.getContentType().toLowerCase(java.util.Locale.ROOT).startsWith("multipart/")){chain.doFilter(request,response);return;}
        byte[] body=request.getInputStream().readNBytes(max+1);
        if(body.length>max){reject(response,413,"입력이 너무 큽니다.");return;}
        chain.doFilter(new HttpServletRequestWrapper(request){
            @Override public ServletInputStream getInputStream(){var input=new ByteArrayInputStream(body);return new ServletInputStream(){
                public int read(){return input.read();}public int read(byte[] b,int o,int n){return input.read(b,o,n);}
                public boolean isFinished(){return input.available()==0;}public boolean isReady(){return true;}
                public void setReadListener(ReadListener listener){throw new IllegalStateException("Synchronous API body");}
            };}
            @Override public BufferedReader getReader(){return new BufferedReader(new InputStreamReader(getInputStream(),StandardCharsets.UTF_8));}
        },response);
    }
    private void reject(HttpServletResponse response,int status,String message)throws IOException{reject(response,status,message,60);}
    private void reject(HttpServletResponse response,int status,String message,int retrySeconds)throws IOException{response.setStatus(status);response.setHeader("Cache-Control","no-store");if(status==429)response.setHeader("Retry-After",Integer.toString(retrySeconds));response.setContentType("application/json;charset=UTF-8");response.getWriter().write("{\"error\":\""+message+"\"}");}
}
