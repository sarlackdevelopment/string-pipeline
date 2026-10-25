package dev.stringpipeline.server.api;

import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Messages;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/// `GET /api/catalog` (R2.1, D40, D50). The catalog never changes while the server runs, so the response is built once.
@RestController
@RequestMapping("/api")
@Tag(name = "String Pipeline")
class CatalogController {

    private final CatalogResponse catalog;

    CatalogController(Catalog catalog, Limits limits) {
        this.catalog = CatalogResponse.of(catalog, limits, Messages.ENGLISH);
    }

    @GetMapping("/catalog")
    @Operation(
            summary = "Describe the transformations",
            description = "The limits, the categories, every transformation with its parameters as JSON Schema,"
                    + " and example chains to start from. The frontend builds its forms from this alone.")
    CatalogResponse catalog() {
        return catalog;
    }
}
