package dev.stringpipeline.library;

/// The groups of the transformation picker, in display order (D28, D40).
public enum Category {
    TEXT("text", "Text"),
    REGEX("regex", "Regular expressions");

    private final String id;
    private final String displayName;

    Category(String id, String displayName) {
        this.id = id;
        this.displayName = displayName;
    }

    /// The identifier in the API, such as `text`.
    public String id() {
        return id;
    }

    /// The name shown to people, such as `Text`.
    public String displayName() {
        return displayName;
    }
}
