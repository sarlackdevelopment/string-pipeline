package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Message;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.StepResult;
import dev.stringpipeline.library.TextParameter;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.util.List;

/// Replaces every occurrence of a text, literally and case-sensitively, like Python's `str.replace` in the brief
/// (R1.1, D5).
final class Replace implements Transformation {

    static final TextParameter OLD =
            TextParameter.required("old", Message.of("replace.old.title"), Message.of("replace.old.description"));

    static final TextParameter NEW = TextParameter.withDefault(
            "new", Message.of("replace.new.title"), Message.of("replace.new.description"), "");

    private static final TransformationInfo INFO = new TransformationInfo(
            "replace", Message.of("replace.name"), Message.of("replace.description"), Category.TEXT);

    @Override
    public TransformationInfo info() {
        return INFO;
    }

    @Override
    public List<Parameter> parameters() {
        return List.of(OLD, NEW);
    }

    @Override
    public Configuration configure(Arguments arguments) {
        String target = arguments.text(OLD);
        String replacement = arguments.text(NEW);
        return Configuration.ready((input, limits) -> replaceAll(input, target, replacement, limits));
    }

    // Left to right, without overlaps; `$` and `\` are plain characters. Stops at the output cap (D45).
    private static StepResult.Outcome replaceAll(String input, String target, String replacement, Limits limits) {
        var output = new BoundedText(limits.maxOutputLength());
        int from = 0;
        for (int at = input.indexOf(target); at >= 0 && !output.overflowed(); at = input.indexOf(target, from)) {
            output.append(input, from, at);
            output.append(replacement);
            from = at + target.length();
        }
        output.append(input, from, input.length());
        return output.result();
    }
}
