package dev.stringpipeline.library;

/// The groups of the transformation picker, in display order (D28, D40).
public enum Category {
    TEXT("text"),
    LINES("lines"),
    CONVERSIONS("conversions"),
    REGEX("regex");

    private final String id;

    Category(String id) {
        this.id = id;
    }

    /// The identifier in the API, such as `text`.
    public String id() {
        return id;
    }

    /// The name shown to people, such as `Text`.
    public Message displayName() {
        return Message.of("category." + id);
    }
}
