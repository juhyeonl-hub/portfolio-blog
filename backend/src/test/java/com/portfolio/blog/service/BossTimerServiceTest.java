package com.portfolio.blog.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import static org.assertj.core.api.Assertions.*;
class BossTimerServiceTest {
 final ObjectMapper mapper = new ObjectMapper();
 final AtomicLong clock = new AtomicLong(1792206000000L);
 String sample = "{\"bosses\":{\"101021\":{\"state\":\"dead\",\"nextSpawn\":1792210000,\"reportedAt\":1792206000,\"confirmed\":true},\"111021\":{\"state\":\"up\",\"reportedAt\":1792206000,\"confirmed\":false}}}";
 @Test void cacheFailureBackoffAndFactionIsolation() throws Exception {
  var calls=new AtomicInteger();
  var service=new BossTimerService(mapper,id->{if(calls.incrementAndGet()>2)throw new Exception();return mapper.readTree(sample);},clock::get,true);
  assertThat(service.get("eu",1301).at("/bosses/gartua/id").asInt()).isEqualTo(101021);
  service.get("eu",1301);assertThat(calls.get()).isEqualTo(1);
  assertThat(service.get("eu",2301).at("/bosses/gartua/id").asInt()).isEqualTo(111021);
  clock.addAndGet(60001);
  var stale=service.get("eu",1301);
  assertThat(stale.path("refreshFailed").asBoolean()).isTrue();
  assertThat(stale.at("/bosses/gartua/state").asText()).isEqualTo("dead");
  service.get("eu",1301);assertThat(calls.get()).isEqualTo(3);
  assertThatThrownBy(()->service.get("as",1301)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
 }
 @Test void malformedAndFutureRecordsAreRejected() throws Exception {
  var service=new BossTimerService(mapper,id->null,clock::get,true);
  for(String raw:new String[]{"{}",sample.replace("1792206000","1992206000"),sample.replace("true","123"),sample.replace("1792210000","-5")})
   assertThatThrownBy(()->service.normalize(mapper.readTree(raw),1,clock.get())).isInstanceOf(IllegalArgumentException.class);
 }
 @Test void concurrentRequestsShareOneFetch() throws Exception {
  var calls=new AtomicInteger();
  var service=new BossTimerService(mapper,id->{calls.incrementAndGet();Thread.sleep(50);return mapper.readTree(sample);},clock::get,true);
  try(var pool=java.util.concurrent.Executors.newFixedThreadPool(8)) {
   var jobs=new java.util.ArrayList<java.util.concurrent.Future<?>>();
   for(int i=0;i<8;i++)jobs.add(pool.submit(()->service.get("eu",1301)));
   for(var job:jobs)job.get();
  }
  assertThat(calls.get()).isEqualTo(1);
 }
 @Test void disabledNeverFetchesAndMissingBossIsNotInvented() throws Exception {
  var calls=new AtomicInteger();
  var disabled=new BossTimerService(mapper,id->{calls.incrementAndGet();return null;},clock::get,false);
  assertThat(disabled.get("eu",1301).path("enabled").asBoolean()).isFalse();assertThat(calls.get()).isZero();
  var empty=new BossTimerService(mapper,id->mapper.readTree("{\"bosses\":{}}"),clock::get,true);
  assertThat(empty.get("eu",1301).path("bosses").isEmpty()).isTrue();
 }
 @Test void allBossesPreserveLegacyAndIncludeUnknownIds() throws Exception {
  var root=mapper.readTree(sample);
  var bosses=(com.fasterxml.jackson.databind.node.ObjectNode)root.path("bosses");
  for(String id:new String[]{"101001","111001","2001","99999"}) bosses.set(id,bosses.path("101021").deepCopy());
  var service=new BossTimerService(mapper,id->root,clock::get,true);
  var response=service.get("eu",1301);
  assertThat(response.path("allBosses").size()).isEqualTo(6);
  assertThat(response.at("/allBosses/2001/id").asInt()).isEqualTo(2001);
  assertThat(response.at("/allBosses/99999/id").asInt()).isEqualTo(99999);
  assertThat(response.path("bosses").size()).isEqualTo(1);
  assertThat(response.at("/bosses/gartua/id").asInt()).isEqualTo(101021);
  bosses.putObject("bad");
  assertThatThrownBy(()->service.normalize(root,1,clock.get())).isInstanceOf(IllegalArgumentException.class);
 }
}
