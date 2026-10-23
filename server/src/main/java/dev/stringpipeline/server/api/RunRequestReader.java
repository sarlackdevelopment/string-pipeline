package dev.stringpipeline.server.api;

import dev.stringpipeline.library.ArgumentValue;
import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.Step;
import dev.stringpipeline.library.Transformation;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;

/// Turns a run request into library steps, or rejects it with every request error and its JSON pointer (D41).
///
/// What a user types into a step is not a request error: missing or wrong values come back as step results (D42).
/// The reader rejects only what the UI never sends: a missing field, an unknown transformation or parameter, a value
/// that is not a scalar, a duplicate step id, and anything over the limits. These rules need the catalog or several
/// fields at once, so they are plain code rather than Bean Validation annotations.
final class RunRequestReader {

    static final int MAX_STEP_ID_LENGTH = 64;

    private final Catalog catalog;
    private final Limits limits;

    RunRequestReader(Catalog catalog, Limits limits) {
        this.catalog = catalog;
        this.limits = limits;
    }

    /// An accepted request: the input, the library steps, and the client's step ids in the same order.
    record Run(String input, List<Step> steps, List<String> ids) {}

    /// Reads the whole request before it answers, so the client learns every problem at once.
    ///
    /// @throws InvalidRequestException with every problem found
    Run read(RunRequest request) {
        var errors = new ArrayList<RequestError>();
        String input = request.input();
        if (input == null) {
            errors.add(new RequestError(RequestError.pointer("input"), "The input is required."));
        } else if (input.length() > limits.maxInputLength()) {
            errors.add(new RequestError(
                    RequestError.pointer("input"),
                    "The input is longer than " + count(limits.maxInputLength()) + " characters."));
        }
        var steps = new ArrayList<Step>();
        var ids = new ArrayList<String>();
        List<RunRequest.@Nullable StepRequest> requested = request.steps();
        if (requested == null) {
            errors.add(new RequestError(RequestError.pointer("steps"), "The steps are required."));
        } else if (requested.size() > limits.maxSteps()) {
            errors.add(new RequestError(
                    RequestError.pointer("steps"), "A chain can have at most " + limits.maxSteps() + " steps."));
        } else {
            var seenIds = new HashSet<String>();
            for (int index = 0; index < requested.size(); index++) {
                RunRequest.StepRequest step = requested.get(index);
                if (step == null) {
                    errors.add(new RequestError(RequestError.pointer("steps", index), "Each step must be an object."));
                    continue;
                }
                String id = readId(index, step.id(), seenIds, errors);
                Step libraryStep = readStep(index, step, errors);
                if (id != null && libraryStep != null) {
                    ids.add(id);
                    steps.add(libraryStep);
                }
            }
        }
        if (input == null || !errors.isEmpty()) {
            throw new InvalidRequestException(errors);
        }
        return new Run(input, steps, ids);
    }

    private static @Nullable String readId(
            int index, @Nullable String id, Set<String> seenIds, List<RequestError> errors) {
        String pointer = RequestError.pointer("steps", index, "id");
        if (id == null || id.isEmpty()) {
            errors.add(new RequestError(pointer, "Each step needs an id."));
            return null;
        }
        if (id.length() > MAX_STEP_ID_LENGTH) {
            errors.add(new RequestError(pointer, "A step id can have at most " + MAX_STEP_ID_LENGTH + " characters."));
            return null;
        }
        if (!seenIds.add(id)) {
            errors.add(new RequestError(pointer, "The step id " + id + " is used more than once."));
            return null;
        }
        return id;
    }

    private @Nullable Step readStep(int index, RunRequest.StepRequest step, List<RequestError> errors) {
        String transformationId = step.transformation();
        String pointer = RequestError.pointer("steps", index, "transformation");
        if (transformationId == null) {
            errors.add(new RequestError(pointer, "Each step needs a transformation."));
            return null;
        }
        Transformation transformation = catalog.find(transformationId).orElse(null);
        if (transformation == null) {
            errors.add(new RequestError(pointer, "Unknown transformation: " + transformationId));
            return null;
        }
        Map<String, @Nullable Object> parameters = step.parameters();
        int errorsBefore = errors.size();
        Map<String, ArgumentValue> arguments =
                parameters == null ? Map.of() : readArguments(index, transformation, parameters, errors);
        return errors.size() == errorsBefore ? new Step(transformation, arguments) : null;
    }

    private static Map<String, ArgumentValue> readArguments(
            int index,
            Transformation transformation,
            Map<String, @Nullable Object> parameters,
            List<RequestError> errors) {
        Set<String> known =
                transformation.parameters().stream().map(Parameter::name).collect(Collectors.toSet());
        var arguments = new HashMap<String, ArgumentValue>();
        for (Map.Entry<String, @Nullable Object> entry : parameters.entrySet()) {
            String name = entry.getKey();
            String pointer = RequestError.pointer("steps", index, "parameters", name);
            if (!known.contains(name)) {
                errors.add(new RequestError(pointer, transformation.info().name() + " has no parameter " + name + "."));
                continue;
            }
            // JSON null means "no value"; objects and arrays are never parameter values.
            switch (entry.getValue()) {
                case null -> {}
                case String text -> arguments.put(name, ArgumentValue.text(text));
                case Number number -> arguments.put(name, ArgumentValue.number(new BigDecimal(number.toString())));
                case Boolean flag -> arguments.put(name, ArgumentValue.bool(flag));
                default ->
                    errors.add(
                            new RequestError(pointer, "A parameter value must be text, a number, a boolean or null."));
            }
        }
        return arguments;
    }

    private static String count(int number) {
        return String.format(Locale.ROOT, "%,d", number);
    }
}
