package dev.stringpipeline.library;

import java.util.List;

/// What happened to one step of a run: the five states of D12, named as in the API (D42).
public sealed interface StepResult {

    /// What running a configured step gives: its output, or why it failed on this particular text.
    sealed interface Outcome extends StepResult permits Executed, Failed {}

    /// The step ran.
    record Executed(String output) implements Outcome {}

    /// The step could not process this text, for example because a regex ran out of time.
    record Failed(String message) implements Outcome {

        /// The step's output would be longer than the cap (D45).
        public static Failed outputTooLong(int maxOutputLength) {
            return new Failed("The result would be longer than " + Formats.count(maxOutputLength) + " characters.");
        }

        /// The outputs of the run would together be longer than the cap (D45).
        public static Failed totalOutputTooLong(long maxTotalOutputLength) {
            return new Failed("The steps so far produced more than " + Formats.count(maxTotalOutputLength)
                    + " characters in total.");
        }
    }

    /// A required value is missing. The UI shows it as a neutral hint, not as an error (D42).
    record NotConfigured(List<ParameterIssue> issues) implements StepResult {

        public NotConfigured {
            issues = requireIssues(issues);
        }
    }

    /// A value is present but wrong (D42).
    record InvalidParameters(List<ParameterIssue> issues) implements StepResult {

        public InvalidParameters {
            issues = requireIssues(issues);
        }
    }

    /// An earlier step did not run, so this one did not either.
    record NotRun() implements StepResult {}

    private static List<ParameterIssue> requireIssues(List<ParameterIssue> issues) {
        if (issues.isEmpty()) {
            throw new IllegalArgumentException("A step with parameter problems needs at least one issue");
        }
        return List.copyOf(issues);
    }
}
