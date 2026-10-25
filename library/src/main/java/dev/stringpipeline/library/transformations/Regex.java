package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.BooleanParameter;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Message;
import dev.stringpipeline.library.ParameterIssue;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.TextParameter;
import java.time.Duration;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

/// What the two regex transformations share: the pattern and flag parameters, compiling, and the time limit (D8, D9,
/// D21).
final class Regex {

    static final TextParameter PATTERN = TextParameter.required(
            "pattern", Message.of("regex.pattern.title"), Message.of("regex.pattern.description"));

    static final BooleanParameter IGNORE_CASE = new BooleanParameter(
            "ignoreCase", Message.of("regex.ignoreCase.title"), Message.of("regex.ignoreCase.description"), false);

    static final BooleanParameter MULTILINE = new BooleanParameter(
            "multiline", Message.of("regex.multiline.title"), Message.of("regex.multiline.description"), false);

    static final BooleanParameter DOT_ALL = new BooleanParameter(
            "dotAll", Message.of("regex.dotAll.title"), Message.of("regex.dotAll.description"), false);

    /// Java's syntax errors for a pattern that is still being typed, such as `(`, `[a-`, `*` or `a{2,`.
    static final List<JdkMessage> SYNTAX_ERRORS = List.of(
            new JdkMessage("Unclosed group", "jdk.regex.unclosedGroup"),
            new JdkMessage("Unclosed character class", "jdk.regex.unclosedCharacterClass"),
            new JdkMessage("Unmatched closing '\\)'", "jdk.regex.unmatchedClosingParenthesis"),
            new JdkMessage("Dangling meta character '(.)'", "jdk.regex.danglingMetaCharacter"),
            new JdkMessage("Illegal repetition", "jdk.regex.illegalRepetition"),
            new JdkMessage("Illegal repetition range", "jdk.regex.illegalRepetitionRange"),
            new JdkMessage("Unclosed counted closure", "jdk.regex.unclosedCountedClosure"),
            new JdkMessage("Unescaped trailing backslash", "jdk.regex.trailingBackslash"),
            new JdkMessage("Illegal character range", "jdk.regex.illegalCharacterRange"),
            new JdkMessage("Unknown inline modifier", "jdk.regex.unknownInlineModifier"),
            new JdkMessage("Illegal/unsupported escape sequence", "jdk.regex.illegalEscapeSequence"),
            new JdkMessage("capturing group name does not start with a Latin letter", "jdk.regex.groupNameStart"),
            new JdkMessage("named capturing group is missing trailing '>'", "jdk.regex.groupNameEnd"),
            new JdkMessage("named capturing group <(.+)> does not exist", "jdk.regex.noSuchGroupName"),
            new JdkMessage("\\\\k is not followed by '<' for named capturing group", "jdk.regex.backReferenceName"));

    private Regex() {}

    /// A compiled pattern, or the syntax error at the pattern field.
    sealed interface Compilation permits Compiled, NotCompiled {}

    record Compiled(Pattern pattern) implements Compilation {}

    record NotCompiled(ParameterIssue issue) implements Compilation {}

    static Compilation compile(Arguments arguments) {
        int flags = 0;
        if (arguments.bool(IGNORE_CASE)) {
            // Unicode case folding too, so that Ä matches ä.
            flags |= Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE;
        }
        if (arguments.bool(MULTILINE)) {
            flags |= Pattern.MULTILINE;
        }
        if (arguments.bool(DOT_ALL)) {
            flags |= Pattern.DOTALL;
        }
        try {
            return new Compiled(Pattern.compile(arguments.text(PATTERN), flags));
        } catch (PatternSyntaxException e) {
            return new NotCompiled(new ParameterIssue(PATTERN.name(), describe(e)));
        }
    }

    /// A matcher over `input` that throws [TimeLimitedText.TimeLimitExceeded] once the time limit has passed.
    static Matcher matcher(Pattern pattern, String input, Limits limits) {
        return pattern.matcher(new TimeLimitedText(
                input, System.nanoTime() + limits.regexTimeout().toNanos()));
    }

    static StepResult.Failed timedOut(Duration limit) {
        return new StepResult.Failed(Message.of("regex.timedOut", describe(limit)));
    }

    // Java's description with a 1-based position (D9): "Unclosed group at character 4".
    private static Message describe(PatternSyntaxException e) {
        Message description = JdkMessage.translate(e.getDescription(), SYNTAX_ERRORS);
        return e.getIndex() >= 0 ? Message.of("regex.syntax", description, e.getIndex() + 1) : description;
    }

    // "2 seconds", "1 second", "50 milliseconds".
    private static Message describe(Duration duration) {
        long millis = duration.toMillis();
        return millis > 0 && millis % 1000 == 0
                ? Message.of("regex.seconds", millis / 1000)
                : Message.of("regex.milliseconds", millis);
    }
}
