package dev.stringpipeline.library.transformations;

/// The text a regex searches, wrapped so the search stops at a deadline (D21).
///
/// Java's regex engine cannot be interrupted, but it reads the text through [#charAt(int)]. Checking the clock there
/// stops a catastrophically backtracking pattern within moments of the deadline.
final class TimeLimitedText implements CharSequence {

    // Reading the clock on every character would slow down every regex; every 1,024 reads is often enough.
    private static final int READS_PER_CHECK = 1 << 10;

    private final CharSequence text;
    private final long deadlineNanos;
    private int reads;

    TimeLimitedText(CharSequence text, long deadlineNanos) {
        this.text = text;
        this.deadlineNanos = deadlineNanos;
    }

    @Override
    public char charAt(int index) {
        if (++reads % READS_PER_CHECK == 0 && System.nanoTime() - deadlineNanos > 0) {
            throw new TimeLimitExceeded();
        }
        return text.charAt(index);
    }

    @Override
    public int length() {
        return text.length();
    }

    @Override
    public CharSequence subSequence(int start, int end) {
        return new TimeLimitedText(text.subSequence(start, end), deadlineNanos);
    }

    @Override
    public String toString() {
        return text.toString();
    }

    /// Abandons a search from inside the regex engine. The transformation catches it and returns a failed step.
    static final class TimeLimitExceeded extends RuntimeException {

        private static final long serialVersionUID = 1L;

        TimeLimitExceeded() {
            // No stack trace: it is control flow, not a bug report.
            super("The regex time limit was exceeded", null, false, false);
        }
    }
}
