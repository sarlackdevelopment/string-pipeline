package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.bool;
import static dev.stringpipeline.library.ArgumentValue.text;
import static dev.stringpipeline.library.transformations.Runs.executed;
import static dev.stringpipeline.library.transformations.Runs.failed;
import static dev.stringpipeline.library.transformations.Runs.invalid;
import static dev.stringpipeline.library.transformations.Runs.run;
import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.Limits;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RegexReplaceTest {

    private final RegexReplace replace = new RegexReplace();

    @Test
    void insertsNumberedGroups() {
        assertThat(run(
                        replace,
                        "2026-10-23",
                        Map.of("pattern", text("(\\d+)-(\\d+)-(\\d+)"), "replacement", text("$3.$2.$1"))))
                .isEqualTo(executed("23.10.2026"));
    }

    @Test
    void insertsNamedGroups() {
        assertThat(run(
                        replace,
                        "in 2026",
                        Map.of("pattern", text("(?<year>\\d{4})"), "replacement", text("<${year}>"))))
                .isEqualTo(executed("in <2026>"));
    }

    @Test
    void writesADollarSignAfterABackslash() {
        assertThat(run(replace, "5", Map.of("pattern", text("\\d"), "replacement", text("\\$$0"))))
                .isEqualTo(executed("$5"));
    }

    @Test
    void deletesMatchesWhenTheReplacementIsEmpty() {
        assertThat(run(replace, "a1b2", Map.of("pattern", text("\\d")))).isEqualTo(executed("ab"));
    }

    @Test
    void insertsNothingForAGroupThatDidNotTakePart() {
        assertThat(run(replace, "ab", Map.of("pattern", text("(a)|b"), "replacement", text("[$1]"))))
                .isEqualTo(executed("[a][]"));
    }

    @Test
    void ignoresCaseWhenAsked() {
        assertThat(run(
                        replace,
                        "Hello HELLO",
                        Map.of("pattern", text("hello"), "replacement", text("hi"), "ignoreCase", bool(true))))
                .isEqualTo(executed("hi hi"));
    }

    @Test
    @DisplayName("rejects a group the pattern does not have, even when nothing matches")
    void rejectsAMissingGroupEvenWithoutAMatch() {
        assertThat(run(replace, "abc", Map.of("pattern", text("\\d+"), "replacement", text("$5 off"))))
                .isEqualTo(invalid("replacement", "The pattern has no group 5. Write \\$ for a dollar sign."));
    }

    @Test
    void rejectsAMissingNamedGroup() {
        assertThat(run(replace, "abc", Map.of("pattern", text("(?<word>\\w+)"), "replacement", text("${nope}"))))
                .isEqualTo(invalid("replacement", "The pattern has no group named nope. Write \\$ for a dollar sign."));
    }

    @Test
    void explainsADollarSignWithoutAGroup() {
        assertThat(run(replace, "abc", Map.of("pattern", text("b"), "replacement", text("costs $"))))
                .isEqualTo(invalid("replacement", Replacement.DOLLAR_WITHOUT_GROUP));
        assertThat(run(replace, "abc", Map.of("pattern", text("b"), "replacement", text("$x"))))
                .isEqualTo(invalid("replacement", Replacement.DOLLAR_WITHOUT_GROUP));
        assertThat(run(replace, "abc", Map.of("pattern", text("b"), "replacement", text("${}"))))
                .isEqualTo(invalid("replacement", Replacement.GROUP_NAME_NEEDED));
    }

    @Test
    void explainsABackslashAtTheEnd() {
        assertThat(run(replace, "abc", Map.of("pattern", text("b"), "replacement", text("x\\"))))
                .isEqualTo(invalid("replacement", Replacement.TRAILING_BACKSLASH));
    }

    @Test
    void reportsAPatternErrorBeforeLookingAtTheReplacement() {
        assertThat(run(replace, "abc", Map.of("pattern", text("[a"), "replacement", text("$9"))))
                .isEqualTo(invalid("pattern", "Unclosed character class at character 2"));
    }

    @Test
    @DisplayName("stops at the output cap before copying a long group (D45)")
    void stopsAtTheOutputCap() {
        Limits small = Limits.DEFAULT.withMaxOutputLength(10);

        assertThat(run(replace, "aaaa", Map.of("pattern", text("a"), "replacement", text("xyz")), small))
                .isEqualTo(failed("The result would be longer than 10 characters."));
        assertThat(run(replace, "a".repeat(9), Map.of("pattern", text(".+"), "replacement", text("$0$0")), small))
                .isEqualTo(failed("The result would be longer than 10 characters."));
    }
}
