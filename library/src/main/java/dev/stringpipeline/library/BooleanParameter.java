package dev.stringpipeline.library;

/// A checkbox.
public record BooleanParameter(String name, Message title, Message description, boolean defaultValue)
        implements Parameter {

    public BooleanParameter {
        Identifiers.requireLowerCamelCase(name, "Parameter name");
    }
}
