package dev.stringpipeline.library;

import java.util.List;

/// A text for people, in no particular language yet (D52). The library returns messages as data; the caller renders
/// them in the language of its reader with [Messages#render].
public sealed interface Message {

    /// A text from the library's message bundles, with the values for its placeholders, such as a count or a pattern.
    /// A value may be a message itself, which is rendered in the same language.
    record Keyed(String key, List<Object> arguments) implements Message {

        public Keyed {
            arguments = List.copyOf(arguments);
        }
    }

    /// A text that reads the same in every language, such as a message of Java's that the library does not translate.
    record Verbatim(String text) implements Message {}

    static Message of(String key, Object... arguments) {
        return new Keyed(key, List.of(arguments));
    }

    static Message verbatim(String text) {
        return new Verbatim(text);
    }
}
