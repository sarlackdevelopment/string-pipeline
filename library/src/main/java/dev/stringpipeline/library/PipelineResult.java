package dev.stringpipeline.library;

import java.util.List;
import java.util.Optional;

/// The results of a run: one per step, in step order, and the final output (D40, D42).
///
/// @param output the last step's output, or the input for an empty chain; empty when a step did not execute
public record PipelineResult(List<StepResult> steps, Optional<String> output) {

    public PipelineResult {
        steps = List.copyOf(steps);
    }
}
