package com.portfolio.blog.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Protect the Jackson 2 API/storage contract while the framework uses the Boot 4 platform. */
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
@Import(JsonPlatformCompatibilityTest.Fixture.class)
class JsonPlatformCompatibilityTest {
 @Autowired ObjectMapper mapper;
 @Autowired RequestMappingHandlerAdapter adapter;
 @Autowired MockMvc mvc;
 @Test void existingMapperIsTheOnlyJsonConverterFamily(){
  var converters=adapter.getMessageConverters().stream().map(x->x.getClass().getName()).filter(x->x.contains("Jackson")).toList();
  assertThat(converters).isNotEmpty().allMatch(x->x.contains("Jackson2"));
  assertThat(org.springframework.util.ClassUtils.isPresent("tools.jackson.databind.JsonNode",getClass().getClassLoader())).isFalse();
  assertThat(mapper.getClass().getName()).isEqualTo("com.fasterxml.jackson.databind.ObjectMapper");
 }
 @Test void persistedDatesNullsAndLongIdsKeepTheirWireFormat()throws Exception{
  var data=new LinkedHashMap<String,Object>();data.put("name","미쿠 · Ariel");data.put("empty",null);data.put("instant",Instant.parse("2026-10-31T10:00:00Z"));data.put("local",LocalDateTime.parse("2026-10-31T10:00:00"));data.put("ids",List.of(76561191234567890L));
  assertThat(mapper.writeValueAsString(data)).isEqualTo("{\"name\":\"미쿠 · Ariel\",\"empty\":null,\"instant\":\"2026-10-31T10:00:00Z\",\"local\":\"2026-10-31T10:00:00\",\"ids\":[76561191234567890]}");
 }
 @Test void jsonNodesRoundTripThroughTheActualMvcConverters()throws Exception{
  String input="{\"base\":{\"101\":10},\"nodes\":[\"n1\"],\"empty\":null,\"enabled\":false,\"large\":76561191234567890}";
  mvc.perform(post("/api/public/_compat/json").contentType("application/json").content(input)).andExpect(status().isOk()).andExpect(content().string(input));
  mvc.perform(post("/api/public/_compat/json").contentType("application/json").content("{bad")).andExpect(status().isBadRequest());
 }
 @TestConfiguration static class Fixture {@Bean Echo echo(){return new Echo();}}
 @RestController static class Echo {@PostMapping("/api/public/_compat/json") JsonNode echo(@RequestBody JsonNode value){return value;}}
}
