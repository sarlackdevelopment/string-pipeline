package dev.stringpipeline.library;

import dev.stringpipeline.library.StepResult.Executed;
import dev.stringpipeline.library.StepResult.Failed;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/// Runs a chain: the output of each step is the input of the next (R1.2, D1).
///
/// Every step's values are checked first, so all configuration problems show at once. Then the steps run in order
/// until one does not execute; the valid steps after it are not run (D12, D42).
public final class Pipeline {

    private final Limits limits;

    public Pipeline(Limits limits) {
        this.limits = limits;
    }

    /// Runs `steps` on `input` and returns a result for every step.
    ///
    /// @throws IllegalArgumentException when the input or the number of steps is over the limits. The web layer
    ///     rejects such requests before they get here (D41).
    public PipelineResult run(String input, List<Step> steps) {
        if (input.length() > limits.maxInputLength()) {
            throw new IllegalArgumentException("The input is longer than " + limits.maxInputLength() + " characters");
        }
        if (steps.size() > limits.maxSteps()) {
            throw new IllegalArgumentException("The chain has more than " + limits.maxSteps() + " steps");
        }
        List<Plan> plans = steps.stream().map(this::plan).toList();
        var results = new ArrayList<StepResult>(plans.size());
        String text = input;
        long totalOutput = 0;
        boolean stopped = false;
        for (Plan plan : plans) {
            StepResult result = switch (plan) {
                case Stop(StepResult blocked) -> blocked;
                case Run(Operation operation) ->
                    stopped ? new StepResult.NotRun() : execute(operation, text, totalOutput);
            };
            if (result instanceof Executed(String output)) {
                text = output;
                totalOutput += output.length();
            } else {
                stopped = true;
            }
            results.add(result);
        }
        return new PipelineResult(results, stopped ? Optional.empty() : Optional.of(text));
    }

    // Stages 1 and 2: the generic checks, then the transformation's own (D44).
    private Plan plan(Step step) {
        Transformation transformation = step.transformation();
        return switch (ParameterChecks.check(transformation.parameters(), step.arguments(), limits)) {
            case ParameterChecks.Problems(var issues, var invalid) ->
                new Stop(invalid ? new StepResult.InvalidParameters(issues) : new StepResult.NotConfigured(issues));
            case ParameterChecks.Valid(var arguments) ->
                switch (transformation.configure(arguments)) {
                    case Configuration.Ready(var operation) -> new Run(operation);
                    case Configuration.Invalid(var issues) -> new Stop(new StepResult.InvalidParameters(issues));
                };
        };
    }

    // Stage 3. The caps hold even for a transformation that does not check them while building its output (D45).
    private StepResult execute(Operation operation, String input, long totalOutputSoFar) {
        StepResult.Outcome outcome = operation.apply(input, limits);
        if (outcome instanceof Executed(String output)) {
            if (output.length() > limits.maxOutputLength()) {
                return Failed.outputTooLong(limits.maxOutputLength());
            }
            if (totalOutputSoFar + output.length() > limits.maxTotalOutputLength()) {
                return Failed.totalOutputTooLong(limits.maxTotalOutputLength());
            }
        }
        return outcome;
    }

    // What the checks decided for a step: run its operation, or stop with a result.
    private sealed interface Plan permits Run, Stop {}

    private record Run(Operation operation) implements Plan {}

    private record Stop(StepResult result) implements Plan {}
}
