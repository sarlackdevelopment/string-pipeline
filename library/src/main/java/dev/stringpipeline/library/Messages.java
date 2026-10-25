package dev.stringpipeline.library;

import java.text.MessageFormat;
import java.util.List;
import java.util.Locale;
import java.util.ResourceBundle;

/// The languages the library speaks, and its texts in each of them (D52).
///
/// The texts live in `messages.properties` next to this class, which is English and the fallback for every other
/// language, and in `messages_de.properties` and `messages_ru.properties`. A text that a message passes values to is a
/// `MessageFormat` pattern, so a count is written the way the language writes it: 10,000 in English, 10.000 in German
/// and 10 000 in Russian. A text without values is used as it is.
public final class Messages {

    public static final Locale ENGLISH = Locale.ENGLISH;
    public static final Locale GERMAN = Locale.GERMAN;
    public static final Locale RUSSIAN = Locale.of("ru");

    /// The languages with a full set of texts, English first.
    public static final List<Locale> LANGUAGES = List.of(ENGLISH, GERMAN, RUSSIAN);

    static final String BUNDLE = "dev.stringpipeline.library.messages";

    // Without this, a language the library does not speak would fall back to the server's default language before
    // English.
    private static final ResourceBundle.Control ENGLISH_FALLBACK =
            ResourceBundle.Control.getNoFallbackControl(ResourceBundle.Control.FORMAT_PROPERTIES);

    private Messages() {}

    /// The message in `locale`, or in English when the library does not speak that language.
    ///
    /// @throws java.util.MissingResourceException for a key that no bundle has, which is a programming error
    public static String render(Message message, Locale locale) {
        return switch (message) {
            case Message.Verbatim(String text) -> text;
            case Message.Keyed(String key, List<Object> arguments) -> {
                String text = ResourceBundle.getBundle(BUNDLE, locale, ENGLISH_FALLBACK)
                        .getString(key);
                yield arguments.isEmpty()
                        ? text
                        : new MessageFormat(text, locale)
                                .format(arguments.stream()
                                        .map(argument ->
                                                argument instanceof Message nested ? render(nested, locale) : argument)
                                        .toArray());
            }
        };
    }
}
