package com.portfolio.blog.security;
import java.net.URI;
import java.net.http.*;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
class BoundedHttpTest {
 @Test void chunkedLimitCancelsBeforeOversizedAllocation(){
  var b=new BoundedHttp.Body(5);var sub=mock(Flow.Subscription.class);b.onSubscribe(sub);
  b.onNext(List.of(ByteBuffer.wrap(new byte[]{1,2,3})));b.onNext(List.of(ByteBuffer.wrap(new byte[]{4,5,6})));b.onComplete();
  verify(sub).cancel();assertThat(b.getBody().toCompletableFuture()).isCompletedExceptionally();
 }
 @Test void exactLimitAndMultipleChunksSucceed(){var b=new BoundedHttp.Body(5);b.onSubscribe(mock(Flow.Subscription.class));b.onNext(List.of(ByteBuffer.wrap(new byte[]{1,2}),ByteBuffer.wrap(new byte[]{3,4,5})));b.onComplete();assertThat(b.getBody().toCompletableFuture().join()).containsExactly(1,2,3,4,5);}
 @Test void stalledBodyCancelsUnderlyingRequest()throws Exception{
  var client=mock(HttpClient.class);var pending=new CompletableFuture<HttpResponse<byte[]>>();
  when(client.sendAsync(any(HttpRequest.class),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<byte[]>>any())).thenReturn(pending);
  var request=HttpRequest.newBuilder(URI.create("https://example.invalid/")).timeout(Duration.ofMillis(30)).build();
  assertThatThrownBy(()->BoundedHttp.send(client,request,100)).isInstanceOf(HttpTimeoutException.class);assertThat(pending.isCancelled()).isTrue();
 }
 @Test void realHttpChunksAndRedirectAreBounded()throws Exception{
  var server=com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress("127.0.0.1",0),0);
  server.createContext("/large",e->{e.sendResponseHeaders(200,0);try(var out=e.getResponseBody()){out.write(new byte[2048]);}catch(java.io.IOException ignored){}});
  server.createContext("/redirect",e->{e.getResponseHeaders().set("Location","http://127.0.0.1:1/private");e.sendResponseHeaders(302,-1);e.close();});server.start();
  try(var client=HttpClient.newHttpClient()) {var base="http://127.0.0.1:"+server.getAddress().getPort();
   assertThatThrownBy(()->BoundedHttp.send(client,HttpRequest.newBuilder(URI.create(base+"/large")).timeout(Duration.ofSeconds(2)).build(),1024)).isInstanceOf(java.io.IOException.class);
   assertThat(BoundedHttp.send(client,HttpRequest.newBuilder(URI.create(base+"/redirect")).timeout(Duration.ofSeconds(2)).build(),1024).statusCode()).isEqualTo(302);
  } finally{server.stop(0);}
 }
}
