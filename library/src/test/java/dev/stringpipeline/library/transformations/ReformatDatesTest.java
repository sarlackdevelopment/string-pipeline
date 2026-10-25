package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.text;
import static dev.stringpipeline.library.Message.verbatim;
import static dev.stringpipeline.library.transformations.Runs.executed;
import static dev.stringpipeline.library.transformations.Runs.failed;
import static dev.stringpipeline.library.transformations.Runs.run;
import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.ArgumentValue;
import dev.stringpipeline.library.ParameterIssue;
import dev.stringpipeline.library.StepResult;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ReformatDatesTest {

    private final ReformatDates reformat = new ReformatDates();

    private StepResult reformat(String input, Map<String, ArgumentValue> patterns) {
        return run(reformat, input, patterns);
    }

    @Test
    @DisplayName("writes yyyy-MM-dd as dd.MM.yyyy by default, which strict Java alone would not read (D4)")
    void readsAndWritesWithTheDefaultPatterns() {
        assertThat(reformat("2026-10-25", Map.of())).isEqualTo(executed("25.10.2026"));
    }

    @Test
    void reformatsEachLineAndKeepsEmptyLines() {
        assertThat(reformat("2026-10-25\n\n2026-12-31\n", Map.of())).isEqualTo(executed("25.10.2026\n\n31.12.2026\n"));
    }

    @Test
    void readsMonthNamesInAnyCaseAndWritesThemInEnglish() {
        Map<String, ArgumentValue> names = Map.of("from", text("d MMM yyyy"), "to", text("d MMMM yyyy"));

        assertThat(reformat("25 OCT 2026\n1 jan 2027", names)).isEqualTo(executed("25 October 2026\n1 January 2027"));
    }

    @Test
    void readsDatesWithTimes() {
        Map<String, ArgumentValue> patterns = Map.of("from", text("yyyy-MM-dd HH:mm"), "to", text("HH:mm, d.M.yy"));

        assertThat(reformat("2026-10-25 09:30", patterns)).isEqualTo(executed("09:30, 25.10.26"));
    }

    @Test
    @DisplayName("rejects a day that does not exist instead of moving it")
    void rejectsADayThatDoesNotExist() {
        assertThat(reformat("2026-02-29", Map.of()))
                .isEqualTo(failed("Line 1 is not a date in the pattern yyyy-MM-dd: Invalid date 'February 29' as"
                        + " '2026' is not a leap year."));
    }

    @Test
    void namesTheLineThatIsNotADate() {
        assertThat(reformat("2026-10-25\n2026-13-01", Map.of()))
                .isEqualTo(failed("Line 2 is not a date in the pattern yyyy-MM-dd: Invalid value for MonthOfYear"
                        + " (valid values 1 - 12): 13."));
        assertThat(reformat("2026-10-25\n25.10.2026", Map.of()))
                .isEqualTo(failed(
                        "Line 2 is not a date in the pattern yyyy-MM-dd: it differs from the pattern at character"
                                + " 1."));
    }

    @Test
    void reportsBothPatternsWhenJavaCannotReadThem() {
        assertThat(reformat("2026-10-25", Map.of("from", text("yyyy-bb"), "to", text("dd.qqqqqq"))))
                .isEqualTo(new StepResult.InvalidParameters(List.of(
                        new ParameterIssue("from", verbatim("Unknown pattern letter: b")),
                        new ParameterIssue("to", verbatim("Too many pattern letters: q")))));
    }

    @Test
    void explainsAnOutputPatternThatNeedsMoreThanTheInputHas() {
        assertThat(reformat("2026-10-25", Map.of("to", text("HH:mm"))))
                .isEqualTo(failed("The output pattern needs more than the input pattern reads (Unsupported field:"
                        + " HourOfDay)."));
    }
}
