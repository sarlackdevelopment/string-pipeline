package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.number;
import static dev.stringpipeline.library.ArgumentValue.text;
import static dev.stringpipeline.library.transformations.Runs.executed;
import static dev.stringpipeline.library.transformations.Runs.invalid;
import static dev.stringpipeline.library.transformations.Runs.run;
import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.ArgumentValue;
import java.math.BigDecimal;
import java.util.Map;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class SubstringTest {

    private final Substring substring = new Substring();

    private static Map<String, ArgumentValue> slice(int start, @Nullable Integer end) {
        return end == null ? Map.of("start", number(start)) : Map.of("start", number(start), "end", number(end));
    }

    @ParameterizedTest(name = "\"abcdef\"[{0}:{1}] is \"{2}\"")
    @CsvSource(
            nullValues = "-",
            value = {
                "0, -, abcdef",
                "2, -, cdef",
                "2, 4, cd",
                "-2, -, ef",
                "2, -1, cde",
                "-1, -, f",
                "10, -, ''",
                "-100, 2, ab",
                "4, 2, ''",
                "0, 100, abcdef",
            })
    @DisplayName("slices like Python (D6)")
    void slicesLikePython(int start, @Nullable Integer end, String expected) {
        assertThat(run(substring, "abcdef", slice(start, end))).isEqualTo(executed(expected));
    }

    @Test
    void keepsTheWholeTextByDefault() {
        assertThat(run(substring, "abcdef", Map.of())).isEqualTo(executed("abcdef"));
    }

    @Test
    void rejectsAFraction() {
        assertThat(run(substring, "abc", Map.of("start", number(new BigDecimal("1.5")))))
                .isEqualTo(invalid("start", "Enter a whole number"));
    }

    @Test
    void rejectsText() {
        assertThat(run(substring, "abc", Map.of("end", text("two")))).isEqualTo(invalid("end", "Enter a whole number"));
    }
}
