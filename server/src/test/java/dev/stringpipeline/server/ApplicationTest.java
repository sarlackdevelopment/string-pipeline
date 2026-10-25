package dev.stringpipeline.server;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/// The whole application: it starts, documents its API, and answers what no controller handles with Problem Details.
@SpringBootTest
@AutoConfigureMockMvc
class ApplicationTest {

    private final MockMvcTester mvc;

    ApplicationTest(@Autowired MockMvcTester mvc) {
        this.mvc = mvc;
    }

    @Test
    @DisplayName("documents both endpoints in OpenAPI (D17)")
    void documentsBothEndpoints() {
        assertThat(mvc.get().uri("/v3/api-docs"))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.paths")
                .asMap()
                .containsOnlyKeys("/api/catalog", "/api/runs");
    }

    @Test
    @DisplayName("documents Accept-Language as the only parameter of both endpoints (D52)")
    void documentsTheLanguageHeader() {
        assertThat(mvc.get().uri("/v3/api-docs"))
                .bodyJson()
                .extractingPath("$.paths.*.*.parameters[*].name")
                .asArray()
                .containsExactly("Accept-Language", "Accept-Language");
    }

    @Test
    void servesSwaggerUi() {
        assertThat(mvc.get().uri("/swagger-ui/index.html")).hasStatusOk();
    }

    @Test
    @DisplayName("answers an unknown path with Problem Details (D41)")
    void answersAnUnknownPathWithProblemDetails() {
        assertThat(mvc.get().uri("/api/nothing-here"))
                .hasStatus(HttpStatus.NOT_FOUND)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
    }
}
