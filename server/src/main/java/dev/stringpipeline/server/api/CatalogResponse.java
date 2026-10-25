package dev.stringpipeline.server.api;

import dev.stringpipeline.library.ArgumentValue;
import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Example;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Messages;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.Step;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/// The response of `GET /api/catalog`: everything the frontend needs to build the editor (R2.1, D40), with its texts
/// in one language (D52).
///
/// @param limits the request limits, so the UI can enforce them before it sends a run (D21)
/// @param categories the groups of the transformation picker, in display order
/// @param transformations the transformations in display order, each with its parameters as JSON Schema
/// @param examples ready-made chains to start from, in display order (D50)
record CatalogResponse(
        LimitsResponse limits,
        List<CategoryResponse> categories,
        List<TransformationResponse> transformations,
        List<ExampleResponse> examples) {

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

    @Schema(description = "A ready-made chain: its steps have the shape of a run request's, without ids")
    record ExampleResponse(String id, String name, String input, List<ExampleStepResponse> steps) {}

    record ExampleStepResponse(
            String transformation,

            @Schema(description = "The values the example sets, by parameter name; the others keep their defaults")
            Map<String, Object> parameters) {}

    static CatalogResponse of(Catalog catalog, Limits limits, Locale language) {
        return new CatalogResponse(
                new LimitsResponse(limits.maxInputLength(), limits.maxSteps()),
                catalog.categories().stream()
                        .map(category ->
                                new CategoryResponse(category.id(), Messages.render(category.displayName(), language)))
                        .toList(),
                catalog.transformations().stream()
                        .map(transformation -> transformation(transformation, limits, language))
                        .toList(),
                catalog.examples().stream()
                        .map(example -> example(example, language))
                        .toList());
    }

    private static TransformationResponse transformation(
            Transformation transformation, Limits limits, Locale language) {
        TransformationInfo info = transformation.info();
        return new TransformationResponse(
                info.id(),
                Messages.render(info.name(), language),
                info.category().id(),
                Messages.render(info.description(), language),
                ParameterSchemas.of(transformation.parameters(), limits, language));
    }

    private static ExampleResponse example(Example example, Locale language) {
        return new ExampleResponse(
                example.id(),
                Messages.render(example.name(), language),
                example.input(),
                example.steps().stream().map(CatalogResponse::exampleStep).toList());
    }

    // In the transformation's display order, as in its schema, so the JSON does not change from one start to the next.
    private static ExampleStepResponse exampleStep(Step step) {
        var parameters = new LinkedHashMap<String, Object>();
        for (Parameter parameter : step.transformation().parameters()) {
            ArgumentValue value = step.arguments().get(parameter.name());
            if (value != null) {
                parameters.put(parameter.name(), json(value));
            }
        }
        return new ExampleStepResponse(step.transformation().info().id(), parameters);
    }

    private static Object json(ArgumentValue value) {
        return switch (value) {
            case ArgumentValue.TextValue(String text) -> text;
            case ArgumentValue.NumberValue(var number) -> number;
            case ArgumentValue.BooleanValue(boolean bool) -> bool;
        };
    }
}
