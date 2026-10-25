package dev.stringpipeline.library;

import java.util.List;

/// Results read in English: every message rendered as a [Message.Verbatim], so that a test compares the texts people
/// read, not message keys, and fails when a key has no text.
public final class English {

    private English() {}

    public static StepResult inEnglish(StepResult result) {
        return switch (result) {
            case StepResult.Failed(Message message) -> new StepResult.Failed(inEnglish(message));
            case StepResult.NotConfigured(List<ParameterIssue> issues) ->
                new StepResult.NotConfigured(issuesInEnglish(issues));
            case StepResult.InvalidParameters(List<ParameterIssue> issues) ->
                new StepResult.InvalidParameters(issuesInEnglish(issues));
            case StepResult.Executed _, StepResult.NotRun _ -> result;
        };
    }

    public static List<StepResult> inEnglish(List<StepResult> results) {
        return results.stream().map(English::inEnglish).toList();
    }

    public static List<ParameterIssue> issuesInEnglish(List<ParameterIssue> issues) {
        return issues.stream()
                .map(issue -> new ParameterIssue(issue.parameter(), inEnglish(issue.message())))
                .toList();
    }

    public static Message inEnglish(Message message) {
        return Message.verbatim(Messages.render(message, Messages.ENGLISH));
    }
}
