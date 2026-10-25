package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.BooleanParameter;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.ChoiceParameter;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.Message;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.text.Collator;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/// Sorts the lines, removes duplicate or blank ones, or reverses their order (D3, D10). Lines may end with `\r\n`,
/// `\r` or `\n`; the output uses `\n`.
final class LineOperations implements Transformation {

    /// What to do with the lines.
    enum Operation implements ChoiceParameter.Option {
        SORT("sort"),
        SORT_DESCENDING("sortDescending"),
        UNIQUE("unique"),
        REMOVE_BLANK("removeBlank"),
        REVERSE("reverse");

        private final String value;

        Operation(String value) {
            this.value = value;
        }

        @Override
        public String value() {
            return value;
        }

        @Override
        public Message title() {
            return Message.of("options.operation." + value);
        }
    }

    static final ChoiceParameter<Operation> OPERATION = new ChoiceParameter<>(
            "operation",
            Message.of("lineOperations.operation.title"),
            Message.of("lineOperations.operation.description"),
            Operation.class,
            Operation.SORT);

    static final BooleanParameter IGNORE_CASE = new BooleanParameter(
            "ignoreCase",
            Message.of("lineOperations.ignoreCase.title"),
            Message.of("lineOperations.ignoreCase.description"),
            false);

    private static final TransformationInfo INFO = new TransformationInfo(
            "lineOperations",
            Message.of("lineOperations.name"),
            Message.of("lineOperations.description"),
            Category.LINES);

    @Override
    public TransformationInfo info() {
        return INFO;
    }

    @Override
    public List<Parameter> parameters() {
        return List.of(OPERATION, IGNORE_CASE);
    }

    @Override
    public Configuration configure(Arguments arguments) {
        Operation operation = arguments.choice(OPERATION);
        boolean ignoreCase = arguments.bool(IGNORE_CASE);
        // The output has at most the lines of the input, so no cap to check.
        return Configuration.ready((input, _) -> {
            Lines lines = Lines.of(input);
            return new StepResult.Executed(
                    lines.with(apply(operation, ignoreCase, lines.lines())).text());
        });
    }

    private static List<String> apply(Operation operation, boolean ignoreCase, List<String> lines) {
        return switch (operation) {
            case SORT -> new NaturalOrder(ignoreCase).sort(lines, false);
            case SORT_DESCENDING -> new NaturalOrder(ignoreCase).sort(lines, true);
            case UNIQUE -> unique(lines, ignoreCase);
            case REMOVE_BLANK -> lines.stream().filter(line -> !line.isBlank()).toList();
            case REVERSE -> lines.reversed();
        };
    }

    // Exact copies only, unless case is ignored: then lines that differ only in case count as copies, and so do ß and
    // SS. Unlike sorting, 02 and 2 stay different.
    private static List<String> unique(List<String> lines, boolean ignoreCase) {
        Collator collator = Collator.getInstance(Locale.ROOT);
        collator.setStrength(Collator.SECONDARY);
        Set<Object> seen = new HashSet<>();
        List<String> kept = new ArrayList<>();
        for (String line : lines) {
            if (seen.add(ignoreCase ? collator.getCollationKey(line) : line)) {
                kept.add(line);
            }
        }
        return kept;
    }
}
