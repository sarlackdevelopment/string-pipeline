package dev.stringpipeline.library;

/// What the catalog shows about a transformation (D18).
///
/// @param id a stable lowerCamelCase identifier in the API, such as `regexReplace` (D40)
/// @param name the name shown to people
/// @param description one or two sentences on what the transformation does
/// @param category the group it belongs to in the picker
public record TransformationInfo(String id, Message name, Message description, Category category) {

    public TransformationInfo {
        Identifiers.requireLowerCamelCase(id, "Transformation id");
    }
}
