package dev.stringpipeline.library.transformations;

import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.Transformation;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

/// The built-in catalog matches `contract/catalog.json`: the same transformations, order and parameter names.
class BuiltInsTest {

    private final Catalog catalog = BuiltIns.catalog();

    @Test
    void offersTheBriefsTransformationsAndRegexReplaceInDisplayOrder() {
        assertThat(catalog.transformations())
                .extracting(transformation -> transformation.info().id())
                .containsExactly("replace", "append", "prepend", "substring", "regexExtract", "regexReplace");
    }

    @Test
    void groupsThemIntoTextAndRegexCategories() {
        assertThat(catalog.categories()).containsExactly(Category.TEXT, Category.REGEX);
    }

    @Test
    void declaresTheParametersOfTheContract() {
        Map<String, List<String>> parameters = catalog.transformations().stream()
                .collect(
                        Collectors.toMap(transformation -> transformation.info().id(), BuiltInsTest::names));

        assertThat(parameters)
                .containsExactlyInAnyOrderEntriesOf(Map.of(
                        "replace", List.of("old", "new"),
                        "append", List.of("text"),
                        "prepend", List.of("text"),
                        "substring", List.of("start", "end"),
                        "regexExtract", List.of("pattern", "group", "matches", "ignoreCase", "multiline", "dotAll"),
                        "regexReplace", List.of("pattern", "replacement", "ignoreCase", "multiline", "dotAll")));
    }

    private static List<String> names(Transformation transformation) {
        return transformation.parameters().stream().map(Parameter::name).toList();
    }
}
