package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.BooleanParameter;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.ParameterIssue;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.TextParameter;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

/// What the two regex transformations share: the pattern and flag parameters, compiling, and the time limit (D8, D9,
/// D21).
final class Regex {

    static final TextParameter PATTERN =
            TextParameter.required("pattern", "Pattern", "A Java regular expression, for example \\d+ for numbers.");

    static final BooleanParameter IGNORE_CASE = new BooleanParameter(
            "ignoreCase",
            "Ignore case",
            "Treats upper and lower case as the same, also for letters such as Ä and ä.",
            false);

    static final BooleanParameter MULTILINE = new BooleanParameter(
            "multiline",
            "Multiline",
            "^ and $ match at the start and end of every line, not only of the whole text.",
            false);

    static final BooleanParameter DOT_ALL =
            new BooleanParameter("dotAll", "Dot matches line breaks", "Lets . match line breaks too.", false);

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
        return new StepResult.Failed(
                "The pattern took longer than " + describe(limit) + " on this text. Try a simpler pattern.");
    }

    // Java's description with a 1-based position (D9): "Unclosed group at character 4".
    private static String describe(PatternSyntaxException e) {
        return e.getIndex() >= 0 ? e.getDescription() + " at character " + (e.getIndex() + 1) : e.getDescription();
    }

    // "2 seconds", "1 second", "50 milliseconds".
    private static String describe(Duration duration) {
        long millis = duration.toMillis();
        if (millis % 1000 == 0) {
            long seconds = millis / 1000;
            return seconds == 1 ? "1 second" : seconds + " seconds";
        }
        return millis == 1 ? "1 millisecond" : millis + " milliseconds";
    }
}
