package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.ChoiceParameter;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.util.List;

/// Decodes Base64, URL encoding or hexadecimal digits back into text (D4, D10). A text that is not in the chosen
/// format, or whose bytes are not UTF-8, makes the step fail with the reason.
final class Decode implements Transformation {

    static final ChoiceParameter<Encoding> FORMAT = new ChoiceParameter<>(
            "format",
            "Format",
            "Spaces and line breaks in Base64 and hexadecimal are ignored. In URL encoding, + stays a +.",
            Encoding.class,
            Encoding.BASE64);

    private static final TransformationInfo INFO = new TransformationInfo(
            "decode",
            "Decode",
            "Decodes Base64, URL encoding or hexadecimal digits back into text. The bytes must be UTF-8.",
            Category.CONVERSIONS);

    @Override
    public TransformationInfo info() {
        return INFO;
    }

    @Override
    public List<Parameter> parameters() {
        return List.of(FORMAT);
    }

    @Override
    public Configuration configure(Arguments arguments) {
        Encoding format = arguments.choice(FORMAT);
        return Configuration.ready((input, _) -> format.decode(input));
    }
}
