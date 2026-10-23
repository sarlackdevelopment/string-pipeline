package dev.stringpipeline.server.api;

import dev.stringpipeline.library.BooleanParameter;
import dev.stringpipeline.library.ChoiceParameter;
import dev.stringpipeline.library.IntegerParameter;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Parameter;
import dev.stringpipeline.library.TextParameter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.jspecify.annotations.Nullable;

/// Turns the library's parameter kinds into the JSON Schema subset of the design (R2.1, D18, D43).
///
/// The schemas are ordered maps rather than Jackson nodes: properties keep their display order, and the OpenAPI
/// document shows the field as a plain JSON object.
final class ParameterSchemas {

    private ParameterSchemas() {}

    static Map<String, Object> of(List<Parameter> parameters, Limits limits) {
        var properties = new LinkedHashMap<String, Object>();
        var required = new ArrayList<String>();
        for (Parameter parameter : parameters) {
            properties.put(parameter.name(), property(parameter, limits));
            if (parameter instanceof TextParameter text && text.required()) {
                required.add(parameter.name());
            }
        }
        var schema = new LinkedHashMap<String, Object>();
        schema.put("type", "object");
        schema.put("properties", Collections.unmodifiableMap(properties));
        schema.put("required", List.copyOf(required));
        schema.put("additionalProperties", false);
        return Collections.unmodifiableMap(schema);
    }

    // An exhaustive switch: a new parameter kind does not compile until it has a schema (D30).
    private static Map<String, Object> property(Parameter parameter, Limits limits) {
        var property = new LinkedHashMap<String, Object>();
        switch (parameter) {
            case TextParameter text -> {
                describe(property, "string", text);
                putIfPresent(property, "default", text.defaultValue());
                if (text.required()) {
                    property.put("minLength", 1);
                }
                property.put("maxLength", limits.maxTextParameterLength());
            }
            case IntegerParameter integer -> {
                describe(property, "integer", integer);
                putIfPresent(property, "default", integer.defaultValue());
                putIfPresent(property, "minimum", integer.minimum());
                putIfPresent(property, "maximum", integer.maximum());
            }
            case BooleanParameter bool -> {
                describe(property, "boolean", bool);
                property.put("default", bool.defaultValue());
            }
            case ChoiceParameter<?> choice -> {
                describe(property, "string", choice);
                property.put("default", choice.defaultValue().value());
                property.put(
                        "oneOf",
                        choice.options().stream().map(ParameterSchemas::option).toList());
            }
        }
        return Collections.unmodifiableMap(property);
    }

    private static void describe(Map<String, Object> property, String type, Parameter parameter) {
        property.put("type", type);
        property.put("title", parameter.title());
        property.put("description", parameter.description());
    }

    private static void putIfPresent(Map<String, Object> property, String key, @Nullable Object value) {
        if (value != null) {
            property.put(key, value);
        }
    }

    // A labelled option, the JSON Schema way: {"const": "all", "title": "All matches"}.
    private static Map<String, Object> option(ChoiceParameter.Option option) {
        var schema = new LinkedHashMap<String, Object>();
        schema.put("const", option.value());
        schema.put("title", option.title());
        return Collections.unmodifiableMap(schema);
    }
}
