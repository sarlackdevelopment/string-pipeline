package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.number;
import static dev.stringpipeline.library.ArgumentValue.text;
import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.ArgumentValue;
import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.ParameterIssue;
import dev.stringpipeline.library.Pipeline;
import dev.stringpipeline.library.PipelineResult;
import dev.stringpipeline.library.Step;
import dev.stringpipeline.library.StepResult.Executed;
import dev.stringpipeline.library.StepResult.InvalidParameters;
import dev.stringpipeline.library.StepResult.NotConfigured;
import dev.stringpipeline.library.StepResult.NotRun;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;

/// The run examples of `contract/examples`, through the Java API. The library and the contract agree before the web
/// layer exists; the server tests later compare the same examples as JSON (D46).
class ContractExamplesTest {

    private final Catalog catalog = BuiltIns.catalog();
    private final Pipeline pipeline = new Pipeline(Limits.DEFAULT);

    private Step step(String transformation, Map<String, ArgumentValue> arguments) {
        return new Step(catalog.find(transformation).orElseThrow(), arguments);
    }

    @Test
    void briefChain() {
        PipelineResult result = pipeline.run(
                "Fake Python",
                List.of(
                        step("replace", Map.of("old", text("Fake"), "new", text("Real"))),
                        step("append", Map.of("text", text(" rocks!"))),
                        step("substring", Map.of("start", number(5)))));

        assertThat(result)
                .isEqualTo(new PipelineResult(
                        List.of(
                                new Executed("Real Python"),
                                new Executed("Real Python rocks!"),
                                new Executed("Python rocks!")),
                        Optional.of("Python rocks!")));
    }

    @Test
    void stepStatuses() {
        PipelineResult result = pipeline.run(
                "Price: 5 EUR",
                List.of(
                        step("regexReplace", Map.of("pattern", text("(\\d+) EUR"), "replacement", text("€$1"))),
                        step("replace", Map.of("old", text(""), "new", text("x"))),
                        step("regexReplace", Map.of("pattern", text("\\d+"), "replacement", text("$5 off"))),
                        step("append", Map.of("text", text("!")))));

        assertThat(result.steps())
                .containsExactly(
                        new Executed("Price: €5"),
                        new NotConfigured(List.of(new ParameterIssue("old", "Enter a value"))),
                        new InvalidParameters(List.of(new ParameterIssue(
                                "replacement", "The pattern has no group 5. Write \\$ for a dollar sign."))),
                        new NotRun());
        assertThat(result.output()).isEmpty();
    }
}
