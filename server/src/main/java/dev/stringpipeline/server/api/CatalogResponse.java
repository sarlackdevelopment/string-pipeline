package dev.stringpipeline.server.api;

import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.Map;

/// The response of `GET /api/catalog`: everything the frontend needs to build the editor (R2.1, D40).
///
/// @param limits the request limits, so the UI can enforce them before it sends a run (D21)
/// @param categories the groups of the transformation picker, in display order
/// @param transformations the transformations in display order, each with its parameters as JSON Schema
record CatalogResponse(
        LimitsResponse limits, List<CategoryResponse> categories, List<TransformationResponse> transformations) {

    record LimitsResponse(int maxInputLength, int maxSteps) {}

    record CategoryResponse(String id, String name) {}

    record TransformationResponse(
            String id,
            String name,
            String category,
            String description,

            @Schema(
                    description = "The parameters as a JSON Schema object: one property per parameter, in"
                            + " display order, with type, title, description, default and bounds")
            Map<String, Object> parameters) {}

    static CatalogResponse of(Catalog catalog, Limits limits) {
        return new CatalogResponse(
                new LimitsResponse(limits.maxInputLength(), limits.maxSteps()),
                catalog.categories().stream()
                        .map(category -> new CategoryResponse(category.id(), category.displayName()))
                        .toList(),
                catalog.transformations().stream()
                        .map(transformation -> transformation(transformation, limits))
                        .toList());
    }

    private static TransformationResponse transformation(Transformation transformation, Limits limits) {
        TransformationInfo info = transformation.info();
        return new TransformationResponse(
                info.id(),
                info.name(),
                info.category().id(),
                info.description(),
                ParameterSchemas.of(transformation.parameters(), limits));
    }
}
