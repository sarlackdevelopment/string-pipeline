package dev.stringpipeline.library.transformations;

import dev.stringpipeline.library.ChoiceParameter;
import dev.stringpipeline.library.Message;
import dev.stringpipeline.library.StepResult;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HexFormat;
import java.util.regex.Pattern;

/// The formats of Encode and Decode (D4). A text is always encoded as its UTF-8 bytes, and decoding must give valid
/// UTF-8 again.
enum Encoding implements ChoiceParameter.Option {
    BASE64("base64"),
    BASE64_URL("base64Url"),
    URL("url"),
    HEX("hex");

    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final HexFormat HEX_DIGITS = HexFormat.of();
    private static final HexFormat UPPER_HEX_DIGITS = HexFormat.of().withUpperCase();

    private final String value;

    Encoding(String value) {
        this.value = value;
    }

    @Override
    public String value() {
        return value;
    }

    @Override
    public Message title() {
        return Message.of("options.encoding." + value);
    }

    /// The encoded text, or a failure when it would be longer than `maxLength` characters (D45).
    StepResult.Outcome encode(String text, int maxLength) {
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        long length = encodedLength(bytes);
        if (length > maxLength) {
            return StepResult.Failed.outputTooLong(maxLength);
        }
        String encoded = switch (this) {
            case BASE64 -> Base64.getEncoder().encodeToString(bytes);
            case BASE64_URL -> Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            case URL -> percentEncode(bytes);
            case HEX -> HEX_DIGITS.formatHex(bytes);
        };
        return new StepResult.Executed(encoded);
    }

    /// The decoded text, or why the text is not in this format. Decoding never makes a text longer.
    StepResult.Outcome decode(String text) {
        return switch (this) {
            case BASE64 -> decodeBase64(text, "+/", Base64.getDecoder());
            case BASE64_URL -> decodeBase64(text, "-_", Base64.getUrlDecoder());
            case URL -> percentDecode(text);
            case HEX -> decodeHex(text);
        };
    }

    private long encodedLength(byte[] bytes) {
        long count = bytes.length;
        return switch (this) {
            case BASE64 -> (count + 2) / 3 * 4;
            case BASE64_URL -> (count * 4 + 2) / 3;
            case URL -> {
                long length = 0;
                for (byte b : bytes) {
                    length += isUnreserved(b) ? 1 : 3;
                }
                yield length;
            }
            case HEX -> count * 2;
        };
    }

    // RFC 3986: only letters, digits and - . _ ~ stay as they are; a space becomes %20, not +.
    private static boolean isUnreserved(byte b) {
        return (b >= 'A' && b <= 'Z')
                || (b >= 'a' && b <= 'z')
                || (b >= '0' && b <= '9')
                || b == '-'
                || b == '.'
                || b == '_'
                || b == '~';
    }

    private static String percentEncode(byte[] bytes) {
        var encoded = new StringBuilder(bytes.length);
        for (byte b : bytes) {
            if (isUnreserved(b)) {
                encoded.append((char) b);
            } else {
                encoded.append('%').append(UPPER_HEX_DIGITS.toHexDigits(b));
            }
        }
        return encoded.toString();
    }

    // Spaces and line breaks are ignored, as in Base64 that was wrapped for an e-mail.
    private static StepResult.Outcome decodeBase64(String text, String specialCharacters, Base64.Decoder decoder) {
        String compact = WHITESPACE.matcher(text).replaceAll("");
        for (int index = 0; index < compact.length(); index++) {
            char character = compact.charAt(index);
            boolean allowed = (character >= 'A' && character <= 'Z')
                    || (character >= 'a' && character <= 'z')
                    || (character >= '0' && character <= '9')
                    || specialCharacters.indexOf(character) >= 0
                    || character == '=';
            if (!allowed) {
                return failed("encoding.notBase64Character", character);
            }
        }
        try {
            return utf8(decoder.decode(compact));
        } catch (IllegalArgumentException _) {
            return failed("encoding.base64EndsEarly");
        }
    }

    private static StepResult.Outcome decodeHex(String text) {
        String compact = WHITESPACE.matcher(text).replaceAll("");
        for (int index = 0; index < compact.length(); index++) {
            if (Character.digit(compact.charAt(index), 16) < 0) {
                return failed("encoding.notHexDigit", compact.charAt(index));
            }
        }
        if (compact.length() % 2 != 0) {
            return failed("encoding.hexDigitMissing");
        }
        return utf8(HEX_DIGITS.parseHex(compact));
    }

    // Characters other than % stay as they are, so a half-encoded address decodes too. A + stays a +.
    private static StepResult.Outcome percentDecode(String text) {
        var bytes = new ByteArrayOutputStream(text.length());
        for (int index = 0; index < text.length(); ) {
            char character = text.charAt(index);
            if (character != '%') {
                int end = index + Character.charCount(text.codePointAt(index));
                bytes.writeBytes(text.substring(index, end).getBytes(StandardCharsets.UTF_8));
                index = end;
                continue;
            }
            if (index + 2 >= text.length()
                    || Character.digit(text.charAt(index + 1), 16) < 0
                    || Character.digit(text.charAt(index + 2), 16) < 0) {
                return failed("encoding.percentNotFollowed", index + 1);
            }
            bytes.write(HexFormat.fromHexDigits(text, index + 1, index + 3));
            index += 3;
        }
        return utf8(bytes.toByteArray());
    }

    private static StepResult.Outcome utf8(byte[] bytes) {
        try {
            String text = StandardCharsets.UTF_8
                    .newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes))
                    .toString();
            return new StepResult.Executed(text);
        } catch (CharacterCodingException _) {
            return failed("encoding.notUtf8");
        }
    }

    private static StepResult.Failed failed(String key, Object... arguments) {
        return new StepResult.Failed(Message.of(key, arguments));
    }
}
