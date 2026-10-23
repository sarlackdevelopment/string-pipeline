package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.TextParameter;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.util.List;

/// Adds text to the beginning (R1.1).
final class Prepend implements Transformation {

    static final TextParameter TEXT =
            TextParameter.withDefault("text", "Text", "Added before the first character. Spaces are kept.", "");

    private static final TransformationInfo INFO =
            new TransformationInfo("prepend", "Prepend", "Adds text to the beginning.", Category.TEXT);

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
        String prefix = arguments.text(TEXT);
        return Configuration.ready((input, limits) -> {
            var output = new BoundedText(limits.maxOutputLength());
            output.append(prefix);
            output.append(input);
            return output.result();
        });
    }
}
