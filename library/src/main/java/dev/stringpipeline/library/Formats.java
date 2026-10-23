package dev.stringpipeline.library;

import java.util.Locale;

/// Number formatting for messages, independent of the server's locale.
final class Formats {

    private Formats() {}

    /// A count with thousands separators, such as `10,000`.
    static String count(long number) {
        return String.format(Locale.ROOT, "%,d", number);
    }
}
