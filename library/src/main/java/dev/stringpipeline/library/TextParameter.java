package dev.stringpipeline.library;

import org.jspecify.annotations.Nullable;

/// A text field. It either needs a non-empty value or falls back to a default. Values are never trimmed.
///
/// @param defaultValue the value used when none is given, or `null` when a value is required
public record TextParameter(
        String name,
        String title,
        String description,
        @Nullable String defaultValue) implements Parameter {

    public TextParameter {
        Identifiers.requireLowerCamelCase(name, "Parameter name");
    }

    /// A text that must not be empty.
    public static TextParameter required(String name, String title, String description) {
        return new TextParameter(name, title, description, null);
    }

    /// A text that falls back to `defaultValue`.
    public static TextParameter withDefault(String name, String title, String description, String defaultValue) {
        return new TextParameter(name, title, description, defaultValue);
    }

    /// Whether the step needs a non-empty value before it can run.
    public boolean required() {
        return defaultValue == null;
    }
}
