package dev.stringpipeline.library;

import java.util.regex.Pattern;

/// Checks the identifiers that appear in the API: transformation ids, parameter names, option values (D40).
final class Identifiers {

    private static final Pattern LOWER_CAMEL_CASE = Pattern.compile("[a-z][A-Za-z0-9]*");

    private Identifiers() {}

    static void requireLowerCamelCase(String value, String what) {
        if (!LOWER_CAMEL_CASE.matcher(value).matches()) {
            throw new IllegalArgumentException(what + " must be lowerCamelCase: " + value);
        }
    }
}
