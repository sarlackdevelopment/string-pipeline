package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.English.inEnglish;
import static dev.stringpipeline.library.Message.verbatim;

import dev.stringpipeline.library.ArgumentValue;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.ParameterIssue;
import dev.stringpipeline.library.Pipeline;
import dev.stringpipeline.library.Step;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.Transformation;
import java.util.List;
import java.util.Map;

/// Runs one transformation through the real pipeline, so its tests also cover the parameter checks, and reads the
/// result in English.
final class Runs {

    private Runs() {}

    static StepResult run(Transformation transformation, String input, Map<String, ArgumentValue> arguments) {
        return run(transformation, input, arguments, Limits.DEFAULT);
    }

    static StepResult run(
            Transformation transformation, String input, Map<String, ArgumentValue> arguments, Limits limits) {
        return inEnglish(new Pipeline(limits)
                .run(input, List.of(new Step(transformation, arguments)))
                .steps()
                .getFirst());
    }

    static StepResult executed(String output) {
        return new StepResult.Executed(output);
    }

    static StepResult failed(String message) {
        return new StepResult.Failed(verbatim(message));
    }

    static StepResult invalid(String parameter, String message) {
        return new StepResult.InvalidParameters(List.of(new ParameterIssue(parameter, verbatim(message))));
    }

    static StepResult notConfigured(String parameter) {
        return new StepResult.NotConfigured(List.of(new ParameterIssue(parameter, verbatim("Enter a value"))));
    }
}
