package com.portfolio.blog.exception;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

/** Database errors answer with a generic 500; other runtime messages keep their existing behaviour. */
class GlobalExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void databaseErrorsDoNotExposeSql() {
        var response = handler.handleDataAccessException(new DataIntegrityViolationException(
                "PreparedStatementCallback; SQL [DELETE FROM shadowcraft_members WHERE id=?]; Referential integrity constraint violation: CONSTRAINT_B81"));
        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody().get("error")).doesNotContain("SQL", "shadowcraft", "CONSTRAINT");
    }

    @Test
    void otherRuntimeMessagesAreUnchanged() {
        assertThat(handler.handleRuntimeException(new RuntimeException("Invalid credentials")).getStatusCode().value()).isEqualTo(401);
        assertThat(handler.handleRuntimeException(new RuntimeException("Post not found")).getBody().get("error")).isEqualTo("Post not found");
    }
    @Test void unexpectedExceptionAndNullMessagesNeverLeakOrCrash(){
        for(String message:new String[]{null,"secret-sentinel; SQL query; java.lang.InternalError"}){
            var response=handler.handleRuntimeException(new IllegalStateException(message));
            assertThat(response.getStatusCode().value()).isEqualTo(500);assertThat(response.getBody().get("error")).doesNotContain("secret-sentinel","SQL","java.lang");
        }
    }
}
