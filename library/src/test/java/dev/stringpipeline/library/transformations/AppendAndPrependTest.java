package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.text;
import static dev.stringpipeline.library.transformations.Runs.executed;
import static dev.stringpipeline.library.transformations.Runs.failed;
import static dev.stringpipeline.library.transformations.Runs.run;
import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.Limits;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AppendAndPrependTest {

    private final Append append = new Append();
    private final Prepend prepend = new Prepend();

    @Test
    void appendsToTheEnd() {
        assertThat(run(append, "Hello", Map.of("text", text(" World")))).isEqualTo(executed("Hello World"));
    }

    @Test
    void prependsToTheBeginning() {
        assertThat(run(prepend, "World", Map.of("text", text("Hello ")))).isEqualTo(executed("Hello World"));
    }

    @Test
    void leavesTheTextAloneUntilThereIsSomethingToAdd() {
        assertThat(run(append, "abc", Map.of())).isEqualTo(executed("abc"));
        assertThat(run(prepend, "abc", Map.of())).isEqualTo(executed("abc"));
    }

    @Test
    void stopsAtTheOutputCap() {
        Limits small = Limits.DEFAULT.withMaxOutputLength(5);

        assertThat(run(append, "abc", Map.of("text", text("def")), small))
                .isEqualTo(failed("The result would be longer than 5 characters."));
        assertThat(run(prepend, "abc", Map.of("text", text("def")), small))
                .isEqualTo(failed("The result would be longer than 5 characters."));
    }
}
