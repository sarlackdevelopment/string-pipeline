package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Message;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.ParameterIssue;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.TextParameter;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.time.temporal.ChronoField;
import java.time.temporal.TemporalAccessor;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Stream;

/// Reads each line as a date with one pattern and writes it with another (D3, D4, D10).
///
/// Reading is strict: 30 February is an error, not 28 February. The pattern letters are those of Java's
/// `DateTimeFormatter`; month and day names are English, read in any case. `yyyy` works too, which strict Java
/// rejects on its own: it reads the year of an era, so the era defaults to ours.
final class ReformatDates implements Transformation {

    static final TextParameter FROM = TextParameter.withDefault(
            "from", Message.of("reformatDates.from.title"), Message.of("reformatDates.from.description"), "yyyy-MM-dd");

    static final TextParameter TO = TextParameter.withDefault(
            "to", Message.of("reformatDates.to.title"), Message.of("reformatDates.to.description"), "dd.MM.yyyy");

    /// Java's errors for a pattern that is still being typed, such as `b` or `yyyy-MM-dd'T`.
    static final List<JdkMessage> PATTERN_ERRORS = List.of(
            new JdkMessage("Unknown pattern letter: (.)", "jdk.datePattern.unknownLetter"),
            new JdkMessage("Too many pattern letters: (.)", "jdk.datePattern.tooManyLetters"),
            new JdkMessage("Pattern includes reserved character: '(.)'", "jdk.datePattern.reservedCharacter"),
            new JdkMessage("Pattern ends with an incomplete string literal: (.*)", "jdk.datePattern.unclosedQuote"),
            new JdkMessage(
                    "Pattern invalid as it contains \\] without previous \\[", "jdk.datePattern.unopenedBracket"));

    private static final TransformationInfo INFO = new TransformationInfo(
            "reformatDates",
            Message.of("reformatDates.name"),
            Message.of("reformatDates.description"),
            Category.CONVERSIONS);

    @Override
    public TransformationInfo info() {
        return INFO;
    }

    @Override
    public List<Parameter> parameters() {
        return List.of(FROM, TO);
    }

    @Override
    public Configuration configure(Arguments arguments) {
        String from = arguments.text(FROM);
        String to = arguments.text(TO);
        List<ParameterIssue> issues = Stream.of(
                        check(FROM, from, ReformatDates::reader), check(TO, to, ReformatDates::writer))
                .flatMap(Optional::stream)
                .toList();
        if (!issues.isEmpty()) {
            return new Configuration.Invalid(issues);
        }
        DateTimeFormatter reader = reader(from);
        DateTimeFormatter writer = writer(to);
        return Configuration.ready((input, limits) -> reformat(input, from, reader, writer, limits));
    }

    private static DateTimeFormatter reader(String pattern) {
        return new DateTimeFormatterBuilder()
                .parseCaseInsensitive()
                .appendPattern(pattern)
                .parseDefaulting(ChronoField.ERA, 1)
                .toFormatter(Locale.ENGLISH)
                .withResolverStyle(ResolverStyle.STRICT);
    }

    private static DateTimeFormatter writer(String pattern) {
        return DateTimeFormatter.ofPattern(pattern, Locale.ENGLISH);
    }

    // Java explains a bad pattern well enough, such as "Unknown pattern letter: b".
    private static Optional<ParameterIssue> check(
            TextParameter parameter, String pattern, Function<String, DateTimeFormatter> build) {
        try {
            var _ = build.apply(pattern); // built only to see whether Java can read the pattern
            return Optional.empty();
        } catch (IllegalArgumentException e) {
            String message = e.getMessage();
            return Optional.of(new ParameterIssue(
                    parameter.name(),
                    message == null
                            ? Message.of("reformatDates.patternUnreadable")
                            : JdkMessage.translate(message, PATTERN_ERRORS)));
        }
    }

    private static StepResult.Outcome reformat(
            String input, String from, DateTimeFormatter reader, DateTimeFormatter writer, Limits limits) {
        Lines lines = Lines.of(input);
        List<String> reformatted = new ArrayList<>(lines.lines().size());
        long length = 0;
        for (int index = 0; index < lines.lines().size(); index++) {
            String line = lines.lines().get(index);
            if (line.isEmpty()) {
                reformatted.add(line);
                continue;
            }
            TemporalAccessor value;
            try {
                value = reader.parseBest(line, LocalDateTime::from, LocalDate::from, LocalTime::from);
            } catch (DateTimeParseException e) {
                return new StepResult.Failed(Message.of("reformatDates.notADate", index + 1, from, reason(e)));
            }
            String written;
            try {
                written = writer.format(value);
            } catch (DateTimeException e) {
                // Java names what is missing, such as "Unsupported field: HourOfDay", in English only.
                return new StepResult.Failed(
                        Message.of("reformatDates.outputNeedsMore", String.valueOf(e.getMessage())));
            }
            length += written.length() + 1;
            if (length > limits.maxOutputLength()) {
                return StepResult.Failed.outputTooLong(limits.maxOutputLength());
            }
            reformatted.add(written);
        }
        return new StepResult.Executed(lines.with(reformatted).text());
    }

    // Java says either what was wrong, such as "Invalid date 'February 29' as '2026' is not a leap year", in English
    // only, or just where reading stopped.
    private static Message reason(DateTimeParseException e) {
        Throwable cause = e.getCause();
        if (cause != null && cause.getMessage() != null) {
            return Message.verbatim(cause.getMessage() + ".");
        }
        return Message.of("reformatDates.differsAt", e.getErrorIndex() + 1);
    }
}
