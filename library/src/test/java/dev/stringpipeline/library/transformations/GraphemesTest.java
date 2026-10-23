package dev.stringpipeline.library.transformations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class GraphemesTest {

    static Stream<Arguments> texts() {
        return Stream.of(
                arguments("empty", "", 0),
                arguments("ASCII", "abc", 3),
                arguments("thumbs up with a skin tone", Texts.THUMBS_UP, 1),
                arguments("a flag", Texts.FLAG, 1),
                arguments("an e with a combining accent", Texts.E_COMBINING_ACUTE, 1),
                arguments("a family joined by zero-width joiners", Texts.FAMILY, 1),
                arguments("CR LF, which Unicode treats as one character", "\r\n", 1),
                arguments("all of them in a row", Texts.THUMBS_UP + Texts.FLAG + Texts.E_COMBINING_ACUTE + "x", 4));
    }

    @ParameterizedTest(name = "{0}: {2} characters")
    @MethodSource("texts")
    void countsWhatAPersonSeesAsOneCharacter(String description, String text, int characters) {
        assertThat(Graphemes.boundaries(text)).as(description).hasSize(characters + 1);
    }
}
