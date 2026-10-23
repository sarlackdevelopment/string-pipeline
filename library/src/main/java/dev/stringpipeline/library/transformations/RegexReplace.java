package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.ParameterIssue;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.TextParameter;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/// Replaces every match of a regular expression; the replacement can insert groups (R1.1, D8).
final class RegexReplace implements Transformation {

    static final TextParameter REPLACEMENT = TextParameter.withDefault(
            "replacement",
            "Replace with",
            "Use $1 or ${name} to insert a group and \\$ for a dollar sign. Leave empty to delete every match.",
            "");

    private static final TransformationInfo INFO = new TransformationInfo(
            "regexReplace",
            "Regex replace",
            "Replaces every match of a regular expression. The replacement can insert parts of the match.",
            Category.REGEX);

    @Override
    public TransformationInfo info() {
        return INFO;
    }

    @Override
    public List<Parameter> parameters() {
        return List.of(Regex.PATTERN, REPLACEMENT, Regex.IGNORE_CASE, Regex.MULTILINE, Regex.DOT_ALL);
    }

    @Override
    public Configuration configure(Arguments arguments) {
        return switch (Regex.compile(arguments)) {
            case Regex.NotCompiled(ParameterIssue issue) -> Configuration.invalid(issue);
            case Regex.Compiled(Pattern pattern) ->
                switch (Replacement.parse(arguments.text(REPLACEMENT), pattern)) {
                    case Replacement.NotParsed(String message) ->
                        Configuration.invalid(new ParameterIssue(REPLACEMENT.name(), message));
                    case Replacement.Parsed(Replacement replacement) ->
                        Configuration.ready((input, limits) -> replaceAll(pattern, replacement, input, limits));
                };
        };
    }

    // Expands the replacement itself instead of calling Matcher.appendReplacement, so that the output cap is checked
    // before a long group reference is copied, not after (D45).
    private static StepResult.Outcome replaceAll(
            Pattern pattern, Replacement replacement, String input, Limits limits) {
        var output = new BoundedText(limits.maxOutputLength());
        int last = 0;
        try {
            Matcher matcher = Regex.matcher(pattern, input, limits);
            while (!output.overflowed() && matcher.find()) {
                output.append(input, last, matcher.start());
                replacement.appendTo(output, matcher, input);
                last = matcher.end();
            }
        } catch (TimeLimitedText.TimeLimitExceeded _) {
            return Regex.timedOut(limits.regexTimeout());
        }
        output.append(input, last, input.length());
        return output.result();
    }
}
