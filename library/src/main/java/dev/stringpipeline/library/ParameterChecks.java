package dev.stringpipeline.library;

import dev.stringpipeline.library.ArgumentValue.BooleanValue;
import dev.stringpipeline.library.ArgumentValue.NumberValue;
import dev.stringpipeline.library.ArgumentValue.TextValue;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.jspecify.annotations.Nullable;

/// The first stage of a step: checks every raw value against its parameter, the same way for every transformation
/// (D43, D44).
///
/// A missing required value is a neutral "not configured"; a value that is present but wrong is an error (D42).
final class ParameterChecks {

    static final Message ENTER_A_VALUE = Message.of("check.enterValue");
    static final Message ENTER_TEXT = Message.of("check.enterText");
    static final Message ENTER_A_WHOLE_NUMBER = Message.of("check.enterWholeNumber");
    static final Message ENTER_TRUE_OR_FALSE = Message.of("check.enterTrueOrFalse");
    static final Message CHOOSE_AN_OPTION = Message.of("check.chooseOption");

    private static final BigDecimal INT_MIN = BigDecimal.valueOf(Integer.MIN_VALUE);
    private static final BigDecimal INT_MAX = BigDecimal.valueOf(Integer.MAX_VALUE);

    private ParameterChecks() {}

    /// The outcome for a whole step.
    sealed interface Result permits Valid, Problems {}

    /// Every value passed its check.
    record Valid(Arguments arguments) implements Result {}

    /// At least one value did not pass; `invalid` tells a wrong value apart from values that are only missing.
    record Problems(List<ParameterIssue> issues, boolean invalid) implements Result {}

    // The outcome for one parameter.
    private sealed interface Check permits Accepted, Absent, Missing, Rejected {}

    private record Accepted(Object value) implements Check {}

    private record Absent() implements Check {}

    private record Missing() implements Check {}

    private record Rejected(Message message) implements Check {}

    static Result check(List<Parameter> parameters, Map<String, ArgumentValue> raw, Limits limits) {
        var values = new HashMap<String, Object>();
        var issues = new ArrayList<ParameterIssue>();
        boolean invalid = false;
        for (Parameter parameter : parameters) {
            @Nullable ArgumentValue value = raw.get(parameter.name());
            Check check = switch (parameter) {
                case TextParameter text -> checkText(text, value, limits);
                case IntegerParameter integer -> checkInteger(integer, value);
                case BooleanParameter bool -> checkBoolean(bool, value);
                case ChoiceParameter<?> choice -> checkChoice(choice, value);
            };
            switch (check) {
                case Accepted(Object accepted) -> values.put(parameter.name(), accepted);
                case Absent() -> {}
                case Missing() -> issues.add(new ParameterIssue(parameter.name(), ENTER_A_VALUE));
                case Rejected(Message message) -> {
                    issues.add(new ParameterIssue(parameter.name(), message));
                    invalid = true;
                }
            }
        }
        return issues.isEmpty() ? new Valid(new Arguments(values)) : new Problems(List.copyOf(issues), invalid);
    }

    private static Check checkText(TextParameter parameter, @Nullable ArgumentValue value, Limits limits) {
        return switch (value) {
            case null -> {
                String defaultValue = parameter.defaultValue();
                yield defaultValue != null ? new Accepted(defaultValue) : new Missing();
            }
            case TextValue(String text) when text.isEmpty() && parameter.required() -> new Missing();
            case TextValue(String text)
            when text.length() > limits.maxTextParameterLength() ->
                new Rejected(Message.of("check.textTooLong", limits.maxTextParameterLength()));
            case TextValue(String text) -> new Accepted(text);
            case NumberValue _, BooleanValue _ -> new Rejected(ENTER_TEXT);
        };
    }

    private static Check checkInteger(IntegerParameter parameter, @Nullable ArgumentValue value) {
        return switch (value) {
            case null -> {
                Integer defaultValue = parameter.defaultValue();
                yield defaultValue != null ? new Accepted(defaultValue) : new Absent();
            }
            case NumberValue(BigDecimal number) -> checkWholeNumber(parameter, number);
            case TextValue _, BooleanValue _ -> new Rejected(ENTER_A_WHOLE_NUMBER);
        };
    }

    private static Check checkWholeNumber(IntegerParameter parameter, BigDecimal number) {
        if (number.signum() != 0 && number.stripTrailingZeros().scale() > 0) {
            return new Rejected(ENTER_A_WHOLE_NUMBER);
        }
        Integer minimum = parameter.minimum();
        Integer maximum = parameter.maximum();
        BigDecimal lowest = minimum != null ? BigDecimal.valueOf(minimum) : INT_MIN;
        BigDecimal highest = maximum != null ? BigDecimal.valueOf(maximum) : INT_MAX;
        if (number.compareTo(lowest) < 0 || number.compareTo(highest) > 0) {
            return new Rejected(outOfRange(parameter));
        }
        return new Accepted(number.intValueExact());
    }

    // "Enter 0 or more", "Enter 9 or less", or the full range when both or neither bound is set.
    private static Message outOfRange(IntegerParameter parameter) {
        Integer minimum = parameter.minimum();
        Integer maximum = parameter.maximum();
        if (minimum != null && maximum == null) {
            return Message.of("check.atLeast", minimum);
        }
        if (minimum == null && maximum != null) {
            return Message.of("check.atMost", maximum);
        }
        int lowest = minimum != null ? minimum : Integer.MIN_VALUE;
        int highest = maximum != null ? maximum : Integer.MAX_VALUE;
        return Message.of("check.between", lowest, highest);
    }

    private static Check checkBoolean(BooleanParameter parameter, @Nullable ArgumentValue value) {
        return switch (value) {
            case null -> new Accepted(parameter.defaultValue());
            case BooleanValue(boolean flag) -> new Accepted(flag);
            case TextValue _, NumberValue _ -> new Rejected(ENTER_TRUE_OR_FALSE);
        };
    }

    private static Check checkChoice(ChoiceParameter<?> parameter, @Nullable ArgumentValue value) {
        return switch (value) {
            case null -> new Accepted(parameter.defaultValue());
            case TextValue(String text) ->
                parameter.option(text).<Check>map(Accepted::new).orElseGet(() -> new Rejected(CHOOSE_AN_OPTION));
            case NumberValue _, BooleanValue _ -> new Rejected(CHOOSE_AN_OPTION);
        };
    }
}
