package dev.stringpipeline.library;

import java.math.BigDecimal;

/// A raw parameter value as a caller passes it in (D44).
///
/// The library's own small value type, so it never sees JSON: the web layer maps JSON strings, numbers and booleans to
/// these records, and the pipeline checks them against each [Parameter].
public sealed interface ArgumentValue {

    /// A text.
    record TextValue(String value) implements ArgumentValue {}

    /// A number exactly as given; whether it is a whole number is checked later.
    record NumberValue(BigDecimal value) implements ArgumentValue {}

    /// A yes or a no.
    record BooleanValue(boolean value) implements ArgumentValue {}

    static ArgumentValue text(String value) {
        return new TextValue(value);
    }

    static ArgumentValue number(long value) {
        return new NumberValue(BigDecimal.valueOf(value));
    }

    static ArgumentValue number(BigDecimal value) {
        return new NumberValue(value);
    }

    static ArgumentValue bool(boolean value) {
        return new BooleanValue(value);
    }
}
