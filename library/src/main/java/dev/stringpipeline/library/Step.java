package dev.stringpipeline.library;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/// One use of a transformation in a chain, with its raw values (R1.2).
///
/// @param arguments the values by parameter name; a parameter without an entry has no value
public record Step(Transformation transformation, Map<String, ArgumentValue> arguments) {

    /// Checks that every value belongs to a parameter of the transformation.
    ///
    /// @throws IllegalArgumentException for a name the transformation does not declare. The web layer reports such
    ///     names as request errors before it builds a step (D41).
    public Step {
        arguments = Map.copyOf(arguments);
        Set<String> known =
                transformation.parameters().stream().map(Parameter::name).collect(Collectors.toSet());
        for (String name : arguments.keySet()) {
            if (!known.contains(name)) {
                throw new IllegalArgumentException("Unknown parameter " + name + " for "
                        + transformation.info().id());
            }
        }
    }
}
