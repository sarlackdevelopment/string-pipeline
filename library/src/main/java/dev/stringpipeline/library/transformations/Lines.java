package dev.stringpipeline.library.transformations;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/// A text as lines, the list format of D3. It splits at `\r\n`, `\r` and `\n` and joins with `\n`. A line break at
/// the very end closes the last line instead of starting an empty one, and the joined text ends with one again.
///
/// @param lines the lines without their line breaks
/// @param endsWithLineBreak whether the text ended with a line break
record Lines(List<String> lines, boolean endsWithLineBreak) {

    private static final Pattern LINE_BREAK = Pattern.compile("\r\n|\r|\n");

    Lines {
        lines = List.copyOf(lines);
    }

    static Lines of(String text) {
        if (text.isEmpty()) {
            return new Lines(List.of(), false);
        }
        List<String> parts = new ArrayList<>(List.of(LINE_BREAK.split(text, -1)));
        boolean endsWithLineBreak = parts.size() > 1 && parts.getLast().isEmpty();
        if (endsWithLineBreak) {
            parts.removeLast();
        }
        return new Lines(parts, endsWithLineBreak);
    }

    /// The same text with other lines, such as the sorted ones.
    Lines with(List<String> otherLines) {
        return new Lines(otherLines, endsWithLineBreak);
    }

    /// The lines joined with `\n`; no lines give empty text.
    String text() {
        if (lines.isEmpty()) {
            return "";
        }
        String joined = String.join("\n", lines);
        return endsWithLineBreak ? joined + "\n" : joined;
    }
}
