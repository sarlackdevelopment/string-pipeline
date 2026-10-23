package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.bool;
import static dev.stringpipeline.library.ArgumentValue.number;
import static dev.stringpipeline.library.ArgumentValue.text;
import static dev.stringpipeline.library.transformations.Runs.executed;
import static dev.stringpipeline.library.transformations.Runs.failed;
import static dev.stringpipeline.library.transformations.Runs.invalid;
import static dev.stringpipeline.library.transformations.Runs.run;
import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.ArgumentValue;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Pipeline;
import dev.stringpipeline.library.PipelineResult;
import dev.stringpipeline.library.Step;
import dev.stringpipeline.library.StepResult.Executed;
import dev.stringpipeline.library.Transformation;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/// The traps listed in docs/decisions.md, one nested class each. The Turkish i arrives with the case transformation.
@DisplayName("Traps")
class TrapsTest {

    @Nested
    @DisplayName("Emoji and combined characters are never split (D7)")
    class EmojiAndCombinedCharacters {

        private final String text = Texts.THUMBS_UP + Texts.FLAG + Texts.E_COMBINING_ACUTE + "!";

        @Test
        void substringCountsWhatAPersonSees() {
            Substring substring = new Substring();

            assertThat(run(substring, text, Map.of("start", number(0), "end", number(1))))
                    .isEqualTo(executed(Texts.THUMBS_UP));
            assertThat(run(substring, text, Map.of("start", number(1), "end", number(2))))
                    .isEqualTo(executed(Texts.FLAG));
            assertThat(run(substring, text, Map.of("start", number(-2))))
                    .isEqualTo(executed(Texts.E_COMBINING_ACUTE + "!"));
        }
    }

    @Nested
    @DisplayName("Windows line endings")
    class WindowsLineEndings {

        @Test
        void multilineMatchingTreatsCrLfAsOneLineBreak() {
            assertThat(run(
                            new RegexExtract(),
                            "first\r\nsecond",
                            Map.of("pattern", text("^.+$"), "multiline", bool(true))))
                    .isEqualTo(executed("first\nsecond"));
        }
    }

    @Nested
    @DisplayName("Spaces in parameters are kept")
    class SpacesInParameters {

        @Test
        void appendKeepsALeadingSpace() {
            assertThat(run(new Append(), "Hello", Map.of("text", text(" World"))))
                    .isEqualTo(executed("Hello World"));
        }

        @Test
        void replaceFindsASpace() {
            assertThat(run(new Replace(), "a b c", Map.of("old", text(" "), "new", text("_"))))
                    .isEqualTo(executed("a_b_c"));
        }
    }

    @Nested
    @DisplayName("é written two ways (NFC and NFD) stays two different texts")
    class UnicodeNormalisation {

        @Test
        void replaceFindsOnlyTheSameForm() {
            Replace replace = new Replace();
            Map<String, ArgumentValue> composedToX = Map.of("old", text(Texts.E_ACUTE), "new", text("x"));

            assertThat(run(replace, "caf" + Texts.E_ACUTE, composedToX)).isEqualTo(executed("cafx"));
            assertThat(run(replace, "caf" + Texts.E_COMBINING_ACUTE, composedToX))
                    .isEqualTo(executed("caf" + Texts.E_COMBINING_ACUTE));
        }
    }

    @Nested
    @DisplayName("Empty input and an empty chain")
    class EmptyInput {

        @Test
        void everyTransformationHasAResultForEmptyInput() {
            assertThat(run(new Replace(), "", Map.of("old", text("a")))).isEqualTo(executed(""));
            assertThat(run(new Append(), "", Map.of("text", text("x")))).isEqualTo(executed("x"));
            assertThat(run(new Prepend(), "", Map.of("text", text("x")))).isEqualTo(executed("x"));
            assertThat(run(new Substring(), "", Map.of("start", number(1)))).isEqualTo(executed(""));
            assertThat(run(new RegexExtract(), "", Map.of("pattern", text("\\w+"))))
                    .isEqualTo(executed(""));
            assertThat(run(new RegexReplace(), "", Map.of("pattern", text("^"), "replacement", text("x"))))
                    .isEqualTo(executed("x"));
        }

        @Test
        void anEmptyChainReturnsTheInputUnchanged() {
            assertThat(new Pipeline(Limits.DEFAULT).run("text", List.of()).output())
                    .contains("text");
        }
    }

    @Nested
    @DisplayName("Catastrophic regex backtracking ends at the time limit (D21)")
    class CatastrophicBacktracking {

        // Java 25 answers the textbook cases such as (a+)+$ at once: its engine remembers failed positions in nested
        // loops. A counted repeat of a greedy wildcard still explodes: without a limit, this pattern runs for more
        // than 8 seconds on this text (probe on Java 25).
        private static final String SLOW_PATTERN = "(.*a){30}";

        private final Limits quick = Limits.DEFAULT.withRegexTimeout(Duration.ofMillis(100));
        private final String text = "a".repeat(29) + "b".repeat(100);

        @Test
        void extractFailsInsteadOfHanging() {
            long start = System.nanoTime();

            assertThat(run(new RegexExtract(), text, Map.of("pattern", text(SLOW_PATTERN)), quick))
                    .isEqualTo(failed(
                            "The pattern took longer than 100 milliseconds on this text. Try a simpler pattern."));
            assertThat(Duration.ofNanos(System.nanoTime() - start)).isLessThan(Duration.ofSeconds(2));
        }

        @Test
        void replaceFailsInsteadOfHanging() {
            assertThat(run(
                            new RegexReplace(),
                            text,
                            Map.of("pattern", text(SLOW_PATTERN), "replacement", text("x")),
                            quick))
                    .isEqualTo(failed(
                            "The pattern took longer than 100 milliseconds on this text. Try a simpler pattern."));
        }
    }

    @Nested
    @DisplayName("$ in a replacement")
    class DollarInReplacement {

        @Test
        void regexReplaceRejectsAMissingGroupForEveryText() {
            Map<String, ArgumentValue> arguments = Map.of("pattern", text("\\d+"), "replacement", text("$5 off"));
            String message = "The pattern has no group 5. Write \\$ for a dollar sign.";

            assertThat(run(new RegexReplace(), "Price: 5 EUR", arguments)).isEqualTo(invalid("replacement", message));
            assertThat(run(new RegexReplace(), "no digits", arguments)).isEqualTo(invalid("replacement", message));
        }

        @Test
        void literalReplaceKeepsTheDollarSign() {
            assertThat(run(new Replace(), "Price: 5", Map.of("old", text("5"), "new", text("$5 off"))))
                    .isEqualTo(executed("Price: $5 off"));
        }
    }

    @Nested
    @DisplayName("The same transformation twice in one chain")
    class SameTransformationTwice {

        @Test
        void eachStepUsesItsOwnValues() {
            Transformation replace = new Replace();

            PipelineResult result = new Pipeline(Limits.DEFAULT)
                    .run(
                            "ab",
                            List.of(
                                    new Step(replace, Map.of("old", text("a"), "new", text("b"))),
                                    new Step(replace, Map.of("old", text("b"), "new", text("c")))));

            assertThat(result.steps()).containsExactly(new Executed("bb"), new Executed("cc"));
            assertThat(result.output()).isEqualTo(Optional.of("cc"));
        }
    }
}
