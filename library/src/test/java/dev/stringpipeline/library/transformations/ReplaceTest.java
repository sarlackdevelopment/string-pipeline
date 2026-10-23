package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.number;
import static dev.stringpipeline.library.ArgumentValue.text;
import static dev.stringpipeline.library.transformations.Runs.executed;
import static dev.stringpipeline.library.transformations.Runs.failed;
import static dev.stringpipeline.library.transformations.Runs.invalid;
import static dev.stringpipeline.library.transformations.Runs.notConfigured;
import static dev.stringpipeline.library.transformations.Runs.run;
import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.Limits;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ReplaceTest {

    private final Replace replace = new Replace();

    @Test
    @DisplayName("turns \"Fake Python\" into \"Real Python\", as in the brief")
    void replacesTheBriefsExample() {
        assertThat(run(replace, "Fake Python", Map.of("old", text("Fake"), "new", text("Real"))))
                .isEqualTo(executed("Real Python"));
    }

    @Test
    void replacesEveryOccurrence() {
        assertThat(run(replace, "a-a-a", Map.of("old", text("a"), "new", text("b"))))
                .isEqualTo(executed("b-b-b"));
    }

    @Test
    void matchesCaseSensitively() {
        assertThat(run(replace, "Fake fake", Map.of("old", text("Fake"), "new", text("Real"))))
                .isEqualTo(executed("Real fake"));
    }

    @Test
    void replacesFromLeftToRightWithoutOverlaps() {
        assertThat(run(replace, "aaa", Map.of("old", text("aa"), "new", text("b"))))
                .isEqualTo(executed("ba"));
    }

    @Test
    void treatsDollarAndBackslashAsPlainCharacters() {
        assertThat(run(replace, "price", Map.of("old", text("price"), "new", text("$5 \\1"))))
                .isEqualTo(executed("$5 \\1"));
    }

    @Test
    void deletesMatchesWhenTheReplacementIsEmptyOrMissing() {
        assertThat(run(replace, "a-b", Map.of("old", text("-"), "new", text(""))))
                .isEqualTo(executed("ab"));
        assertThat(run(replace, "a-b", Map.of("old", text("-")))).isEqualTo(executed("ab"));
    }

    @Test
    @DisplayName("is not configured until there is something to find (D5)")
    void needsSomethingToFind() {
        assertThat(run(replace, "abc", Map.of("old", text(""), "new", text("x"))))
                .isEqualTo(notConfigured("old"));
        assertThat(run(replace, "abc", Map.of())).isEqualTo(notConfigured("old"));
    }

    @Test
    void rejectsANumberAsTheTextToFind() {
        assertThat(run(replace, "abc", Map.of("old", number(1)))).isEqualTo(invalid("old", "Enter text"));
    }

    @Test
    @DisplayName("stops at the output cap instead of building a huge result (D45)")
    void stopsAtTheOutputCap() {
        Limits small = Limits.DEFAULT.withMaxOutputLength(10);

        assertThat(run(replace, "aaaa", Map.of("old", text("a"), "new", text("xyz")), small))
                .isEqualTo(failed("The result would be longer than 10 characters."));
        assertThat(run(replace, "aaa", Map.of("old", text("a"), "new", text("xyz")), small))
                .isEqualTo(executed("xyzxyzxyz"));
    }
}
