package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.ChoiceParameter;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.IntegerParameter;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.ParameterIssue;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/// Outputs the matches of a regular expression, one per line (R1.1, D8).
final class RegexExtract implements Transformation {

    /// Which matches to output.
    enum Matches implements ChoiceParameter.Option {
        FIRST("first", "First match"),
        ALL("all", "All matches");

        private final String value;
        private final String title;

        Matches(String value, String title) {
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

    static final IntegerParameter GROUP = IntegerParameter.withDefault(
                    "group",
                    "Group",
                    "0 outputs the whole match; 1 and up output what that pair of parentheses matched.",
                    0)
            .withMinimum(0);

    static final ChoiceParameter<Matches> MATCHES = new ChoiceParameter<>(
            "matches", "Matches", "Output the first match only, or all of them.", Matches.class, Matches.ALL);

    private static final TransformationInfo INFO = new TransformationInfo(
            "regexExtract",
            "Regex extract",
            "Finds the matches of a regular expression and outputs them one per line. Outputs empty text when"
                    + " nothing matches.",
            Category.REGEX);

    @Override
    public TransformationInfo info() {
        return INFO;
    }

    @Override
    public List<Parameter> parameters() {
        return List.of(Regex.PATTERN, GROUP, MATCHES, Regex.IGNORE_CASE, Regex.MULTILINE, Regex.DOT_ALL);
    }

    @Override
    public Configuration configure(Arguments arguments) {
        return switch (Regex.compile(arguments)) {
            case Regex.NotCompiled(ParameterIssue issue) -> Configuration.invalid(issue);
            case Regex.Compiled(Pattern pattern) -> withPattern(pattern, arguments);
        };
    }

    private static Configuration withPattern(Pattern pattern, Arguments arguments) {
        int group = arguments.integer(GROUP);
        int groupCount = pattern.matcher("").groupCount();
        if (group > groupCount) {
            return Configuration.invalid(new ParameterIssue(GROUP.name(), noSuchGroup(groupCount)));
        }
        Matches matches = arguments.choice(MATCHES);
        return Configuration.ready((input, limits) -> extract(pattern, group, matches, input, limits));
    }

    private static String noSuchGroup(int groupCount) {
        return switch (groupCount) {
            case 0 -> "The pattern has no groups, so use 0 for the whole match";
            case 1 -> "The pattern has 1 group, so use 0 or 1";
            default -> "The pattern has " + groupCount + " groups, so use a number from 0 to " + groupCount;
        };
    }

    // A group that did not take part in a match gives an empty line, so lines still correspond to matches.
    private static StepResult.Outcome extract(
            Pattern pattern, int group, Matches matches, String input, Limits limits) {
        var output = new BoundedText(limits.maxOutputLength());
        try {
            Matcher matcher = Regex.matcher(pattern, input, limits);
            boolean first = true;
            while (!output.overflowed() && matcher.find()) {
                if (!first) {
                    output.append("\n");
                }
                first = false;
                int start = matcher.start(group);
                if (start >= 0) {
                    output.append(input, start, matcher.end(group));
                }
                if (matches == Matches.FIRST) {
                    break;
                }
            }
        } catch (TimeLimitedText.TimeLimitExceeded _) {
            return Regex.timedOut(limits.regexTimeout());
        }
        return output.result();
    }
}
