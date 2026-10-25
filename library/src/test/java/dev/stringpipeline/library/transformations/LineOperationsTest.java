package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.bool;
import static dev.stringpipeline.library.ArgumentValue.text;
import static dev.stringpipeline.library.transformations.Runs.executed;
import static dev.stringpipeline.library.transformations.Runs.run;
import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.StepResult;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LineOperationsTest {

    private final LineOperations lines = new LineOperations();

    private StepResult apply(String input, String operation) {
        return run(lines, input, Map.of("operation", text(operation)));
    }

    private StepResult applyIgnoringCase(String input, String operation) {
        return run(lines, input, Map.of("operation", text(operation), "ignoreCase", bool(true)));
    }

    @Test
    @DisplayName("sorts small letters next to capitals and accents next to their letter")
    void sortsLikeADictionary() {
        assertThat(apply("banana\nApple\nzebra\néclair\napple\neclair", "sort"))
                .isEqualTo(executed("apple\nApple\nbanana\neclair\néclair\nzebra"));
    }

    @Test
    void sortsNumbersByTheirValue() {
        assertThat(apply("file10\nfile2\nfile1\nfile02", "sort")).isEqualTo(executed("file1\nfile2\nfile02\nfile10"));
    }

    @Test
    void sortsBackwards() {
        assertThat(apply("file10\nfile2\nfile1", "sortDescending")).isEqualTo(executed("file10\nfile2\nfile1"));
    }

    @Test
    void keepsTheOrderOfLinesThatCountAsEqual() {
        assertThat(applyIgnoringCase("b\nB\na\nA", "sort")).isEqualTo(executed("a\nA\nb\nB"));
    }

    @Test
    void removesExactCopiesAndKeepsTheFirst() {
        assertThat(apply("b\na\nb\nB\nfile02\nfile2", "unique")).isEqualTo(executed("b\na\nB\nfile02\nfile2"));
    }

    @Test
    void removesCopiesThatDifferOnlyInCaseWhenAsked() {
        assertThat(applyIgnoringCase("Straße\nb\nSTRASSE\nB", "unique")).isEqualTo(executed("Straße\nb"));
    }

    @Test
    void removesEmptyLinesAndLinesOfSpaces() {
        assertThat(apply("a\n\n  \t\nb\n", "removeBlank")).isEqualTo(executed("a\nb\n"));
    }

    @Test
    void reversesTheOrderAndKeepsTheLastLineBreak() {
        assertThat(apply("1\n2\n3\n", "reverse")).isEqualTo(executed("3\n2\n1\n"));
    }

    @Test
    void readsOldMacLineEndings() {
        assertThat(apply("b\ra", "sort")).isEqualTo(executed("a\nb"));
    }
}
