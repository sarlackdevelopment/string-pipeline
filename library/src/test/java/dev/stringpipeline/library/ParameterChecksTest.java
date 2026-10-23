package dev.stringpipeline.library;

import static dev.stringpipeline.library.ArgumentValue.bool;
import static dev.stringpipeline.library.ArgumentValue.number;
import static dev.stringpipeline.library.ArgumentValue.text;
import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class ParameterChecksTest {

    private enum Fruit implements ChoiceParameter.Option {
        APPLE("apple", "Apple"),
        PEAR("pear", "Pear");

        private final String value;
        private final String title;

        Fruit(String value, String title) {
            this.value = value;
            this.title = title;
        }

        @Override
        public String value() {
            return value;
        }

        @Override
        public String title() {
            return title;
        }
    }

    private static ParameterChecks.Result check(Parameter parameter, Map<String, ArgumentValue> raw) {
        return ParameterChecks.check(List.of(parameter), raw, Limits.DEFAULT);
    }

    private static Arguments valid(ParameterChecks.Result result) {
        if (result instanceof ParameterChecks.Valid(Arguments arguments)) {
            return arguments;
        }
        throw new AssertionError("Expected valid values, got " + result);
    }

    private static ParameterChecks.Problems missing(String parameter) {
        return new ParameterChecks.Problems(List.of(new ParameterIssue(parameter, "Enter a value")), false);
    }

    private static ParameterChecks.Problems invalid(String parameter, String message) {
        return new ParameterChecks.Problems(List.of(new ParameterIssue(parameter, message)), true);
    }

    @Nested
    class TextFields {

        private final TextParameter required = TextParameter.required("old", "Find", "Some text.");
        private final TextParameter optional = TextParameter.withDefault("new", "Replace with", "Some text.", "-");

        @Test
        void aMissingRequiredValueIsNotConfiguredRatherThanWrong() {
            assertThat(check(required, Map.of())).isEqualTo(missing("old"));
        }

        @Test
        void anEmptyRequiredValueCountsAsMissing() {
            assertThat(check(required, Map.of("old", text("")))).isEqualTo(missing("old"));
        }

        @Test
        void valuesAreNeverTrimmed() {
            assertThat(valid(check(required, Map.of("old", text(" ")))).text(required))
                    .isEqualTo(" ");
        }

        @Test
        void aMissingOptionalValueFallsBackToItsDefault() {
            assertThat(valid(check(optional, Map.of())).text(optional)).isEqualTo("-");
        }

        @Test
        void acceptsTheLongestAllowedValue() {
            String longest = "a".repeat(Limits.DEFAULT.maxTextParameterLength());

            assertThat(valid(check(required, Map.of("old", text(longest)))).text(required))
                    .isEqualTo(longest);
        }

        @Test
        void rejectsALongerValue() {
            String tooLong = "a".repeat(Limits.DEFAULT.maxTextParameterLength() + 1);

            assertThat(check(required, Map.of("old", text(tooLong))))
                    .isEqualTo(invalid("old", "Use at most 10,000 characters"));
        }

        @Test
        void rejectsANumber() {
            assertThat(check(required, Map.of("old", number(5)))).isEqualTo(invalid("old", "Enter text"));
        }
    }

    @Nested
    class IntegerFields {

        private final IntegerParameter start = IntegerParameter.withDefault("start", "Start", "A number.", 0);
        private final IntegerParameter end = IntegerParameter.optional("end", "End", "A number.");
        private final IntegerParameter group =
                IntegerParameter.withDefault("group", "Group", "A number.", 0).withMinimum(0);

        @Test
        void aMissingValueFallsBackToTheDefault() {
            assertThat(valid(check(start, Map.of())).integer(start)).isZero();
        }

        @Test
        void anOptionalValueMayStayEmpty() {
            assertThat(valid(check(end, Map.of())).optionalInteger(end)).isEmpty();
        }

        @Test
        void acceptsWholeNumbersInAnyNotation() {
            assertThat(valid(check(start, Map.of("start", number(-5)))).integer(start))
                    .isEqualTo(-5);
            assertThat(valid(check(start, Map.of("start", number(new BigDecimal("5.0")))))
                            .integer(start))
                    .isEqualTo(5);
            assertThat(valid(check(start, Map.of("start", number(new BigDecimal("1E+3")))))
                            .integer(start))
                    .isEqualTo(1000);
        }

        @Test
        void rejectsAFraction() {
            assertThat(check(start, Map.of("start", number(new BigDecimal("1.5")))))
                    .isEqualTo(invalid("start", "Enter a whole number"));
        }

        @Test
        void rejectsDigitsSentAsText() {
            assertThat(check(start, Map.of("start", text("5")))).isEqualTo(invalid("start", "Enter a whole number"));
        }

        @Test
        void rejectsAValueBelowTheMinimum() {
            assertThat(check(group, Map.of("group", number(-1)))).isEqualTo(invalid("group", "Enter 0 or more"));
        }

        @Test
        void rejectsAValueOutsideTheJavaIntRange() {
            assertThat(check(start, Map.of("start", number(3_000_000_000L))))
                    .isEqualTo(invalid("start", "Enter a number from -2,147,483,648 to 2,147,483,647"));
        }

        @Test
        void namesBothBoundsWhenThereAreTwo() {
            IntegerParameter bounded = new IntegerParameter("count", "Count", "A number.", 1, 1, 9);

            assertThat(check(bounded, Map.of("count", number(10))))
                    .isEqualTo(invalid("count", "Enter a number from 1 to 9"));
        }
    }

    @Nested
    class BooleanFields {

        private final BooleanParameter ignoreCase = new BooleanParameter("ignoreCase", "Ignore case", "A flag.", false);

        @Test
        void aMissingValueFallsBackToTheDefault() {
            assertThat(valid(check(ignoreCase, Map.of())).bool(ignoreCase)).isFalse();
        }

        @Test
        void acceptsTrue() {
            assertThat(valid(check(ignoreCase, Map.of("ignoreCase", bool(true))))
                            .bool(ignoreCase))
                    .isTrue();
        }

        @Test
        void rejectsText() {
            assertThat(check(ignoreCase, Map.of("ignoreCase", text("yes"))))
                    .isEqualTo(invalid("ignoreCase", "Enter true or false"));
        }
    }

    @Nested
    class ChoiceFields {

        private final ChoiceParameter<Fruit> fruit =
                new ChoiceParameter<>("fruit", "Fruit", "A choice.", Fruit.class, Fruit.APPLE);

        @Test
        void aMissingValueFallsBackToTheDefault() {
            assertThat(valid(check(fruit, Map.of())).choice(fruit)).isEqualTo(Fruit.APPLE);
        }

        @Test
        void acceptsAnOptionByItsValue() {
            assertThat(valid(check(fruit, Map.of("fruit", text("pear")))).choice(fruit))
                    .isEqualTo(Fruit.PEAR);
        }

        @Test
        void rejectsAnythingElse() {
            assertThat(check(fruit, Map.of("fruit", text("plum"))))
                    .isEqualTo(invalid("fruit", "Choose one of the options"));
            assertThat(check(fruit, Map.of("fruit", number(1))))
                    .isEqualTo(invalid("fruit", "Choose one of the options"));
        }

        @Test
        void listsTheOptionsInDisplayOrder() {
            assertThat(fruit.options()).containsExactly(Fruit.APPLE, Fruit.PEAR);
        }
    }
}
