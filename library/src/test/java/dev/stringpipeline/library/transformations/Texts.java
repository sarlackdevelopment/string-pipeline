package dev.stringpipeline.library.transformations;

/// Texts that look like one character but are several UTF-16 units.
///
/// The formatter writes a Unicode escape as the character itself. That is safe for emoji, but an editor that
/// normalises to NFC would silently turn a written e with a combining accent into the single é, so combining marks are
/// built from their code points.
final class Texts {

    /// 👍🏽: thumbs up with a skin tone, 4 UTF-16 units.
    static final String THUMBS_UP = "👍🏽";

    /// 🇩🇪: a flag, two regional indicators, 4 UTF-16 units.
    static final String FLAG = "🇩🇪";

    /// é as one code point (NFC).
    static final String E_ACUTE = Character.toString(0x00E9);

    /// The combining acute accent, U+0301.
    static final String COMBINING_ACUTE = Character.toString(0x0301);

    /// The combining dot above, U+0307, which a Turkish İ leaves behind when it becomes small without a language.
    static final String COMBINING_DOT_ABOVE = Character.toString(0x0307);

    /// é as an e followed by a combining accent (NFD).
    static final String E_COMBINING_ACUTE = "e" + COMBINING_ACUTE;

    /// 👨‍👩‍👧: a family, three emoji joined by zero-width joiners.
    static final String FAMILY = "👨‍👩‍👧";

    private Texts() {}
}
