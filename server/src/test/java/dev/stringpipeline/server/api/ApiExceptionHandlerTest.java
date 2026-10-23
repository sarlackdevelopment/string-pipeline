package dev.stringpipeline.server.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;

class ApiExceptionHandlerTest {

    @Test
    @DisplayName("answers an unexpected error with a generic 500 that shows no internals")
    void hidesInternalsOfAnUnexpectedError() {
        ProblemDetail problem =
                new ApiExceptionHandler().unexpected(new IllegalStateException("the database password is hunter2"));

        assertThat(problem.getStatus()).isEqualTo(500);
        assertThat(problem.getDetail()).isEqualTo("Something went wrong on the server.");
    }
}
