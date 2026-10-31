package com.portfolio.blog.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.nio.file.*;
import java.nio.ByteBuffer;
import java.util.List;
import java.util.concurrent.Flow;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
class ShadowcraftBoardUpdaterTest {
 @Test void rejectsCodeAndDuplicateFields() {
  assertThatThrownBy(()->ShadowcraftBoardUpdater.extractBoards("{classKey:\"templar\",boards:(()=>[])()}","templar")).isInstanceOf(Exception.class);
  assertThatThrownBy(()->ShadowcraftBoardUpdater.extractBoards("{classKey:\"templar\",boards:[],boards:[]}","templar")).isInstanceOf(Exception.class);
 }
 @Test void rejectsOversizedBodiesBeforeAccumulation(){
  var subscriber=new ShadowcraftBoardUpdater.LimitedBody();var subscription=mock(Flow.Subscription.class);subscriber.onSubscribe(subscription);
  subscriber.onNext(List.of(ByteBuffer.allocate(ShadowcraftBoardUpdater.LIMIT+1)));
  assertThat(subscriber.getBody().toCompletableFuture()).isCompletedExceptionally();verify(subscription).cancel();
 }
 @Test void removedNodesCannotReplaceTheWorkingCatalog()throws Exception{
  var service=new ShadowcraftService(new ObjectMapper(),mock(JdbcTemplate.class));var current=service.catalog("templar").path("catalog");
  var boards=current.path("boards").deepCopy();((com.fasterxml.jackson.databind.node.ArrayNode)boards.get(0).path("nodes")).remove(1);
  assertThatThrownBy(()->ShadowcraftBoardUpdater.assertCompatible(current,boards)).hasMessage("removed-node-needs-review");
 }
 @Test void realSourceFixturesStayCompatibleWhenProvided()throws Exception{
  var root=System.getProperty("boardFixtures");if(root==null)return;
  var service=new ShadowcraftService(new ObjectMapper(),mock(JdbcTemplate.class));
  for(var entry:ShadowcraftBoardUpdater.SOURCES.entrySet()){
   var boards=ShadowcraftBoardUpdater.extractBoards(Files.readString(Path.of(root,entry.getKey()+"-upstream.txt")),entry.getValue());
   assertThat(boards.size()).isEqualTo(6);var catalog=service.catalog(entry.getKey()).path("catalog");ShadowcraftBoardUpdater.assertCompatible(catalog,boards);
   var next=(com.fasterxml.jackson.databind.node.ObjectNode)catalog.deepCopy();next.set("boards",boards);service.update(entry.getKey(),next);
  }
 }

 @Test void livePublicSourceCanBeReadWithoutCredentials()throws Exception{
  if(!Boolean.getBoolean("liveBoardSource"))return;
  var client=java.net.http.HttpClient.newBuilder().connectTimeout(java.time.Duration.ofSeconds(5)).version(java.net.http.HttpClient.Version.HTTP_1_1).followRedirects(java.net.http.HttpClient.Redirect.NEVER).build();
  var request=java.net.http.HttpRequest.newBuilder(java.net.URI.create("https://aion2.gaming.tools/ko/builds/templar/pve")).timeout(java.time.Duration.ofSeconds(20)).header("User-Agent","ASBC-public-data-research/1.0").header("Accept","text/html").build();
  var pending=client.sendAsync(request,info->new ShadowcraftBoardUpdater.LimitedBody());
  java.net.http.HttpResponse<byte[]> response;try{response=pending.get(21,java.util.concurrent.TimeUnit.SECONDS);}finally{if(!pending.isDone())pending.cancel(true);}
  assertThat(response.statusCode()).isEqualTo(200);
  assertThat(ShadowcraftBoardUpdater.extractBoards(new String(response.body(),java.nio.charset.StandardCharsets.UTF_8),"templar").size()).isEqualTo(6);
 }
}
