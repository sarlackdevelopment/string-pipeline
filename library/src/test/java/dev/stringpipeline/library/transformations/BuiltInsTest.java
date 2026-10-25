package dev.stringpipeline.library.transformations;

import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.ChoiceParameter;
import dev.stringpipeline.library.Example;
import dev.stringpipeline.library.Message;
import dev.stringpipeline.library.Messages;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.Transformation;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.FieldSource;

/// The built-in catalog matches `contract/catalog.json`: the same transformations, order and parameter names. It
/// shows its texts in every language (D52).
class BuiltInsTest {

    private final Catalog catalog = BuiltIns.catalog();

    @Test
    void offersTheBriefsTransformationsAndTheHarderOnesInDisplayOrder() {
        assertThat(catalog.transformations())
                .extracting(transformation -> transformation.info().id())
                .containsExactly(
                        "replace",
                        "append",
                        "prepend",
                        "substring",
                        "changeCase",
                        "lineOperations",
                        "encode",
                        "decode",
                        "reformatDates",
                        "regexExtract",
                        "regexReplace");
    }

    @Test
    void groupsThemIntoCategories() {
        assertThat(catalog.categories())
                .containsExactly(Category.TEXT, Category.LINES, Category.CONVERSIONS, Category.REGEX);
    }

    @Test
    void declaresTheParametersOfTheContract() {
        Map<String, List<String>> parameters = catalog.transformations().stream()
                .collect(
                        Collectors.toMap(transformation -> transformation.info().id(), BuiltInsTest::names));

        assertThat(parameters)
                .containsExactlyInAnyOrderEntriesOf(Map.ofEntries(
                        Map.entry("replace", List.of("old", "new")),
                        Map.entry("append", List.of("text")),
                        Map.entry("prepend", List.of("text")),
                        Map.entry("substring", List.of("start", "end")),
                        Map.entry("changeCase", List.of("to", "language")),
                        Map.entry("lineOperations", List.of("operation", "ignoreCase")),
                        Map.entry("encode", List.of("format")),
                        Map.entry("decode", List.of("format")),
                        Map.entry("reformatDates", List.of("from", "to")),
                        Map.entry(
                                "regexExtract",
                                List.of("pattern", "group", "matches", "ignoreCase", "multiline", "dotAll")),
                        Map.entry(
                                "regexReplace",
                                List.of("pattern", "replacement", "ignoreCase", "multiline", "dotAll"))));
    }

    @ParameterizedTest
    @FieldSource("dev.stringpipeline.library.Messages#LANGUAGES")
    void hasEveryTextItShowsIn(Locale language) {
        Stream<Message> texts = Stream.of(
                        catalog.categories().stream().map(Category::displayName),
                        catalog.transformations().stream()
                                .map(Transformation::info)
                                .flatMap(info -> Stream.of(info.name(), info.description())),
                        catalog.transformations().stream()
                                .flatMap(transformation -> transformation.parameters().stream())
                                .flatMap(BuiltInsTest::texts),
                        catalog.examples().stream().map(Example::name))
                .flatMap(Function.identity());

        assertThat(texts)
                .allSatisfy(text -> assertThat(Messages.render(text, language)).isNotBlank());
    }

    private static List<String> names(Transformation transformation) {
        return transformation.parameters().stream().map(Parameter::name).toList();
    }

    // A parameter's title and description, and the titles of its options.
    private static Stream<Message> texts(Parameter parameter) {
        Stream<Message> options = parameter instanceof ChoiceParameter<?> choice
                ? choice.options().stream().map(ChoiceParameter.Option::title)
                : Stream.empty();
        return Stream.concat(Stream.of(parameter.title(), parameter.description()), options);
    }
}
