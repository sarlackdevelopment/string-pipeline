package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.IntegerParameter;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.util.List;
import java.util.OptionalInt;

/// Keeps part of the text like a Python slice, counting characters as a person sees them (R1.1, D6, D7).
final class Substring implements Transformation {

    static final IntegerParameter START = IntegerParameter.withDefault(
            "start",
            "Start",
            "Position of the first character to keep, counting from 0. Negative numbers count from the end: -1 is"
                    + " the last character.",
            0);

    static final IntegerParameter END = IntegerParameter.optional(
            "end",
            "End",
            "Position of the first character to leave out. Leave empty to keep everything up to the end.");

    private static final TransformationInfo INFO = new TransformationInfo(
            "substring",
            "Substring",
            "Keeps part of the text, counting characters as you see them. Works like a Python slice:"
                    + " text[start:end].",
            Category.TEXT);

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
