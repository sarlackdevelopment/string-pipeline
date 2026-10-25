package dev.stringpipeline.server.api;

import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Messages;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/// `GET /api/catalog` (R2.1, D40, D50). The catalog never changes while the server runs, so the response is built once
/// for each language (D52).
@RestController
@RequestMapping("/api")
@Tag(name = "String Pipeline")
class CatalogController {

    private final Map<Locale, CatalogResponse> catalogs;

    CatalogController(Catalog catalog, Limits limits) {
        this.catalogs = Messages.LANGUAGES.stream()
                .collect(Collectors.toUnmodifiableMap(
                        Function.identity(), language -> CatalogResponse.of(catalog, limits, language)));
    }

    @GetMapping("/catalog")
    @Operation(
            summary = "Describe the transformations",
            description = "The limits, the categories, every transformation with its parameters as JSON Schema,"
                    + " and example chains to start from. The frontend builds its forms from this alone.")
    CatalogResponse catalog(Locale language) {
        // The locale resolver gives only the languages of Messages.LANGUAGES.
        return Objects.requireNonNull(catalogs.get(language));
    }
}
