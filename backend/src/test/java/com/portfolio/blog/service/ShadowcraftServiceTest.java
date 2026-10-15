package com.portfolio.blog.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.assertj.core.api.Assertions.*;

class ShadowcraftServiceTest {
    @Test void changedCatalogRequiresReviewAndExistingReviewCannotBeCleared() throws Exception {
        var jdbc=mock(JdbcTemplate.class);
        var mapper=new ObjectMapper();
        var service=new ShadowcraftService(mapper,jdbc);
        ObjectNode snapshot=(ObjectNode)service.catalog("assassin");
        ObjectNode fresh=snapshot.path("catalog").deepCopy();
        fresh.put("version","test-next");
        var changed=service.update("assassin",fresh);
        assertThat(changed.path("catalog").path("reviewRequired").asBoolean()).isTrue();
        assertThat(changed.path("catalog").path("origin").asText()).isEqualTo("live");
        when(jdbc.query(contains("class_key = ?"),org.mockito.ArgumentMatchers.<RowMapper<String>>any(),eq("assassin"))).thenReturn(List.of(mapper.writeValueAsString(changed)));
        fresh.put("reviewRequired",false);
        assertThat(service.update("assassin",fresh).path("catalog").path("reviewRequired").asBoolean()).isTrue();
        verify(jdbc,times(2)).update(startsWith("INSERT INTO shadowcraft_catalogs"),eq("assassin"),anyString());
    }
    @Test void invalidSchemaDoesNotWriteAnything() throws Exception {
        var jdbc=mock(JdbcTemplate.class);
        var service=new ShadowcraftService(new ObjectMapper(),jdbc);
        var fresh=(ObjectNode)service.catalog("assassin").path("catalog");
        ((ObjectNode)fresh.path("boards").get(0).path("nodes").get(0)).put("pointCost",-1);
        assertThatThrownBy(()->service.update("assassin",fresh)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        verify(jdbc,never()).update(anyString(),any(),any());
    }
    @Test void allEightProvidedCatalogsSatisfyImportSchema() throws Exception {
        var jdbc=mock(JdbcTemplate.class);
        var service=new ShadowcraftService(new ObjectMapper(),jdbc);
        for(String key: new String[]{"assassin","gladiator","templar","ranger","elementalist","sorcerer","cleric","chanter"}) {
            var response=service.update(key,service.catalog(key).path("catalog"));
            assertThat(response.path("catalog").path("classKey").asText()).isEqualTo(key);
            assertThat(response.path("catalog").path("reviewRequired").asBoolean()).isFalse();
        }
    }
    @Test void incompleteLearningOrSlotsCannotReplaceCatalog() throws Exception {
        var jdbc=mock(JdbcTemplate.class);
        var service=new ShadowcraftService(new ObjectMapper(),jdbc);
        var fresh=(ObjectNode)service.catalog("assassin").path("catalog");
        ((ObjectNode)fresh.path("skills").get(0)).remove("specializationSlots");
        assertThatThrownBy(()->service.update("assassin",fresh)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        verify(jdbc,never()).update(anyString(),any(),any());
    }
    @Test void missingProfileSkillCannotBreakPublicPlanner() throws Exception {
        var jdbc=mock(JdbcTemplate.class);
        var service=new ShadowcraftService(new ObjectMapper(),jdbc);
        var fresh=(ObjectNode)service.catalog("assassin").path("catalog");
        ((ObjectNode)fresh.path("skills").get(0)).put("id","99999999");
        assertThatThrownBy(()->service.update("assassin",fresh)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        verify(jdbc,never()).update(anyString(),any(),any());
    }
}
