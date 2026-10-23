package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.StepResult;

/// Builds a step's output and stops growing it at the output cap, before the memory is spent (D45).
final class BoundedText {

    private final StringBuilder text = new StringBuilder();
    private final int maxLength;
    private boolean overflowed;

    BoundedText(int maxLength) {
        this.maxLength = maxLength;
    }

    void append(CharSequence part) {
        append(part, 0, part.length());
    }

    void append(CharSequence part, int start, int end) {
        if (overflowed) {
            return;
        }
        if ((long) text.length() + (end - start) > maxLength) {
            overflowed = true;
            return;
        }
        text.append(part, start, end);
    }

    boolean overflowed() {
        return overflowed;
    }

    StepResult.Outcome result() {
        return overflowed ? StepResult.Failed.outputTooLong(maxLength) : new StepResult.Executed(text.toString());
    }
}
