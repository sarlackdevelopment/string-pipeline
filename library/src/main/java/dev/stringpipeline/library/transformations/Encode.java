package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Arguments;
import dev.stringpipeline.library.Category;
import dev.stringpipeline.library.ChoiceParameter;
import dev.stringpipeline.library.Configuration;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.Transformation;
import dev.stringpipeline.library.TransformationInfo;
import java.util.List;

/// Encodes the text as Base64, for a URL, or as hexadecimal digits, from its UTF-8 bytes (D4, D10).
final class Encode implements Transformation {

    static final ChoiceParameter<Encoding> FORMAT = new ChoiceParameter<>(
            "format",
            "Format",
            "URL encoding writes a space as %20 and keeps only letters, digits and - . _ ~ as they are.",
            Encoding.class,
            Encoding.BASE64);

    private static final TransformationInfo INFO = new TransformationInfo(
            "encode",
            "Encode",
            "Encodes the text as Base64, for a URL, or as hexadecimal digits. The text is read as UTF-8.",
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
        return Configuration.ready((input, limits) -> format.encode(input, limits.maxOutputLength()));
    }
}
