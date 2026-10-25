package dev.stringpipeline.library.transformations;

import static dev.stringpipeline.library.Messages.ENGLISH;
import static dev.stringpipeline.library.Messages.GERMAN;
import static dev.stringpipeline.library.Messages.RUSSIAN;
import static dev.stringpipeline.library.Messages.render;
import static java.util.Map.entry;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import dev.stringpipeline.library.Message;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import org.junit.jupiter.api.Test;

/// Java's messages that the library translates: each still reads in English exactly as Java writes it, so a newer
/// Java with other wording fails here instead of silently showing English (D52).
class JdkMessageTest {

    @Test
    void translatesEveryKnownRegexSyntaxError() {
        Map<String, String> javaSays = Map.ofEntries(
                entry("(a", "Unclosed group"),
                entry("[a", "Unclosed character class"),
                entry("a)", "Unmatched closing ')'"),
                entry("*a", "Dangling meta character '*'"),
                entry("a{", "Illegal repetition"),
                entry("a{2,1}", "Illegal repetition range"),
                entry("a{2,", "Unclosed counted closure"),
                entry("a\\", "Unescaped trailing backslash"),
                entry("[b-a]", "Illegal character range"),
                entry("(?z)", "Unknown inline modifier"),
                entry("\\y", "Illegal/unsupported escape sequence"),
                entry("(?<1a>x)", "capturing group name does not start with a Latin letter"),
                entry("(?<a", "named capturing group is missing trailing '>'"),
                entry("(?<a>x)\\k<b>", "named capturing group <b> does not exist"),
                entry("\\k", "\\k is not followed by '<' for named capturing group"));

        var translated = new ArrayList<String>();
        javaSays.forEach((pattern, description) -> {
            PatternSyntaxException e =
                    catchThrowableOfType(PatternSyntaxException.class, () -> Pattern.compile(pattern));
            assertThat(e.getDescription()).as(pattern).isEqualTo(description);
            translated.add(key(JdkMessage.translate(description, Regex.SYNTAX_ERRORS), description));
        });

        assertThat(translated).containsExactlyInAnyOrderElementsOf(keys(Regex.SYNTAX_ERRORS));
    }

    @Test
    void translatesEveryKnownDatePatternError() {
        Map<String, String> javaSays = Map.of(
                "yyyy-bb", "Unknown pattern letter: b",
                "dddd", "Too many pattern letters: d",
                "yyyy#", "Pattern includes reserved character: '#'",
                "yyyy-MM-dd'T", "Pattern ends with an incomplete string literal: yyyy-MM-dd'T",
                "yyyy]", "Pattern invalid as it contains ] without previous [");

        var translated = new ArrayList<String>();
        javaSays.forEach((pattern, message) -> {
            IllegalArgumentException e =
                    catchThrowableOfType(IllegalArgumentException.class, () -> DateTimeFormatter.ofPattern(pattern));
            assertThat(e).as(pattern).hasMessage(message);
            translated.add(key(JdkMessage.translate(message, ReformatDates.PATTERN_ERRORS), message));
        });

        assertThat(translated).containsExactlyInAnyOrderElementsOf(keys(ReformatDates.PATTERN_ERRORS));
    }

    @Test
    void passesTheValuesInJavasMessageOn() {
        Message dangling = JdkMessage.translate("Dangling meta character '+'", Regex.SYNTAX_ERRORS);

        assertThat(render(Message.of("regex.syntax", dangling, 1), GERMAN))
                .isEqualTo("Metazeichen '+' ohne vorangehenden Ausdruck an Position 1");
        assertThat(render(Message.of("regex.syntax", dangling, 1), RUSSIAN))
                .isEqualTo("Метасимвол '+' ни к чему не относится в позиции 1");
    }

    @Test
    void showsAnyOtherMessageAsJavaWroteIt() {
        String rare = "Unknown character property name {Foo}";

        assertThat(JdkMessage.translate(rare, Regex.SYNTAX_ERRORS)).isEqualTo(Message.verbatim(rare));
    }

    // The key of a translation, after checking that its English reads exactly as Java wrote it.
    private static String key(Message translation, String javaWrote) {
        assertThat(translation).isInstanceOf(Message.Keyed.class);
        assertThat(render(translation, ENGLISH)).isEqualTo(javaWrote);
        return ((Message.Keyed) translation).key();
    }

    private static List<String> keys(List<JdkMessage> known) {
        return known.stream().map(JdkMessage::key).toList();
    }
}
