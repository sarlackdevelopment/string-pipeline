package dev.stringpipeline.library.transformations;

import java.text.BreakIterator;
import java.util.Locale;
import java.util.OptionalInt;
import java.util.stream.IntStream;

/// Splits text into grapheme clusters: what a person sees as one character (D7).
///
/// `BreakIterator` follows Unicode's extended grapheme clusters since Java 20, so 👍🏽, 🇩🇪 and an e with a combining
/// accent each count as one character, while Java's `substring` would cut them apart.
final class Graphemes {

    private Graphemes() {}

    /// The offsets where characters start, followed by the text's length: `n + 1` offsets for `n` characters.
    static int[] boundaries(String text) {
        BreakIterator iterator = BreakIterator.getCharacterInstance(Locale.ROOT);
        iterator.setText(text);
        IntStream.Builder boundaries = IntStream.builder();
        for (int boundary = iterator.first(); boundary != BreakIterator.DONE; boundary = iterator.next()) {
            boundaries.accept(boundary);
        }
        return boundaries.build().toArray();
    }

    /// `text[start:end]` as in Python, counted in characters as a person sees them. Indices clamp to the text (D6).
    static String slice(String text, int start, OptionalInt end) {
        int[] boundaries = boundaries(text);
        int count = boundaries.length - 1;
        int from = clamp(start, count);
        int to = end.isPresent() ? clamp(end.getAsInt(), count) : count;
        return from >= to ? "" : text.substring(boundaries[from], boundaries[to]);
    }

    // A negative index counts from the end; an index outside the text moves to its nearest end.
    private static int clamp(int index, int count) {
        return index < 0 ? Math.max(0, count + index) : Math.min(index, count);
    }
}
