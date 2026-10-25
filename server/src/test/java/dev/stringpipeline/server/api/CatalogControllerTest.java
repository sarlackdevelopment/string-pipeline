package dev.stringpipeline.server.api;

import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.transformations.BuiltIns;
import dev.stringpipeline.server.LibraryConfiguration;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@WebMvcTest(CatalogController.class)
@Import(LibraryConfiguration.class)
class CatalogControllerTest {

    private final MockMvcTester mvc;

    CatalogControllerTest(@Autowired MockMvcTester mvc) {
        this.mvc = mvc;
    }

    @Test
    @DisplayName("serves exactly contract/catalog.json (D46)")
    void servesTheContractCatalog() {
        assertThat(mvc.get().uri("/api/catalog"))
                .hasStatusOk()
                .bodyJson()
                .isStrictlyEqualTo(new ClassPathResource("catalog.json"));
    }

    @Test
    @DisplayName("speaks the first language of Accept-Language that it knows (D52)")
    void speaksTheFirstLanguageItKnows() {
        MvcTestResult result = mvc.get()
                .uri("/api/catalog")
                .header(HttpHeaders.ACCEPT_LANGUAGE, "fr, de-AT;q=0.8, en;q=0.5")
                .exchange();

        assertThat(result)
                .hasStatusOk()
                .hasHeader(HttpHeaders.CONTENT_LANGUAGE, "de")
                .hasHeader(HttpHeaders.VARY, HttpHeaders.ACCEPT_LANGUAGE);
        assertThat(result).bodyJson().extractingPath("$.categories[1].name").isEqualTo("Zeilen");
        assertThat(result)
                .bodyJson()
                .extractingPath("$.transformations[0].parameters.properties.old.title")
                .isEqualTo("Suchen nach");
        assertThat(result).bodyJson().extractingPath("$.examples[0].name").isEqualTo("Die Kette aus der Aufgabe");
    }

    @Test
    void speaksEnglishToAnyOtherLanguage() {
        assertThat(mvc.get().uri("/api/catalog").header(HttpHeaders.ACCEPT_LANGUAGE, "fr"))
                .hasStatusOk()
                .hasHeader(HttpHeaders.CONTENT_LANGUAGE, "en")
                .bodyJson()
                .isStrictlyEqualTo(new ClassPathResource("catalog.json"));
    }

    @Test
    @DisplayName("lists every transformation's parameters in display order (D43)")
    void keepsTheDisplayOrderOfParameters() throws Exception {
        String body = mvc.get().uri("/api/catalog").exchange().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode transformations = JsonMapper.shared().readTree(body).get("transformations");

        int index = 0;
        for (Transformation transformation : BuiltIns.catalog().transformations()) {
            JsonNode properties = transformations.get(index++).get("parameters").get("properties");
            assertThat(properties.propertyNames())
                    .as(transformation.info().id())
                    .containsExactlyElementsOf(transformation.parameters().stream()
                            .map(Parameter::name)
                            .toList());
        }
    }
}
