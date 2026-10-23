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
import org.springframework.test.web.servlet.assertj.MockMvcTester;
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
