package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.ChoiceParameter;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.util.List;
import java.util.Locale;
import java.util.regex.MatchResult;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/// Changes upper and lower case, or writes each line as an identifier such as camelCase (D4, D10).
///
/// Case rules depend on the language. Without one (`Locale.ROOT`), i becomes I; in Turkish and Azerbaijani it
/// becomes İ, and I becomes the dotless ı. Some letters change length: ß becomes SS.
final class ChangeCase implements Transformation {

    /// The case to change to.
    enum Case implements ChoiceParameter.Option {
        UPPER("upper", "UPPER CASE"),
        LOWER("lower", "lower case"),
        TITLE("title", "Title Case"),
        CAMEL("camel", "camelCase"),
        PASCAL("pascal", "PascalCase"),
        SNAKE("snake", "snake_case"),
        KEBAB("kebab", "kebab-case"),
        CONSTANT("constant", "CONSTANT_CASE");

        private final String value;
        private final String title;

        Case(String value, String title) {
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

    /// The language whose case rules apply.
    enum Language implements ChoiceParameter.Option {
        ANY("any", "Any language", Locale.ROOT),
        TURKISH("turkish", "Turkish or Azerbaijani", Locale.forLanguageTag("tr"));

        private final String value;
        private final String title;
        private final Locale locale;

        Language(String value, String title, Locale locale) {
            this.value = value;
            this.title = title;
            this.locale = locale;
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

    static final ChoiceParameter<Case> TO = new ChoiceParameter<>(
            "to",
            "Case",
            "camelCase and the other identifier styles turn each line into one name, made of its words.",
            Case.class,
            Case.UPPER);

    static final ChoiceParameter<Language> LANGUAGE = new ChoiceParameter<>(
            "language",
            "Language",
            "Turkish and Azerbaijani have a dotted İ and a dotless ı, so i and I change differently there.",
            Language.class,
            Language.ANY);

    private static final TransformationInfo INFO = new TransformationInfo(
            "changeCase",
            "Change case",
            "Writes the text in upper, lower or title case, or turns each line into a name such as camelCase or"
                    + " snake_case.",
            Category.TEXT);

    // A word is a run of letters, marks and digits. Inside a run, a capital after a small letter or a digit starts a
    // new word (camelCase), and so does the last capital of an acronym before a small letter (HTTPResponse).
    private static final Pattern WORD = Pattern.compile("\\p{Lu}+(?=\\p{Lu}[\\p{Ll}\\p{M}])"
            + "|[\\p{Lu}\\p{Lt}]?[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}\\p{Nd}]+"
            + "|[\\p{Lu}\\p{Lt}][\\p{Lu}\\p{M}\\p{Nd}]*");

    @Override
    public TransformationInfo info() {
        return INFO;
    }

    @Override
    public List<Parameter> parameters() {
        return List.of(TO, LANGUAGE);
    }

    @Override
    public Configuration configure(Arguments arguments) {
        Case target = arguments.choice(TO);
        Locale locale = arguments.choice(LANGUAGE).locale;
        return Configuration.ready((input, limits) -> {
            // A case change can make a text longer: ß becomes SS.
            String output = convert(input, target, locale);
            return output.length() > limits.maxOutputLength()
                    ? StepResult.Failed.outputTooLong(limits.maxOutputLength())
                    : new StepResult.Executed(output);
        });
    }

    private static String convert(String text, Case target, Locale locale) {
        return switch (target) {
            case UPPER -> text.toUpperCase(locale);
            case LOWER -> text.toLowerCase(locale);
            case TITLE -> titleCase(text, locale);
            case CAMEL, PASCAL, SNAKE, KEBAB, CONSTANT -> {
                Lines lines = Lines.of(text);
                yield lines.with(lines.lines().stream()
                                .map(line -> identifier(words(line), target, locale))
                                .toList())
                        .text();
            }
        };
    }

    // The first letter of every word in capitals, the others small; everything else stays as it is. An apostrophe
    // belongs to its word, so don't becomes Don't.
    private static String titleCase(String text, Locale locale) {
        var output = new StringBuilder(text.length());
        boolean wordStart = true;
        for (int index = 0; index < text.length(); ) {
            int codePoint = text.codePointAt(index);
            String character = Character.toString(codePoint);
            if (Character.isLetter(codePoint)) {
                output.append(wordStart ? character.toUpperCase(locale) : character.toLowerCase(locale));
                wordStart = false;
            } else {
                output.append(character);
                wordStart = !Character.isDigit(codePoint)
                        && Character.getType(codePoint) != Character.NON_SPACING_MARK
                        && codePoint != '\''
                        && codePoint != '’'; // the typographic apostrophe
            }
            index += Character.charCount(codePoint);
        }
        return output.toString();
    }

    private static List<String> words(String line) {
        return WORD.matcher(line).results().map(MatchResult::group).toList();
    }

    private static String identifier(List<String> words, Case target, Locale locale) {
        return switch (target) {
            case CAMEL -> {
                var name = new StringBuilder();
                for (int index = 0; index < words.size(); index++) {
                    String word = words.get(index);
                    name.append(index == 0 ? word.toLowerCase(locale) : capitalised(word, locale));
                }
                yield name.toString();
            }
            case PASCAL -> words.stream().map(word -> capitalised(word, locale)).collect(Collectors.joining());
            case SNAKE -> words.stream().map(word -> word.toLowerCase(locale)).collect(Collectors.joining("_"));
            case KEBAB -> words.stream().map(word -> word.toLowerCase(locale)).collect(Collectors.joining("-"));
            case CONSTANT ->
                words.stream().map(word -> word.toUpperCase(locale)).collect(Collectors.joining("_"));
            case UPPER, LOWER, TITLE -> throw new IllegalArgumentException("Not an identifier style: " + target);
        };
    }

    private static String capitalised(String word, Locale locale) {
        int firstEnd = word.offsetByCodePoints(0, 1);
        return word.substring(0, firstEnd).toUpperCase(locale)
                + word.substring(firstEnd).toLowerCase(locale);
    }
}
