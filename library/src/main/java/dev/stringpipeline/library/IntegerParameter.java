package dev.stringpipeline.library;

import org.jspecify.annotations.Nullable;

/// A whole-number field.
///
/// @param defaultValue the value used when none is given, or `null` when the field may stay empty
/// @param minimum the smallest allowed value, or `null` for none
/// @param maximum the largest allowed value, or `null` for none
public record IntegerParameter(
        String name,
        String title,
        String description,
        @Nullable Integer defaultValue,
        @Nullable Integer minimum,
        @Nullable Integer maximum)
        implements Parameter {

    public IntegerParameter {
        Identifiers.requireLowerCamelCase(name, "Parameter name");
        int lowest = minimum != null ? minimum : Integer.MIN_VALUE;
        int highest = maximum != null ? maximum : Integer.MAX_VALUE;
        if (lowest > highest) {
            throw new IllegalArgumentException("Minimum " + lowest + " is above maximum " + highest);
        }
        if (defaultValue != null && (defaultValue < lowest || defaultValue > highest)) {
            throw new IllegalArgumentException("Default " + defaultValue + " is outside " + lowest + ".." + highest);
        }
    }

    /// A number that falls back to `defaultValue`.
    public static IntegerParameter withDefault(String name, String title, String description, int defaultValue) {
        return new IntegerParameter(name, title, description, defaultValue, null, null);
    }

    /// A number that may stay empty.
    public static IntegerParameter optional(String name, String title, String description) {
        return new IntegerParameter(name, title, description, null, null, null);
    }

    /// The same parameter with a lower bound.
    public IntegerParameter withMinimum(int minimum) {
        return new IntegerParameter(name, title, description, defaultValue, minimum, maximum);
    }
}
