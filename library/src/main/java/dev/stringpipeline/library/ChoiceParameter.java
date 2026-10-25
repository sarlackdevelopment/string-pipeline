package dev.stringpipeline.library;

import java.util.EnumSet;
import java.util.List;
import java.util.Optional;

/// A choice from a fixed list of options. An enum backs it, so a transformation switches over the choice
/// exhaustively instead of comparing strings.
///
/// @param type the enum whose constants are the options, in display order
/// @param defaultValue the option used when none is given
public record ChoiceParameter<E extends Enum<E> & ChoiceParameter.Option>(
        String name, Message title, Message description, Class<E> type, E defaultValue) implements Parameter {

    /// One option: the value in requests and the label shown to people.
    public interface Option {

        /// The value in requests, in lowerCamelCase, such as `all`.
        String value();

        /// The label, such as `All matches`.
        Message title();
    }

    public ChoiceParameter {
        Identifiers.requireLowerCamelCase(name, "Parameter name");
        for (E option : EnumSet.allOf(type)) {
            Identifiers.requireLowerCamelCase(option.value(), "Option value");
        }
    }

    /// The options in display order.
    public List<E> options() {
        return List.copyOf(EnumSet.allOf(type));
    }

    /// The option with the given request value, if there is one.
    public Optional<E> option(String value) {
        return options().stream().filter(option -> option.value().equals(value)).findFirst();
    }
}
