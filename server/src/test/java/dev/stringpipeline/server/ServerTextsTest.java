package dev.stringpipeline.server;

import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.Messages;
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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.FieldSource;

/// The server's own texts, in `messages*.properties`, exist in every language the library speaks, and take the same
/// values as in English (D52).
class ServerTextsTest {

    @ParameterizedTest
    @FieldSource("dev.stringpipeline.library.Messages#LANGUAGES")
    void existInEveryLanguageWithTheSameValues(Locale language) throws IOException {
        Properties english = texts(Messages.ENGLISH);
        Properties translated = texts(language);

        assertThat(translated.stringPropertyNames()).containsExactlyInAnyOrderElementsOf(english.stringPropertyNames());
        for (String key : english.stringPropertyNames()) {
            String text = translated.getProperty(key);
            assertThat(values(text, language)).as(key).isEqualTo(values(english.getProperty(key), Messages.ENGLISH));
            assertThat(text.replace("''", "")).as("%s writes a ' twice", key).doesNotContain("'");
        }
    }

    private static Properties texts(Locale language) throws IOException {
        String path = language.equals(Messages.ENGLISH)
                ? "/messages.properties"
                : "/messages_" + language.getLanguage() + ".properties";
        try (InputStream stream = Objects.requireNonNull(ServerTextsTest.class.getResourceAsStream(path), path)) {
            var texts = new Properties();
            texts.load(new InputStreamReader(stream, StandardCharsets.UTF_8));
            return texts;
        }
    }

    // For each value of a text, whether it is written as a number.
    private static List<Boolean> values(String text, Locale language) {
        return Arrays.stream(new MessageFormat(text, language).getFormatsByArgumentIndex())
                .map(format -> format instanceof NumberFormat)
                .toList();
    }
}
