package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.IntegerParameter;
import dev.stringpipeline.library.Message;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.util.List;
import java.util.OptionalInt;

/// Keeps part of the text like a Python slice, counting characters as a person sees them (R1.1, D6, D7).
final class Substring implements Transformation {

    static final IntegerParameter START = IntegerParameter.withDefault(
            "start", Message.of("substring.start.title"), Message.of("substring.start.description"), 0);

    static final IntegerParameter END = IntegerParameter.optional(
            "end", Message.of("substring.end.title"), Message.of("substring.end.description"));

    private static final TransformationInfo INFO = new TransformationInfo(
            "substring", Message.of("substring.name"), Message.of("substring.description"), Category.TEXT);

    @Override
    public TransformationInfo info() {
        return INFO;
    }

    @Override
    public List<Parameter> parameters() {
        return List.of(START, END);
    }

    @Override
    public Configuration configure(Arguments arguments) {
        int start = arguments.integer(START);
        OptionalInt end = arguments.optionalInteger(END);
        // The output is never longer than the input, so no cap to check.
        return Configuration.ready((input, _) -> new StepResult.Executed(Graphemes.slice(input, start, end)));
    }
}
