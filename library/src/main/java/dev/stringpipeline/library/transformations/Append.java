package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.TextParameter;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.util.List;

/// Adds text to the end (R1.1).
final class Append implements Transformation {

    static final TextParameter TEXT =
            TextParameter.withDefault("text", "Text", "Added after the last character. Spaces are kept.", "");

    private static final TransformationInfo INFO =
            new TransformationInfo("append", "Append", "Adds text to the end.", Category.TEXT);

    @Override
    public TransformationInfo info() {
        return INFO;
    }

    @Override
    public List<Parameter> parameters() {
        return List.of(TEXT);
    }

    @Override
    public Configuration configure(Arguments arguments) {
        String suffix = arguments.text(TEXT);
        return Configuration.ready((input, limits) -> {
            var output = new BoundedText(limits.maxOutputLength());
            output.append(input);
            output.append(suffix);
            return output.result();
        });
    }
}
