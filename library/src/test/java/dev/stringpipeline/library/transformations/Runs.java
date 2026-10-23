package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.ArgumentValue;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.ParameterIssue;
import dev.stringpipeline.library.Pipeline;
import dev.stringpipeline.library.Step;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.Transformation;
import java.util.List;
import java.util.Map;

/// Runs one transformation through the real pipeline, so its tests also cover the parameter checks.
final class Runs {

    private Runs() {}

    static StepResult run(Transformation transformation, String input, Map<String, ArgumentValue> arguments) {
        return run(transformation, input, arguments, Limits.DEFAULT);
    }

    static StepResult run(
            Transformation transformation, String input, Map<String, ArgumentValue> arguments, Limits limits) {
        return new Pipeline(limits)
                .run(input, List.of(new Step(transformation, arguments)))
                .steps()
                .getFirst();
    }

    static StepResult executed(String output) {
        return new StepResult.Executed(output);
    }

    static StepResult failed(String message) {
        return new StepResult.Failed(message);
    }

    static StepResult invalid(String parameter, String message) {
        return new StepResult.InvalidParameters(List.of(new ParameterIssue(parameter, message)));
    }

    static StepResult notConfigured(String parameter) {
        return new StepResult.NotConfigured(List.of(new ParameterIssue(parameter, "Enter a value")));
    }
}
