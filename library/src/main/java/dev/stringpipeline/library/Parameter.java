package dev.stringpipeline.library;

/// A setting of a transformation, shown as one form field (R2.1, D43).
///
/// The web layer turns each kind into a small JSON Schema. The pipeline uses it to check a raw value and turn it into a
/// typed one before the transformation sees it (D44).
public sealed interface Parameter permits TextParameter, IntegerParameter, BooleanParameter, ChoiceParameter {

    /// The key in a request, in lowerCamelCase, such as `old`.
    String name();

    /// The field label, such as `Find`.
    Message title();

    /// The help text under the field.
    Message description();
}
