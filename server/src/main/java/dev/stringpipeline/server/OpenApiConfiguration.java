package dev.stringpipeline.server;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.parameters.HeaderParameter;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;

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
                                + " step. Request errors are Problem Details (RFC 9457). Texts are in English, German"
                                + " or Russian, as Accept-Language asks."));
    }

    /// Every operation answers in the language of `Accept-Language` (D52).
    @Bean
    OperationCustomizer acceptLanguage() {
        return (operation, handlerMethod) -> operation.addParametersItem(new HeaderParameter()
                .name(HttpHeaders.ACCEPT_LANGUAGE)
                .description("The language of the texts in the response, as a browser sends it, such as"
                        + " de-DE,de;q=0.9. The server speaks en, de and ru; any other language, or none, gets"
                        + " English.")
                .schema(new StringSchema().example("de")));
    }
}
