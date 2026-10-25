package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Message;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.MatchResult;
import java.util.regex.Pattern;

/// The replacement of Regex replace, parsed into text and group references (D8).
///
/// The syntax is that of `Matcher.appendReplacement`: `$n`, `${name}`, and `\` to take the next character literally.
/// Unlike Java, every group reference is checked against the pattern up front. Java reports a missing group only when
/// the text has a match, so "$5 off" would fail on some texts and pass silently on others.
record Replacement(List<Part> parts) {

    private static final Message DOLLAR_WITHOUT_GROUP = Message.of("replacement.dollarWithoutGroup");
    private static final Message GROUP_NAME_NEEDED = Message.of("replacement.groupNameNeeded");
    private static final Message TRAILING_BACKSLASH = Message.of("replacement.trailingBackslash");

    Replacement {
        parts = List.copyOf(parts);
    }

    /// A piece of the replacement.
    sealed interface Part permits Literal, GroupReference {}

    record Literal(String text) implements Part {}

    record GroupReference(int group) implements Part {}

    /// A parsed replacement, or what is wrong with it.
    sealed interface Parsing permits Parsed, NotParsed {}

    record Parsed(Replacement replacement) implements Parsing {}

    record NotParsed(Message message) implements Parsing {}

    static Parsing parse(String replacement, Pattern pattern) {
        int groupCount = pattern.matcher("").groupCount();
        Map<String, Integer> namedGroups = pattern.namedGroups();
        var parts = new ArrayList<Part>();
        var literal = new StringBuilder();
        int cursor = 0;
        while (cursor < replacement.length()) {
            char next = replacement.charAt(cursor);
            if (next == '\\') {
                if (cursor + 1 == replacement.length()) {
                    return new NotParsed(TRAILING_BACKSLASH);
                }
                literal.append(replacement.charAt(cursor + 1));
                cursor += 2;
                continue;
            }
            if (next != '$') {
                literal.append(next);
                cursor++;
                continue;
            }
            cursor++;
            if (cursor == replacement.length()) {
                return new NotParsed(DOLLAR_WITHOUT_GROUP);
            }
            char first = replacement.charAt(cursor);
            int group;
            if (first == '{') {
                int nameEnd = cursor + 1;
                while (nameEnd < replacement.length() && isAsciiLetterOrDigit(replacement.charAt(nameEnd))) {
                    nameEnd++;
                }
                String name = replacement.substring(cursor + 1, nameEnd);
                if (name.isEmpty() || nameEnd == replacement.length() || replacement.charAt(nameEnd) != '}') {
                    return new NotParsed(GROUP_NAME_NEEDED);
                }
                Integer named = namedGroups.get(name);
                if (named == null) {
                    return new NotParsed(Message.of("replacement.noGroupNamed", name));
                }
                group = named;
                cursor = nameEnd + 1;
            } else if (isAsciiDigit(first)) {
                // Like Java, read further digits only while the number is still a group of the pattern: with fewer
                // than 12 groups, "$12" is group 1 followed by the text "2".
                group = first - '0';
                cursor++;
                while (cursor < replacement.length() && isAsciiDigit(replacement.charAt(cursor))) {
                    int longer = group * 10 + (replacement.charAt(cursor) - '0');
                    if (longer > groupCount) {
                        break;
                    }
                    group = longer;
                    cursor++;
                }
                if (group > groupCount) {
                    return new NotParsed(Message.of("replacement.noGroup", group));
                }
            } else {
                return new NotParsed(DOLLAR_WITHOUT_GROUP);
            }
            if (!literal.isEmpty()) {
                parts.add(new Literal(literal.toString()));
                literal.setLength(0);
            }
            parts.add(new GroupReference(group));
        }
        if (!literal.isEmpty()) {
            parts.add(new Literal(literal.toString()));
        }
        return new Parsed(new Replacement(parts));
    }

    /// Appends the replacement for `match`, a match in `input`. A group that did not take part adds nothing.
    void appendTo(BoundedText output, MatchResult match, String input) {
        for (Part part : parts) {
            switch (part) {
                case Literal(String text) -> output.append(text);
                case GroupReference(int group) -> {
                    int start = match.start(group);
                    if (start >= 0) {
                        output.append(input, start, match.end(group));
                    }
                }
            }
        }
    }

    // Java reads group names and numbers in ASCII only.
    private static boolean isAsciiDigit(char c) {
        return c >= '0' && c <= '9';
    }

    private static boolean isAsciiLetterOrDigit(char c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || isAsciiDigit(c);
    }
}
