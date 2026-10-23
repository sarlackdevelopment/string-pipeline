package dev.stringpipeline.library;

import java.util.List;
import java.util.function.Function;

/// Transformations with fixed behaviour, so the pipeline tests do not depend on the built-in ones.
final class Fakes {

    private Fakes() {}

    static Transformation transformation(
            String id, List<Parameter> parameters, Function<Arguments, Configuration> behaviour) {
        return new Transformation() {
            @Override
            public TransformationInfo info() {
                return new TransformationInfo(id, id, "A test transformation.", Category.TEXT);
            }

            @Override
            public List<Parameter> parameters() {
                return parameters;
            }

            @Override
            public Configuration configure(Arguments arguments) {
                return behaviour.apply(arguments);
            }
        };
    }

    /// Appends `suffix` to its input.
    static Transformation appending(String suffix) {
        return transformation(
                "appending",
                List.of(),
                _ -> Configuration.ready((input, _) -> new StepResult.Executed(input + suffix)));
    }

    /// Outputs exactly `output`, ignoring its input and every cap.
    static Transformation producing(String output) {
        return transformation(
                "producing", List.of(), _ -> Configuration.ready((_, _) -> new StepResult.Executed(output)));
    }

    /// Fails on every text.
    static Transformation failing(String message) {
        return transformation("failing", List.of(), _ -> Configuration.ready((_, _) -> new StepResult.Failed(message)));
    }

    /// Rejects every configuration, as a transformation does when its regex does not compile.
    static Transformation rejecting(String parameter, String message) {
        TextParameter text = TextParameter.withDefault(parameter, "Text", "Some text.", "");
        return transformation(
                "rejecting", List.of(text), _ -> Configuration.invalid(new ParameterIssue(parameter, message)));
    }

    /// Needs a non-empty text and appends it.
    static Transformation requiringText(String name) {
        TextParameter text = TextParameter.required(name, "Text", "Some text.");
        return transformation("requiringText", List.of(text), arguments -> {
            String suffix = arguments.text(text);
            return Configuration.ready((input, _) -> new StepResult.Executed(input + suffix));
        });
    }
}
