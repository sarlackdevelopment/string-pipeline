package dev.stringpipeline.server.api;

import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Limits;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/// `GET /api/catalog` (R2.1, D40). The catalog never changes while the server runs, so the response is built once.
@RestController
@RequestMapping("/api")
@Tag(name = "String Pipeline")
class CatalogController {

    private final CatalogResponse catalog;

    CatalogController(Catalog catalog, Limits limits) {
        this.catalog = CatalogResponse.of(catalog, limits);
    }

    @GetMapping("/catalog")
    @Operation(
            summary = "Describe the transformations",
            description = "The limits, the categories and every transformation with its parameters as JSON Schema."
                    + " The frontend builds its forms from this alone.")
    CatalogResponse catalog() {
        return catalog;
    }
}
