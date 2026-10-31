package com.portfolio.blog.config;
import com.portfolio.blog.service.MemberCookies;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.web.filter.OncePerRequestFilter;

/** Bearer API clients are not ambient credentials. Cookie writes require a session-bound CSRF proof. */
public class MemberCsrfFilter extends OncePerRequestFilter {
 private final MemberCookies cookies;
 public MemberCsrfFilter(MemberCookies cookies){this.cookies=cookies;}
 protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException {
  String path=request.getRequestURI();boolean write=java.util.Set.of("POST","PUT","PATCH","DELETE").contains(request.getMethod());
  // Settings reads are also bound to the tab session: a newer cookie must not populate an older account cache.
  boolean boundRead=path.equals("/api/community/settings")&&request.getMethod().equals("GET");
  if((write||boundRead)&&path.startsWith("/api/community/")) {
   boolean login=java.util.Set.of("/api/community/auth/login","/api/community/auth/register","/api/community/auth/steam/exchange","/api/community/auth/steam/register").contains(path);
   // Login exchanges have a separate one-time browser binding; forbid simple cross-site form submissions as well.
   if(login && (request.getContentType()==null||!request.getContentType().toLowerCase(java.util.Locale.ROOT).split(";",2)[0].trim().equals("application/json"))){deny(response);return;}
   if("cross-site".equals(request.getHeader("Sec-Fetch-Site"))){deny(response);return;}
   if(!login&&Boolean.TRUE.equals(request.getAttribute(MemberCookies.AUTH_ATTRIBUTE))&&!cookies.matches(cookies.read(request),request.getHeader("X-ASBC-CSRF"))){deny(response);return;}
  }
  chain.doFilter(request,response);
 }
 private void deny(HttpServletResponse response)throws IOException{response.setStatus(403);response.setHeader("Cache-Control","no-store");response.setContentType("application/json;charset=UTF-8");response.getWriter().write("{\"error\":\"로그인이 필요하거나 세션이 만료되었습니다. 다시 로그인하세요.\"}");}
}
