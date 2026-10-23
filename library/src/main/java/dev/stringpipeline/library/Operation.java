package dev.stringpipeline.library;

/// A configured step, ready to run on a text (D44).
@FunctionalInterface
public interface Operation {

    /// Runs on `input` and returns the output, or why this text could not be processed.
    StepResult.Outcome apply(String input, Limits limits);
}
