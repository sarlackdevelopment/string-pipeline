package dev.stringpipeline.library.transformations;

import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Example;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Pipeline;
import dev.stringpipeline.library.PipelineResult;
import dev.stringpipeline.library.StepResult;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/// The example chains of the built-in catalog (D50): each runs to its end, through the real pipeline, and shows what
/// its name promises. A renamed parameter or a changed default breaks a test here, not the example in the app.
class ExamplesTest {

    private static final Catalog CATALOG = BuiltIns.catalog();

    static Stream<Arguments> examples() {
        return CATALOG.examples().stream().map(example -> Arguments.argumentSet(example.id(), example));
    }

    @ParameterizedTest
    @MethodSource("examples")
    void runsEveryStep(Example example) {
        assertThat(run(example).steps()).isNotEmpty().allMatch(StepResult.Executed.class::isInstance);
    }

    @Test
    void showsWhatItsNamePromises() {
        Map<String, String> outputs = CATALOG.examples().stream()
                .collect(Collectors.toMap(
                        Example::id, example -> run(example).output().orElseThrow()));

        assertThat(outputs)
                .containsExactlyInAnyOrderEntriesOf(Map.of(
                        "brief", "Real Python!",
                        "titleToSlug", "/blog/10-tips-for-better-regular-expressions",
                        "sortFileNames", "file1.txt\nfile2.txt\nfile10.txt",
                        "reformatDates", "29 October 2026\n31 December 2026",
                        "findEmailAddresses", "anna@example.com\nbob@example.org"));
    }

    @Test
    void comeInDisplayOrder() {
        assertThat(CATALOG.examples())
                .extracting(Example::id)
                .containsExactly("brief", "titleToSlug", "sortFileNames", "reformatDates", "findEmailAddresses");
    }

    private static PipelineResult run(Example example) {
        return new Pipeline(Limits.DEFAULT).run(example.input(), example.steps());
    }
}
