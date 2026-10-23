package dev.stringpipeline.server.api;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import dev.stringpipeline.library.ParameterIssue;
import dev.stringpipeline.library.PipelineResult;
import dev.stringpipeline.library.StepResult;
import java.util.List;
import java.util.stream.IntStream;
import org.jspecify.annotations.Nullable;

/// The response of `POST /api/runs`: a result per step, matched to the request by step id, and the final output
/// (D40, D42).
///
/// @param output the last step's output when every step executed, the input for an empty chain, otherwise `null`
record RunResponse(List<StepResponse> steps, @Nullable String output) {

    /// The result of one step; `status` tells the five kinds apart, as in the library (D12, D42).
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "status")
    @JsonSubTypes({
        @JsonSubTypes.Type(value = Executed.class, name = "executed"),
        @JsonSubTypes.Type(value = NotConfigured.class, name = "notConfigured"),
        @JsonSubTypes.Type(value = InvalidParameters.class, name = "invalidParameters"),
        @JsonSubTypes.Type(value = Failed.class, name = "failed"),
        @JsonSubTypes.Type(value = NotRun.class, name = "notRun")
    })
    sealed interface StepResponse permits Executed, NotConfigured, InvalidParameters, Failed, NotRun {

        /// The step id from the request.
        String id();
    }

    record Executed(String id, String output) implements StepResponse {}

    record NotConfigured(String id, List<IssueResponse> issues) implements StepResponse {}

    record InvalidParameters(String id, List<IssueResponse> issues) implements StepResponse {}

    record Failed(String id, String message) implements StepResponse {}

    record NotRun(String id) implements StepResponse {}

    record IssueResponse(String parameter, String message) {}

    static RunResponse of(List<String> ids, PipelineResult result) {
        List<StepResponse> steps = IntStream.range(0, ids.size())
                .mapToObj(index -> step(ids.get(index), result.steps().get(index)))
                .toList();
        return new RunResponse(steps, result.output().orElse(null));
    }

    // Exhaustive over the library's results, so a new kind does not compile until the API can say it.
    private static StepResponse step(String id, StepResult result) {
        return switch (result) {
            case StepResult.Executed(String output) -> new Executed(id, output);
            case StepResult.Failed(String message) -> new Failed(id, message);
            case StepResult.NotConfigured(List<ParameterIssue> issues) -> new NotConfigured(id, issues(issues));
            case StepResult.InvalidParameters(List<ParameterIssue> issues) -> new InvalidParameters(id, issues(issues));
            case StepResult.NotRun() -> new NotRun(id);
        };
    }

    private static List<IssueResponse> issues(List<ParameterIssue> issues) {
        return issues.stream()
                .map(issue -> new IssueResponse(issue.parameter(), issue.message()))
                .toList();
    }
}
