package dev.stringpipeline.library;

import java.util.List;

/// What [Transformation#configure(Arguments)] returns: ready to run, or a problem only this transformation can see,
/// such as a regex that does not compile (D44).
public sealed interface Configuration {

    /// The step can run.
    record Ready(Operation operation) implements Configuration {}

    /// The step cannot run with these values.
    record Invalid(List<ParameterIssue> issues) implements Configuration {

        public Invalid {
            issues = List.copyOf(issues);
            if (issues.isEmpty()) {
                throw new IllegalArgumentException("An invalid configuration needs at least one issue");
            }
        }
    }

    static Configuration ready(Operation operation) {
        return new Ready(operation);
    }

    static Configuration invalid(ParameterIssue issue) {
        return new Invalid(List.of(issue));
    }
}
