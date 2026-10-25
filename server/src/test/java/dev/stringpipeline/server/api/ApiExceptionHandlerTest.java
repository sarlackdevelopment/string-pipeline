package dev.stringpipeline.server.api;

import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.Messages;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.http.ProblemDetail;

class ApiExceptionHandlerTest {

    private final ApiExceptionHandler handler = new ApiExceptionHandler(serverTexts());

    // The server's texts, loaded as Spring Boot loads them with application.properties.
    private static ResourceBundleMessageSource serverTexts() {
        var texts = new ResourceBundleMessageSource();
        texts.setBasename("messages");
        texts.setDefaultEncoding("UTF-8");
        texts.setFallbackToSystemLocale(false);
        return texts;
    }

    @Test
    @DisplayName("answers an unexpected error with a generic 500 that shows no internals")
    void hidesInternalsOfAnUnexpectedError() {
        ProblemDetail problem =
                handler.unexpected(new IllegalStateException("the database password is hunter2"), Messages.ENGLISH);

        assertThat(problem.getStatus()).isEqualTo(500);
        assertThat(problem.getDetail()).isEqualTo("Something went wrong on the server.");
    }

    @Test
    @DisplayName("says so in the request's language (D52)")
    void saysSoInTheRequestsLanguage() {
        assertThat(handler.unexpected(new IllegalStateException(), Messages.RUSSIAN)
                        .getDetail())
                .isEqualTo("На сервере что-то пошло не так.");
    }
}
