package com.portfolio.blog.service;

import io.jsonwebtoken.io.AbstractDeserializer;
import io.jsonwebtoken.io.AbstractSerializer;
import io.jsonwebtoken.io.Deserializer;
import io.jsonwebtoken.io.Serializer;
import java.io.OutputStream;
import java.io.Reader;
import java.util.Map;
import tools.jackson.core.StreamReadConstraints;
import tools.jackson.core.StreamReadFeature;
import tools.jackson.core.StreamWriteFeature;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/** JJWT's public JSON extension point; signatures and registered-claim handling remain with JJWT. */
final class JwtJson {
    private static final JsonMapper MAPPER = JsonMapper.builder(tools.jackson.core.json.JsonFactory.builder()
        .streamReadConstraints(StreamReadConstraints.builder().maxNestingDepth(32).maxStringLength(65_536).maxDocumentLength(131_072).build()).build())
        .enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION)
        .disable(StreamReadFeature.AUTO_CLOSE_SOURCE)
        .disable(StreamWriteFeature.AUTO_CLOSE_TARGET)
        .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
        .build();
    static final Serializer<Map<String, ?>> SERIALIZER = new AbstractSerializer<>() {
        @Override protected void doSerialize(Map<String, ?> value, OutputStream output) { MAPPER.writeValue(output, value); }
    };
    static final Deserializer<Map<String, ?>> DESERIALIZER = new AbstractDeserializer<>() {
        @Override protected Map<String, ?> doDeserialize(Reader input) { var result = MAPPER.readValue(input, new TypeReference<Map<String, ?>>() {}); if (result == null) throw new IllegalArgumentException("JWT JSON object required"); return result; }
    };
    private JwtJson() {}
}
