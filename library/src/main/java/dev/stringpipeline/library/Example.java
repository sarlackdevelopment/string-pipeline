package dev.stringpipeline.library;

import java.util.List;

/// A ready-made chain to start from (D50): an input, and steps that turn it into something worth seeing.
///
/// @param id a stable lowerCamelCase identifier in the API, such as `titleToSlug` (D40)
/// @param name the name shown to people
/// @param input the text the chain starts from
/// @param steps at least one step, in order
public record Example(String id, String name, String input, List<Step> steps) {

    public Example {
        Identifiers.requireLowerCamelCase(id, "Example id");
        steps = List.copyOf(steps);
        if (steps.isEmpty()) {
            throw new IllegalArgumentException("Example " + id + " has no steps");
        }
    }
}
