package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.bool;
import static dev.stringpipeline.library.ArgumentValue.number;
import static dev.stringpipeline.library.ArgumentValue.text;
import static dev.stringpipeline.library.transformations.Runs.executed;
import static dev.stringpipeline.library.transformations.Runs.invalid;
import static dev.stringpipeline.library.transformations.Runs.notConfigured;
import static dev.stringpipeline.library.transformations.Runs.run;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RegexExtractTest {

    private final RegexExtract extract = new RegexExtract();

    @Test
    @DisplayName("outputs every match on its own line (D8)")
    void outputsEveryMatchOnItsOwnLine() {
        assertThat(run(extract, "a1b22c333", Map.of("pattern", text("\\d+")))).isEqualTo(executed("1\n22\n333"));
    }

    @Test
    void outputsOnlyTheFirstMatchWhenAsked() {
        assertThat(run(extract, "a1b22c333", Map.of("pattern", text("\\d+"), "matches", text("first"))))
                .isEqualTo(executed("1"));
    }

    @Test
    void outputsTheChosenGroup() {
        String pattern = "(\\w)=(\\d)";

        assertThat(run(extract, "x=1, y=2", Map.of("pattern", text(pattern), "group", number(1))))
                .isEqualTo(executed("x\ny"));
        assertThat(run(extract, "x=1, y=2", Map.of("pattern", text(pattern), "group", number(2))))
                .isEqualTo(executed("1\n2"));
    }

    @Test
    void outputsEmptyTextWhenNothingMatches() {
        assertThat(run(extract, "abc", Map.of("pattern", text("\\d+")))).isEqualTo(executed(""));
    }

    @Test
    void givesAnEmptyLineForAGroupThatDidNotTakePart() {
        assertThat(run(extract, "ab", Map.of("pattern", text("(a)|b"), "group", number(1))))
                .isEqualTo(executed("a\n"));
    }

    @Test
    @DisplayName("reports a syntax error with its position (D9)")
    void reportsASyntaxErrorWithItsPosition() {
        assertThat(run(extract, "abc", Map.of("pattern", text("(ab"))))
                .isEqualTo(invalid("pattern", "Unclosed group at character 4"));
    }

    @Test
    void explainsWhichGroupsExist() {
        assertThat(run(extract, "abc", Map.of("pattern", text("\\d+"), "group", number(1))))
                .isEqualTo(invalid("group", "The pattern has no groups, so use 0 for the whole match"));
        assertThat(run(extract, "abc", Map.of("pattern", text("(a)"), "group", number(2))))
                .isEqualTo(invalid("group", "The pattern has 1 group, so use 0 or 1"));
        assertThat(run(extract, "abc", Map.of("pattern", text("(a)(b)"), "group", number(3))))
                .isEqualTo(invalid("group", "The pattern has 2 groups, so use a number from 0 to 2"));
    }

    @Test
    void rejectsANegativeGroup() {
        assertThat(run(extract, "abc", Map.of("pattern", text("a"), "group", number(-1))))
                .isEqualTo(invalid("group", "Enter 0 or more"));
    }

    @Test
    void rejectsAnUnknownMatchesOption() {
        assertThat(run(extract, "abc", Map.of("pattern", text("a"), "matches", text("some"))))
                .isEqualTo(invalid("matches", "Choose one of the options"));
    }

    @Test
    void isNotConfiguredWithoutAPattern() {
        assertThat(run(extract, "abc", Map.of())).isEqualTo(notConfigured("pattern"));
    }

    @Test
    @DisplayName("ignores case for letters outside English too, such as Ä and ä")
    void ignoresCaseBeyondAscii() {
        assertThat(run(extract, "ÄPFEL und äpfel", Map.of("pattern", text("äpfel"), "ignoreCase", bool(true))))
                .isEqualTo(executed("ÄPFEL\näpfel"));
        assertThat(run(extract, "ÄPFEL und äpfel", Map.of("pattern", text("äpfel"))))
                .isEqualTo(executed("äpfel"));
    }

    @Test
    void matchesLineByLineInMultilineMode() {
        assertThat(run(extract, "a\nb", Map.of("pattern", text("^\\w$"), "multiline", bool(true))))
                .isEqualTo(executed("a\nb"));
        assertThat(run(extract, "a\nb", Map.of("pattern", text("^\\w$")))).isEqualTo(executed(""));
    }

    @Test
    void letsTheDotMatchLineBreaksInDotAllMode() {
        assertThat(run(extract, "a\nb", Map.of("pattern", text("a.b"), "dotAll", bool(true))))
                .isEqualTo(executed("a\nb"));
        assertThat(run(extract, "a\nb", Map.of("pattern", text("a.b")))).isEqualTo(executed(""));
    }
}
