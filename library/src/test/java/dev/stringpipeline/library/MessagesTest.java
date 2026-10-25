package dev.stringpipeline.library;

import static dev.stringpipeline.library.Messages.ENGLISH;
import static dev.stringpipeline.library.Messages.GERMAN;
import static dev.stringpipeline.library.Messages.RUSSIAN;
import static dev.stringpipeline.library.Messages.render;
import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.MessageFormat;
import java.text.NumberFormat;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Properties;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.FieldSource;

class MessagesTest {

    private static final List<Locale> LANGUAGES = Messages.LANGUAGES;

    // A text that the code passes values to, as opposed to one used as it is.
    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\d");

    @Test
    void everyLanguageHasEveryText() throws IOException {
        var english = texts(ENGLISH).stringPropertyNames();

        for (Locale language : LANGUAGES) {
            assertThat(texts(language).stringPropertyNames())
                    .as("the texts in %s", language)
                    .containsExactlyInAnyOrderElementsOf(english);
        }
    }

    @ParameterizedTest
    @FieldSource("LANGUAGES")
    void aTextTakesTheSameValuesAsInEnglish(Locale language) throws IOException {
        Properties english = texts(ENGLISH);
        Properties translated = texts(language);

        for (String key : english.stringPropertyNames()) {
            String text = translated.getProperty(key);
            boolean takesValues = PLACEHOLDER.matcher(english.getProperty(key)).find();
            assertThat(PLACEHOLDER.matcher(text).find()).as(key).isEqualTo(takesValues);
            if (takesValues) {
                assertThat(values(text, language)).as(key).isEqualTo(values(english.getProperty(key), ENGLISH));
                assertThat(text.replace("''", ""))
                        .as("%s writes a ' twice", key)
                        .doesNotContain("'");
            } else {
                assertThat(text).as("%s is used as it is", key).doesNotContain("''");
            }
        }
    }

    @Test
    void writesACountTheWayEachLanguageDoes() {
        Message tooLong = Message.of("check.textTooLong", 10_000);

        assertThat(render(tooLong, ENGLISH)).isEqualTo("Use at most 10,000 characters");
        assertThat(render(tooLong, GERMAN)).isEqualTo("Höchstens 10.000 Zeichen verwenden");
        assertThat(render(tooLong, RUSSIAN)).isEqualTo("Максимум символов: 10 000");
    }

    @Test
    void writesAPositionWithoutThousandsSeparators() {
        assertThat(render(Message.of("reformatDates.differsAt", 12_345), ENGLISH))
                .isEqualTo("it differs from the pattern at character 12345.");
    }

    @Test
    void rendersAValueThatIsAMessageInTheSameLanguage() {
        Message timedOut = Message.of("regex.timedOut", Message.of("regex.seconds", 2));

        assertThat(render(timedOut, GERMAN))
                .isEqualTo("Das Muster hat für diesen Text länger als 2 Sekunden gebraucht. Versuchen Sie ein"
                        + " einfacheres Muster.");
        assertThat(render(timedOut, RUSSIAN))
                .isEqualTo("Шаблон не справился с этим текстом за 2 с. Попробуйте шаблон попроще.");
    }

    @Test
    void choosesTheEnglishSingularOrPlural() {
        assertThat(render(Message.of("regex.seconds", 1), ENGLISH)).isEqualTo("1 second");
        assertThat(render(Message.of("regex.seconds", 2), ENGLISH)).isEqualTo("2 seconds");
        assertThat(render(Message.of("regex.milliseconds", 0), ENGLISH)).isEqualTo("0 milliseconds");
        assertThat(render(Message.of("regex.milliseconds", 1), ENGLISH)).isEqualTo("1 millisecond");
        assertThat(render(Message.of("regex.milliseconds", 1500), ENGLISH)).isEqualTo("1,500 milliseconds");
    }

    @Test
    void usesATextWithoutValuesAsItIs() {
        assertThat(render(Message.of("example.brief"), ENGLISH)).isEqualTo("The brief's chain");
        assertThat(render(Message.verbatim("Java's {0}"), RUSSIAN)).isEqualTo("Java's {0}");
    }

    @Test
    void speaksTheLanguageOfARegionToo() {
        assertThat(render(Message.of("check.enterValue"), Locale.forLanguageTag("de-AT")))
                .isEqualTo("Wert eingeben");
    }

    @Test
    void speaksEnglishToAnyOtherLanguageWhateverTheServersOwnLanguage() {
        Locale serversOwn = Locale.getDefault();
        Locale.setDefault(GERMAN);
        try {
            assertThat(render(Message.of("check.enterValue"), Locale.FRENCH)).isEqualTo("Enter a value");
        } finally {
            Locale.setDefault(serversOwn);
        }
    }

    // The texts of one language, without the English ones it falls back to.
    private static Properties texts(Locale language) throws IOException {
        String suffix = language.equals(ENGLISH) ? "" : "_" + language.getLanguage();
        String path = "/" + Messages.BUNDLE.replace('.', '/') + suffix + ".properties";
        try (InputStream stream = Objects.requireNonNull(Messages.class.getResourceAsStream(path), path)) {
            var texts = new Properties();
            texts.load(new InputStreamReader(stream, StandardCharsets.UTF_8));
            return texts;
        }
    }

    // For each value of a pattern, whether it is written as a number.
    private static List<Boolean> values(String text, Locale language) {
        return Arrays.stream(new MessageFormat(text, language).getFormatsByArgumentIndex())
                .map(format -> format instanceof NumberFormat)
                .toList();
    }
}
