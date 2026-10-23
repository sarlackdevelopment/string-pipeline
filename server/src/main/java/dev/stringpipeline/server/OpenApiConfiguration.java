package dev.stringpipeline.server;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/// The title and description of the OpenAPI document that springdoc serves next to Swagger UI (D17).
@Configuration(proxyBeanMethods = false)
class OpenApiConfiguration {

    @Bean
    OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("String Pipeline API")
                        .version("1")
                        .description("Runs chains of string transformations. The catalog describes every"
                                + " transformation and its parameters as JSON Schema; a run returns a result for every"
                                + " step. Request errors are Problem Details (RFC 9457)."));
    }
}
