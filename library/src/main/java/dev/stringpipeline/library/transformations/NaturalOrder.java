package dev.stringpipeline.library.transformations;

import java.text.CollationKey;
import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/// Sorts lines in the order people expect (D10). Text compares by the collation of `Locale.ROOT`, so é sorts next to
/// e and not after z, and a sits next to A; numbers compare by value, so file2 comes before file10.
final class NaturalOrder {

    private static final Pattern CHUNK = Pattern.compile("[0-9]+|[^0-9]+");

    // Each line is split into its chunks once, with their collation keys, before sorting compares anything.
    private static final Comparator<SortKey> ORDER = NaturalOrder::compare;

    private final Collator collator;

    /// @param ignoreCase whether a and A count as equal
    NaturalOrder(boolean ignoreCase) {
        collator = Collator.getInstance(Locale.ROOT);
        collator.setStrength(ignoreCase ? Collator.SECONDARY : Collator.TERTIARY);
    }

    /// The lines from first to last, or the other way round. Lines that count as equal keep their order.
    List<String> sort(List<String> lines, boolean descending) {
        return lines.stream()
                .map(this::sortKey)
                .sorted(descending ? ORDER.reversed() : ORDER)
                .map(SortKey::line)
                .toList();
    }

    private SortKey sortKey(String line) {
        List<Chunk> chunks = CHUNK.matcher(line)
                .results()
                .map(match -> new Chunk(match.group(), collator.getCollationKey(match.group())))
                .toList();
        return new SortKey(line, chunks);
    }

    private static int compare(SortKey left, SortKey right) {
        int shared = Math.min(left.chunks().size(), right.chunks().size());
        for (int index = 0; index < shared; index++) {
            Chunk leftChunk = left.chunks().get(index);
            Chunk rightChunk = right.chunks().get(index);
            int order = leftChunk.isNumber() && rightChunk.isNumber()
                    ? compareNumbers(leftChunk.text(), rightChunk.text())
                    : leftChunk.key().compareTo(rightChunk.key());
            if (order != 0) {
                return order;
            }
        }
        return Integer.compare(left.chunks().size(), right.chunks().size());
    }

    // By value, for numbers of any length: without leading zeros, the longer number is the larger one.
    private static int compareNumbers(String left, String right) {
        String leftDigits = withoutLeadingZeros(left);
        String rightDigits = withoutLeadingZeros(right);
        int order = Integer.compare(leftDigits.length(), rightDigits.length());
        return order != 0 ? order : leftDigits.compareTo(rightDigits);
    }

    private static String withoutLeadingZeros(String digits) {
        int start = 0;
        while (start < digits.length() - 1 && digits.charAt(start) == '0') {
            start++;
        }
        return digits.substring(start);
    }

    private record Chunk(String text, CollationKey key) {

        boolean isNumber() {
            return text.charAt(0) >= '0' && text.charAt(0) <= '9';
        }
    }

    private record SortKey(String line, List<Chunk> chunks) {}
}
