package com.portfolio.blog.controller;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.blog.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
class SteamOnlyLoginTest {
 @Test void passwordLoginAndRegistrationAreDisabledByDefault(){
  var community=mock(CommunityService.class);
  var controller=new CommunityController(community,mock(MemberSessionService.class),new ObjectMapper(),mock(SteamLoginService.class),mock(ReportService.class),mock(ClientAddress.class));
  for(String action:new String[]{"login","register"})assertThatThrownBy(()->controller.login(action,new MockHttpServletRequest())).isInstanceOfSatisfying(ResponseStatusException.class,e->assertThat(e.getStatusCode().value()).isEqualTo(403));
  verifyNoInteractions(community);
 }
}
