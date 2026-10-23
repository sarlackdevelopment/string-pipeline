package dev.stringpipeline.library;

import java.time.Duration;

/// Size and time caps that keep one request from exhausting the server (D21, D45).
///
/// Lengths count UTF-16 code units, like `String.length()` in Java and `length` in JavaScript.
///
/// @param maxInputLength the longest input text
/// @param maxSteps the most steps in one chain
/// @param maxTextParameterLength the longest value of a text parameter
/// @param maxOutputLength the longest output of one step
/// @param maxTotalOutputLength the most output all steps of one run may produce together, which bounds the response
/// @param regexTimeout how long one regex may search one text
public record Limits(
        int maxInputLength,
        int maxSteps,
        int maxTextParameterLength,
        int maxOutputLength,
        long maxTotalOutputLength,
        Duration regexTimeout) {

    /// The limits in production.
    public static final Limits DEFAULT = new Limits(100_000, 50, 10_000, 1_000_000, 10_000_000, Duration.ofSeconds(2));

    public Limits {
        if (maxInputLength <= 0
                || maxSteps <= 0
                || maxTextParameterLength <= 0
                || maxOutputLength <= 0
                || maxTotalOutputLength <= 0
                || !regexTimeout.isPositive()) {
            throw new IllegalArgumentException("Every limit must be positive");
        }
    }

    public Limits withMaxOutputLength(int length) {
        return new Limits(maxInputLength, maxSteps, maxTextParameterLength, length, maxTotalOutputLength, regexTimeout);
    }

    public Limits withMaxTotalOutputLength(long length) {
        return new Limits(maxInputLength, maxSteps, maxTextParameterLength, maxOutputLength, length, regexTimeout);
    }

    public Limits withRegexTimeout(Duration timeout) {
        return new Limits(
                maxInputLength, maxSteps, maxTextParameterLength, maxOutputLength, maxTotalOutputLength, timeout);
    }
}
