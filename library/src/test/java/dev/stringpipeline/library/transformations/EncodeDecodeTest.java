package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.ArgumentValue.text;
import static dev.stringpipeline.library.transformations.Runs.executed;
import static dev.stringpipeline.library.transformations.Runs.failed;
import static dev.stringpipeline.library.transformations.Runs.run;
import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.StepResult;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

class EncodeDecodeTest {

    private static StepResult encode(String input, String format) {
        return run(new Encode(), input, Map.of("format", text(format)));
    }

    private static StepResult decode(String input, String format) {
        return run(new Decode(), input, Map.of("format", text(format)));
    }

    @Nested
    @DisplayName("Base64")
    class Base64 {

        // The test vectors of RFC 4648, section 10.
        @ParameterizedTest(name = "\"{0}\" is \"{1}\"")
        @CsvSource(delimiterString = "|", textBlock = """
                f      | Zg==
                fo     | Zm8=
                foo    | Zm9v
                foob   | Zm9vYg==
                fooba  | Zm9vYmE=
                foobar | Zm9vYmFy
                """)
        void encodesAndDecodesTheVectorsOfTheRfc(String text, String encoded) {
            assertThat(encode(text, "base64")).isEqualTo(executed(encoded));
            assertThat(decode(encoded, "base64")).isEqualTo(executed(text));
        }

        @Test
        void writesTheUrlSafeAlphabetWithoutPadding() {
            assertThat(encode("~~~", "base64")).isEqualTo(executed("fn5+"));
            assertThat(encode("~~~", "base64Url")).isEqualTo(executed("fn5-"));
            assertThat(encode("f", "base64Url")).isEqualTo(executed("Zg"));
        }

        @Test
        void ignoresSpacesAndLineBreaks() {
            assertThat(decode("Zm9v\r\nYmFy ", "base64")).isEqualTo(executed("foobar"));
        }

        @Test
        void namesACharacterThatBase64DoesNotUse() {
            assertThat(decode("Zm9v!", "base64")).isEqualTo(failed("This is not Base64: it contains \"!\"."));
            assertThat(decode("fn5+", "base64Url")).isEqualTo(failed("This is not Base64: it contains \"+\"."));
        }

        @Test
        void explainsAnEndThatIsCutOff() {
            assertThat(decode("Zm9vY", "base64"))
                    .isEqualTo(failed("This is not Base64: it ends too early, or = appears before the end."));
        }
    }

    @Nested
    @DisplayName("URL encoding")
    class Url {

        @Test
        void keepsOnlyUnreservedCharactersAndWritesASpaceAsPercent20() {
            assertThat(encode("a b&c=d/é~", "url")).isEqualTo(executed("a%20b%26c%3Dd%2F%C3%A9~"));
        }

        @Test
        void keepsAPlusSignAsAPlusSign() {
            assertThat(decode("a%20b+c", "url")).isEqualTo(executed("a b+c"));
        }

        @Test
        void decodesAHalfEncodedText() {
            assertThat(decode("café%21", "url")).isEqualTo(executed("café!"));
        }

        @Test
        void pointsAtAPercentSignWithoutTwoDigits() {
            assertThat(decode("100%", "url"))
                    .isEqualTo(failed(
                            "At character 4, % is not followed by two hexadecimal digits. Write %25 for a percent"
                                    + " sign."));
        }
    }

    @Nested
    @DisplayName("Hexadecimal")
    class Hexadecimal {

        @Test
        void writesTwoDigitsForEachUtf8Byte() {
            assertThat(encode("foobar", "hex")).isEqualTo(executed("666f6f626172"));
            assertThat(encode("é", "hex")).isEqualTo(executed("c3a9"));
        }

        @Test
        void readsDigitsInAnyCaseAndIgnoresSpaces() {
            assertThat(decode("C3 A9", "hex")).isEqualTo(executed("é"));
        }

        @Test
        void explainsWhatIsNotHexadecimal() {
            assertThat(decode("4g", "hex"))
                    .isEqualTo(failed("This is not hexadecimal: \"g\" is not a digit from 0 to f."));
            assertThat(decode("486", "hex"))
                    .isEqualTo(failed("This is not hexadecimal: every byte needs two digits, and one is missing."));
        }
    }

    @ParameterizedTest
    @EnumSource(Encoding.class)
    @DisplayName("decoding gives back what was encoded, with emoji and line breaks")
    void roundTrips(Encoding format) {
        String original = "Grüße " + Texts.THUMBS_UP + "\r\nzweite Zeile";
        StepResult encoded = encode(original, format.value());

        assertThat(encoded).isInstanceOf(StepResult.Executed.class);
        assertThat(decode(((StepResult.Executed) encoded).output(), format.value()))
                .isEqualTo(executed(original));
    }

    @Test
    @DisplayName("bytes that are not UTF-8 make decoding fail")
    void failsOnBytesThatAreNotUtf8() {
        assertThat(decode("/w==", "base64"))
                .isEqualTo(failed("The decoded bytes are not UTF-8 text, so they cannot be shown as text."));
    }

    @Test
    void failsWhenTheEncodedTextWouldBePastTheCap() {
        assertThat(run(new Encode(), "foobar", Map.of("format", text("hex")), Limits.DEFAULT.withMaxOutputLength(10)))
                .isEqualTo(failed("The result would be longer than 10 characters."));
    }
}
