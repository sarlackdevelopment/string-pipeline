package dev.stringpipeline.server.api;

/// A problem with the request itself, located by a JSON pointer in the URI-fragment form of RFC 9457's example (D41).
///
/// @param pointer where the problem is, such as `#/steps/0/transformation`
/// @param detail what is wrong
record RequestError(String pointer, String detail) {

    /// A pointer from path segments such as `steps`, `0` and `id`, with `~` and `/` escaped as RFC 6901 requires.
    static String pointer(Object... segments) {
        var pointer = new StringBuilder("#");
        for (Object segment : segments) {
            pointer.append('/').append(segment.toString().replace("~", "~0").replace("/", "~1"));
        }
        return pointer.toString();
    }
}
