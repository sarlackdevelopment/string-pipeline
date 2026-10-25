package dev.stringpipeline.library;

import static dev.stringpipeline.library.ArgumentValue.text;
import static dev.stringpipeline.library.English.inEnglish;
import static dev.stringpipeline.library.Message.verbatim;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.stringpipeline.library.StepResult.Executed;
import dev.stringpipeline.library.StepResult.Failed;
import dev.stringpipeline.library.StepResult.InvalidParameters;
import dev.stringpipeline.library.StepResult.NotConfigured;
import dev.stringpipeline.library.StepResult.NotRun;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PipelineTest {

    private final Pipeline pipeline = new Pipeline(Limits.DEFAULT);

    private static Step step(Transformation transformation) {
        return new Step(transformation, Map.of());
    }

    @Test
    void anEmptyChainOutputsTheInputUnchanged() {
        assertThat(pipeline.run("text", List.of())).isEqualTo(new PipelineResult(List.of(), Optional.of("text")));
    }

    @Test
    @DisplayName("feeds the output of each step into the next (R1.2)")
    void feedsEachOutputIntoTheNextStep() {
        PipelineResult result = pipeline.run("a", List.of(step(Fakes.appending("b")), step(Fakes.appending("c"))));

        assertThat(result.steps()).containsExactly(new Executed("ab"), new Executed("abc"));
        assertThat(result.output()).contains("abc");
    }

    @Test
    @DisplayName("stops at a failed step and does not run the valid steps after it (D12)")
    void stopsAtAFailedStep() {
        PipelineResult result = pipeline.run(
                "a", List.of(step(Fakes.appending("b")), step(Fakes.failing("Broken")), step(Fakes.appending("c"))));

        assertThat(inEnglish(result.steps()))
                .containsExactly(new Executed("ab"), new Failed(verbatim("Broken")), new NotRun());
        assertThat(result.output()).isEmpty();
    }

    @Test
    @DisplayName("still checks the parameters of the steps after one that cannot run (D42)")
    void checksTheParametersOfLaterSteps() {
        PipelineResult result = pipeline.run(
                "a",
                List.of(
                        step(Fakes.failing("Broken")),
                        step(Fakes.rejecting("pattern", "Bad pattern")),
                        step(Fakes.requiringText("suffix")),
                        step(Fakes.appending("c"))));

        assertThat(inEnglish(result.steps()))
                .containsExactly(
                        new Failed(verbatim("Broken")),
                        new InvalidParameters(List.of(new ParameterIssue("pattern", verbatim("Bad pattern")))),
                        new NotConfigured(List.of(new ParameterIssue("suffix", verbatim("Enter a value")))),
                        new NotRun());
    }

    @Test
    @DisplayName("treats a step with only missing values as not configured (D42)")
    void missingValuesMakeAStepNotConfigured() {
        StepResult result = pipeline.run("a", List.of(step(Fakes.requiringText("suffix"))))
                .steps()
                .getFirst();

        assertThat(inEnglish(result))
                .isEqualTo(new NotConfigured(List.of(new ParameterIssue("suffix", verbatim("Enter a value")))));
    }

    @Test
    @DisplayName("reports every issue as invalid once one value is wrong (D42)")
    void aWrongValueOutweighsAMissingOne() {
        TextParameter first = TextParameter.required("first", verbatim("First"), verbatim("Some text."));
        IntegerParameter count = IntegerParameter.withDefault("count", verbatim("Count"), verbatim("A number."), 1);
        Transformation transformation = Fakes.transformation(
                "twoParameters", List.of(first, count), _ -> Configuration.ready((input, _) -> new Executed(input)));

        StepResult result = pipeline.run("x", List.of(new Step(transformation, Map.of("count", text("many")))))
                .steps()
                .getFirst();

        assertThat(inEnglish(result))
                .isEqualTo(new InvalidParameters(List.of(
                        new ParameterIssue("first", verbatim("Enter a value")),
                        new ParameterIssue("count", verbatim("Enter a whole number")))));
    }

    @Test
    @DisplayName("caps a step's output even when the transformation does not (D45)")
    void capsTheOutputOfAStep() {
        Pipeline small = new Pipeline(Limits.DEFAULT.withMaxOutputLength(3));

        assertThat(inEnglish(
                        small.run("", List.of(step(Fakes.producing("four")))).steps()))
                .containsExactly(new Failed(verbatim("The result would be longer than 3 characters.")));
    }

    @Test
    @DisplayName("caps the output of all steps together (D45)")
    void capsTheTotalOutputOfARun() {
        Pipeline small = new Pipeline(Limits.DEFAULT.withMaxTotalOutputLength(5));

        assertThat(inEnglish(small.run("", List.of(step(Fakes.producing("abc")), step(Fakes.producing("abc"))))
                        .steps()))
                .containsExactly(
                        new Executed("abc"),
                        new Failed(verbatim("The steps so far produced more than 5 characters in total.")));
    }

    @Test
    void rejectsAnInputOverTheLimitAsACallerError() {
        Pipeline small = new Pipeline(new Limits(3, 50, 10, 10, 10, Duration.ofSeconds(1)));

        assertThatThrownBy(() -> small.run("four", List.of())).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsTooManyStepsAsACallerError() {
        Pipeline small = new Pipeline(new Limits(10, 2, 10, 10, 10, Duration.ofSeconds(1)));
        List<Step> steps = Collections.nCopies(3, step(Fakes.appending("x")));

        assertThatThrownBy(() -> small.run("a", steps)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsAValueForAParameterTheTransformationDoesNotDeclare() {
        Transformation transformation = Fakes.appending("x");
        Map<String, ArgumentValue> arguments = Map.of("nope", text("y"));

        assertThatThrownBy(() -> new Step(transformation, arguments))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("nope");
    }
}
