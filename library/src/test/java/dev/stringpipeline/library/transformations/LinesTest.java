package dev.stringpipeline.library.transformations;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("Lines (D3)")
class LinesTest {

    @Test
    void splitsAtEveryKindOfLineBreak() {
        assertThat(Lines.of("a\r\nb\rc\nd").lines()).containsExactly("a", "b", "c", "d");
    }

    @Test
    void treatsALineBreakAtTheEndAsTheEndOfTheLastLine() {
        assertThat(Lines.of("a\nb\n")).isEqualTo(new Lines(List.of("a", "b"), true));
        assertThat(Lines.of("\n")).isEqualTo(new Lines(List.of(""), true));
    }

    @Test
    void hasNoLinesInAnEmptyText() {
        assertThat(Lines.of("")).isEqualTo(new Lines(List.of(), false));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "a", "a\n", "a\n\nb", "\n", "\n\n"})
    void joinsBackToTheSameTextWithNewlineBreaks(String text) {
        assertThat(Lines.of(text).text()).isEqualTo(text);
    }

    @Test
    void writesNewlineForEveryLineBreak() {
        assertThat(Lines.of("a\r\nb\r\n").text()).isEqualTo("a\nb\n");
    }

    @Test
    void writesNothingWhenNoLinesAreLeft() {
        assertThat(Lines.of("a\n").with(List.of()).text()).isEmpty();
    }
}
