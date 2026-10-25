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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class ChangeCaseTest {

    private final ChangeCase changeCase = new ChangeCase();

    private StepResult change(String input, String to) {
        return run(changeCase, input, Map.of("to", text(to)));
    }

    @ParameterizedTest(name = "{0} turns \"{1}\" into \"{2}\"")
    @CsvSource(delimiterString = "|", textBlock = """
            upper    | first name          | FIRST NAME
            lower    | First NAME          | first name
            title    | the quick BROWN fox | The Quick Brown Fox
            camel    | first name          | firstName
            pascal   | first name          | FirstName
            snake    | first name          | first_name
            kebab    | first name          | first-name
            constant | first name          | FIRST_NAME
            """)
    @DisplayName("writes every case of the list (D4)")
    void writesEveryCase(String to, String input, String output) {
        assertThat(change(input, to)).isEqualTo(executed(output));
    }

    @ParameterizedTest(name = "\"{0}\" in snake_case is \"{1}\"")
    @CsvSource(delimiterString = "|", textBlock = """
            parseHTTPResponse | parse_http_response
            XMLHttpRequest    | xml_http_request
            user-ID 42        | user_id_42
            version2Update    | version2_update
            '  hello, world!' | hello_world
            Grüße aus Köln    | grüße_aus_köln
            """)
    @DisplayName("finds the words in camelCase, acronyms, punctuation and other scripts")
    void findsTheWords(String input, String output) {
        assertThat(change(input, "snake")).isEqualTo(executed(output));
    }

    @Test
    void turnsEachLineIntoItsOwnName() {
        assertThat(change("first name\r\nlast name\n", "camel")).isEqualTo(executed("firstName\nlastName\n"));
    }

    @Test
    void keepsApostrophesHyphensAndDigitsInTitleCase() {
        assertThat(change("don't stop at the well-known 3rd street", "title"))
                .isEqualTo(executed("Don't Stop At The Well-Known 3rd Street"));
    }

    @Test
    void keepsACombiningAccentWithItsLetter() {
        assertThat(change(Texts.E_COMBINING_ACUTE + "cole", "title"))
                .isEqualTo(executed("E" + Texts.COMBINING_ACUTE + "cole"));
    }

    @Test
    void failsWhenTheTextGrowsPastTheCap() {
        // Each ß becomes SS, so 3 characters become 6.
        assertThat(run(changeCase, "ßßß", Map.of("to", text("upper")), Limits.DEFAULT.withMaxOutputLength(5)))
                .isEqualTo(failed("The result would be longer than 5 characters."));
    }
}
