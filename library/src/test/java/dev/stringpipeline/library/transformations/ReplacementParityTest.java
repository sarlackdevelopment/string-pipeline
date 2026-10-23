package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.text;
import static dev.stringpipeline.library.transformations.Runs.executed;
import static dev.stringpipeline.library.transformations.Runs.run;
import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.StepResult;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/// Regex replace parses replacements itself (see [Replacement]). On a text where every pattern group can match, it
/// must accept exactly what Java accepts and produce exactly what Java produces.
class ReplacementParityTest {

    private static final String PATTERN = "(?<word>[a-z]+)(\\d)?";
    private static final String TEXT = "abc1 de";

    @ParameterizedTest(name = "replacement [{0}]")
    @ValueSource(
            strings = {
                "", "x", "$0", "$1", "$2", "$3", "$12", "$2$1", "<$1>", "${word}", "${nope}", "${1a}", "${}", "${word",
                "$", "$a", "$$", "\\", "\\$", "\\\\", "a\\b"
            })
    void acceptsAndProducesExactlyWhatJavaDoes(String replacement) {
        StepResult ours =
                run(new RegexReplace(), TEXT, Map.of("pattern", text(PATTERN), "replacement", text(replacement)));

        Optional<String> java = javaReplaceAll(replacement);
        if (java.isPresent()) {
            assertThat(ours).isEqualTo(executed(java.get()));
        } else {
            assertThat(ours).isInstanceOf(StepResult.InvalidParameters.class);
        }
    }

    private static Optional<String> javaReplaceAll(String replacement) {
        try {
            return Optional.of(Pattern.compile(PATTERN).matcher(TEXT).replaceAll(replacement));
        } catch (IllegalArgumentException | IndexOutOfBoundsException e) {
            return Optional.empty();
        }
    }
}
