package dev.stringpipeline.library;

/// A checkbox.
public record BooleanParameter(String name, String title, String description, boolean defaultValue)
        implements Parameter {

    public BooleanParameter {
        Identifiers.requireLowerCamelCase(name, "Parameter name");
    }
}
