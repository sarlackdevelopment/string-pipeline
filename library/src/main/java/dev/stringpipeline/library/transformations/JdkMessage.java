package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.Message;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.IntStream;

/// One of Java's own messages that the library translates (D52), such as "Unclosed group" for a regex.
///
/// Java writes these messages in English only. The library translates the ones people run into while typing a pattern
/// and shows any other as Java wrote it.
///
/// @param wording Java's English wording as a regular expression; its groups are the values of the translation, such
///     as the character in "Dangling meta character '*'"
/// @param key the translation in the message bundles
record JdkMessage(Pattern wording, String key) {

    JdkMessage(String wording, String key) {
        this(Pattern.compile(wording), key);
    }

    /// `text` translated by the first of `known` whose wording matches all of it, or `text` as Java wrote it.
    static Message translate(String text, List<JdkMessage> known) {
        for (JdkMessage message : known) {
            Matcher matcher = message.wording.matcher(text);
            if (matcher.matches()) {
                return Message.of(
                        message.key,
                        IntStream.rangeClosed(1, matcher.groupCount())
                                .mapToObj(matcher::group)
                                .toArray());
            }
        }
        return Message.verbatim(text);
    }
}
