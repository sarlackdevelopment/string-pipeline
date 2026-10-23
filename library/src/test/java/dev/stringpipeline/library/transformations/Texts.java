package dev.stringpipeline.library.transformations;

/// Texts that look like one character but are several UTF-16 units, written as escapes so no editor can change them.
final class Texts {

    /// 👍🏽: thumbs up with a skin tone, 4 UTF-16 units.
    static final String THUMBS_UP = "👍🏽";

    /// 🇩🇪: a flag, two regional indicators, 4 UTF-16 units.
    static final String FLAG = "🇩🇪";

    /// é as one code point (NFC).
    static final String E_ACUTE = "é";

    /// é as an e followed by a combining accent (NFD).
    static final String E_COMBINING_ACUTE = "é";

    /// 👨‍👩‍👧: a family, three emoji joined by zero-width joiners.
    static final String FAMILY = "👨‍👩‍👧";

    private Texts() {}
}
