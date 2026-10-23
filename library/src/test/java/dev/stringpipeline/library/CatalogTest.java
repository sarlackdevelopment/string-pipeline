package dev.stringpipeline.library;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
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
}
