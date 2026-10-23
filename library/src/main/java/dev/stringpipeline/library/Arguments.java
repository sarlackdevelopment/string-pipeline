package dev.stringpipeline.library;

import java.util.Map;
import java.util.OptionalInt;

/// The checked, typed values of one step, as a transformation reads them (D44).
///
/// Only the pipeline creates them, after every value passed its parameter's checks. Reading a value therefore fails
/// only through a programming error, such as asking for a parameter the transformation did not declare.
public final class Arguments {

    private final Map<String, Object> values;

    Arguments(Map<String, Object> values) {
        this.values = Map.copyOf(values);
    }

    public String text(TextParameter parameter) {
        return value(parameter, String.class);
    }

    public int integer(IntegerParameter parameter) {
        return value(parameter, Integer.class);
    }

    /// The value of a number field that may stay empty.
    public OptionalInt optionalInteger(IntegerParameter parameter) {
        return values.get(parameter.name()) instanceof Integer value ? OptionalInt.of(value) : OptionalInt.empty();
    }

    public boolean bool(BooleanParameter parameter) {
        return value(parameter, Boolean.class);
    }

    public <E extends Enum<E> & ChoiceParameter.Option> E choice(ChoiceParameter<E> parameter) {
        return value(parameter, parameter.type());
    }

    private <T> T value(Parameter parameter, Class<T> type) {
        Object value = values.get(parameter.name());
        if (value == null) {
            throw new IllegalStateException("No value for parameter " + parameter.name());
        }
        return type.cast(value);
    }
}
