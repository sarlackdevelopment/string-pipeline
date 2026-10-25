package dev.stringpipeline.library;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class CatalogTest {

    @Test
    void findsATransformationById() {
        Transformation appending = Fakes.appending("x");
        Catalog catalog = new Catalog(List.of(appending));

        assertThat(catalog.find("appending")).containsSame(appending);
        assertThat(catalog.find("reverse")).isEmpty();
    }

    @Test
    void listsOnlyTheCategoriesInUse() {
        Catalog catalog = new Catalog(List.of(Fakes.appending("x")));

        assertThat(catalog.categories()).containsExactly(Category.TEXT);
    }

    @Test
    void rejectsTwoTransformationsWithTheSameId() {
        List<Transformation> twins = List.of(Fakes.appending("x"), Fakes.appending("y"));

        assertThatThrownBy(() -> new Catalog(twins))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("appending");
    }

    @Test
    void rejectsTwoParametersWithTheSameName() {
        TextParameter text = TextParameter.required("text", "Text", "Some text.");
        Transformation twice = Fakes.transformation("twice", List.of(text, text), _ -> {
            throw new AssertionError("not configured in this test");
        });

        assertThatThrownBy(() -> new Catalog(List.of(twice)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("text");
    }

    @Test
    void rejectsAnIdThatIsNotLowerCamelCase() {
        assertThatThrownBy(() -> new TransformationInfo("regex-replace", "Regex replace", "A test.", Category.REGEX))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Nested
    class Examples {

        private final Transformation appending = Fakes.appending("!");

        @Test
        void offersExamplesMadeOfItsTransformations() {
            Example twice = example("twice", appending);

            Catalog catalog = new Catalog(List.of(appending), List.of(twice));

            assertThat(catalog.examples()).containsExactly(twice);
            assertThat(new Catalog(List.of(appending)).examples()).isEmpty();
        }

        @Test
        void rejectsAnExampleWithATransformationFromElsewhere() {
            List<Example> elsewhere = List.of(example("elsewhere", Fakes.appending("?")));

            assertThatThrownBy(() -> new Catalog(List.of(appending), elsewhere))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("elsewhere");
        }

        @Test
        void rejectsTwoExamplesWithTheSameId() {
            List<Example> twins = List.of(example("twice", appending), example("twice", appending));

            assertThatThrownBy(() -> new Catalog(List.of(appending), twins))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("twice");
        }

        @Test
        void needsAnIdInLowerCamelCaseAndAtLeastOneStep() {
            assertThatThrownBy(() -> example("two-steps", appending)).isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(() -> new Example("empty", "Empty", "a", List.of()))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("empty");
        }

        private static Example example(String id, Transformation transformation) {
            return new Example(
                    id, id, "a", List.of(new Step(transformation, Map.of()), new Step(transformation, Map.of())));
        }
    }
}
