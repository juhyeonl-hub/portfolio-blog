package com.portfolio.blog.controller;
import com.fasterxml.jackson.databind.*;
import com.portfolio.blog.service.ShadowcraftService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
class ShadowcraftSnapshotTest {
 final ObjectMapper mapper=new ObjectMapper();
 final String first="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",second="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
 @SuppressWarnings("unchecked") HttpResponse<byte[]> response(String text){var r=(HttpResponse<byte[]>)mock(HttpResponse.class);when(r.statusCode()).thenReturn(200);when(r.body()).thenReturn(text.getBytes(StandardCharsets.UTF_8));return r;}
 ShadowcraftController controller(HttpClient client)throws Exception{var s=mock(ShadowcraftService.class);when(s.profile("gladiator")).thenReturn(mapper.readTree("{}"));var c=new ShadowcraftController(s,mapper);ReflectionTestUtils.setField(c,"client",client);return c;}
 MockHttpServletRequest input(String snapshot)throws Exception{var p=mapper.createObjectNode();p.put("action","item").put("class","gladiator").put("region","eu").put("server","1304").put("id","character-id").put("itemId","123").put("slot","1").put("enchant","15").put("snapshot",snapshot);var r=new MockHttpServletRequest();r.setContent(mapper.writeValueAsBytes(p));return r;}
 @Test void newLookupCannotReuseAnotherSnapshotsSameItemRolls()throws Exception{
  var client=mock(HttpClient.class);var c=controller(client);var rolls=new AtomicInteger();
  when(client.sendAsync(any(HttpRequest.class),any(HttpResponse.BodyHandler.class))).thenAnswer(call->{HttpRequest r=call.getArgument(0);return CompletableFuture.completedFuture(response(r.uri().getPath().endsWith("/item")?"{\"id\":123,\"enchantLevel\":15,\"roll\":"+rolls.incrementAndGet()+"}":"{\"equipment\":{\"equipmentList\":[{\"id\":123,\"slotPos\":1,\"enchantLevel\":15}]}}"));});
  var one=c.armory(input(first));assertThat(one.getStatusCode().value()).isEqualTo(200);c.armory(input(first));assertThat(rolls.get()).isEqualTo(1);
  var two=c.armory(input(second));assertThat(mapper.valueToTree(two.getBody()).path("item").path("roll").asInt()).isEqualTo(2);
  verify(client,times(4)).sendAsync(any(HttpRequest.class),any(HttpResponse.BodyHandler.class));
 }
 @Test void invalidNamespaceCannotTriggerNetwork()throws Exception{
  var client=mock(HttpClient.class);var c=controller(client);
  for(String value:new String[]{"bad","../path",first+"extra"})assertThat(c.armory(input(value)).getStatusCode().value()).isEqualTo(400);
  verifyNoInteractions(client);
 }
 @Test void concurrentIdenticalQueriesShareOnlyTheirInFlightRequest()throws Exception{
  var client=mock(HttpClient.class);var c=controller(client);var started=new CountDownLatch(1);var upstream=new CompletableFuture<HttpResponse<byte[]>>();
  when(client.sendAsync(any(HttpRequest.class),any(HttpResponse.BodyHandler.class))).thenAnswer(call->{started.countDown();return upstream;});
  var get=ShadowcraftController.class.getDeclaredMethod("get",String.class,String.class);get.setAccessible(true);
  var executor=Executors.newFixedThreadPool(2);
  try{
   var a=executor.submit(()->get.invoke(c,"https://aion2.plaync.com/api/character/equipment",first));assertThat(started.await(2,TimeUnit.SECONDS)).isTrue();
   var b=executor.submit(()->get.invoke(c,"https://aion2.plaync.com/api/character/equipment",first));upstream.complete(response("{\"value\":42}"));
   assertThat(a.get(2,TimeUnit.SECONDS)).isEqualTo(b.get(2,TimeUnit.SECONDS));verify(client,times(1)).sendAsync(any(HttpRequest.class),any(HttpResponse.BodyHandler.class));
  }finally{executor.shutdownNow();}
 }
 @Test void failuresDoNotPoisonLaterRetries()throws Exception{
  var client=mock(HttpClient.class);var c=controller(client);
  var success=response("{\"value\":42}");
  when(client.sendAsync(any(HttpRequest.class),any(HttpResponse.BodyHandler.class))).thenReturn(CompletableFuture.failedFuture(new java.io.IOException("offline")),CompletableFuture.completedFuture(success));
  var get=ShadowcraftController.class.getDeclaredMethod("get",String.class,String.class);get.setAccessible(true);
  assertThatThrownBy(()->get.invoke(c,"https://aion2.plaync.com/api/character/equipment",first));
  assertThat(((JsonNode)get.invoke(c,"https://aion2.plaync.com/api/character/equipment",first)).path("value").asInt()).isEqualTo(42);
 }
}
