package dev.stringpipeline.server.api;

import dev.stringpipeline.library.ArgumentValue;
import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Messages;
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
import org.springframework.context.MessageSource;
import org.springframework.context.support.MessageSourceAccessor;

/// Turns a run request into library steps, or rejects it with every request error and its JSON pointer (D41).
///
/// What a user types into a step is not a request error: missing or wrong values come back as step results (D42).
/// The reader rejects only what the UI never sends: a missing field, an unknown transformation or parameter, a value
/// that is not a scalar, a duplicate step id, and anything over the limits. These rules need the catalog or several
/// fields at once, so they are plain code rather than Bean Validation annotations. The errors are written in the
/// request's language (D52).
final class RunRequestReader {

    static final int MAX_STEP_ID_LENGTH = 64;

    private final Catalog catalog;
    private final Limits limits;
    private final MessageSourceAccessor texts;

    RunRequestReader(Catalog catalog, Limits limits, MessageSource messageSource) {
        this.catalog = catalog;
        this.limits = limits;
        this.texts = new MessageSourceAccessor(messageSource);
    }

    /// An accepted request: the input, the library steps, and the client's step ids in the same order.
    record Run(String input, List<Step> steps, List<String> ids) {}

    /// Reads the whole request before it answers, so the client learns every problem at once.
    ///
    /// @throws InvalidRequestException with every problem found, written in `language`
    Run read(RunRequest request, Locale language) {
        var errors = new Errors(language);
        String input = request.input();
        if (input == null) {
            errors.add(RequestError.pointer("input"), "request.inputRequired");
        } else if (input.length() > limits.maxInputLength()) {
            errors.add(RequestError.pointer("input"), "request.inputTooLong", limits.maxInputLength());
        }
        var steps = new ArrayList<Step>();
        var ids = new ArrayList<String>();
        List<RunRequest.@Nullable StepRequest> requested = request.steps();
        if (requested == null) {
            errors.add(RequestError.pointer("steps"), "request.stepsRequired");
        } else if (requested.size() > limits.maxSteps()) {
            errors.add(RequestError.pointer("steps"), "request.tooManySteps", limits.maxSteps());
        } else {
            var seenIds = new HashSet<String>();
            for (int index = 0; index < requested.size(); index++) {
                RunRequest.StepRequest step = requested.get(index);
                if (step == null) {
                    errors.add(RequestError.pointer("steps", index), "request.stepNotAnObject");
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
        if (input == null || !errors.found.isEmpty()) {
            throw new InvalidRequestException(errors.found);
        }
        return new Run(input, steps, ids);
    }

    private static @Nullable String readId(int index, @Nullable String id, Set<String> seenIds, Errors errors) {
        String pointer = RequestError.pointer("steps", index, "id");
        if (id == null || id.isEmpty()) {
            errors.add(pointer, "request.idRequired");
            return null;
        }
        if (id.length() > MAX_STEP_ID_LENGTH) {
            errors.add(pointer, "request.idTooLong", MAX_STEP_ID_LENGTH);
            return null;
        }
        if (!seenIds.add(id)) {
            errors.add(pointer, "request.idRepeated", id);
            return null;
        }
        return id;
    }

    private @Nullable Step readStep(int index, RunRequest.StepRequest step, Errors errors) {
        String transformationId = step.transformation();
        String pointer = RequestError.pointer("steps", index, "transformation");
        if (transformationId == null) {
            errors.add(pointer, "request.transformationRequired");
            return null;
        }
        Transformation transformation = catalog.find(transformationId).orElse(null);
        if (transformation == null) {
            errors.add(pointer, "request.unknownTransformation", transformationId);
            return null;
        }
        Map<String, @Nullable Object> parameters = step.parameters();
        int errorsBefore = errors.found.size();
        Map<String, ArgumentValue> arguments =
                parameters == null ? Map.of() : readArguments(index, transformation, parameters, errors);
        return errors.found.size() == errorsBefore ? new Step(transformation, arguments) : null;
    }

    private static Map<String, ArgumentValue> readArguments(
            int index, Transformation transformation, Map<String, @Nullable Object> parameters, Errors errors) {
        Set<String> known =
                transformation.parameters().stream().map(Parameter::name).collect(Collectors.toSet());
        var arguments = new HashMap<String, ArgumentValue>();
        for (Map.Entry<String, @Nullable Object> entry : parameters.entrySet()) {
            String name = entry.getKey();
            String pointer = RequestError.pointer("steps", index, "parameters", name);
            if (!known.contains(name)) {
                String transformationName =
                        Messages.render(transformation.info().name(), errors.language);
                errors.add(pointer, "request.unknownParameter", transformationName, name);
                continue;
            }
            // JSON null means "no value"; objects and arrays are never parameter values.
            switch (entry.getValue()) {
                case null -> {}
                case String text -> arguments.put(name, ArgumentValue.text(text));
                case Number number -> arguments.put(name, ArgumentValue.number(new BigDecimal(number.toString())));
                case Boolean flag -> arguments.put(name, ArgumentValue.bool(flag));
                default -> errors.add(pointer, "request.valueNotAScalar");
            }
        }
        return arguments;
    }

    // The problems of one request, written in its language.
    private final class Errors {

        private final Locale language;
        private final List<RequestError> found = new ArrayList<>();

        Errors(Locale language) {
            this.language = language;
        }

        void add(String pointer, String code, Object... arguments) {
            found.add(new RequestError(pointer, texts.getMessage(code, arguments, language)));
        }
    }
}
