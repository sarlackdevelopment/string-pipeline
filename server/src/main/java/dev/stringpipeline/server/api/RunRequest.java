package dev.stringpipeline.server.api;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.Map;
import org.jspecify.annotations.Nullable;

/// The body of `POST /api/runs` (D40). Any field may be missing from the JSON; [RunRequestReader] reports which.
///
/// @param input the text to transform
/// @param steps the chain, in order
record RunRequest(@Nullable String input, @Nullable List<@Nullable StepRequest> steps) {

    /// One step of the chain.
    ///
    /// @param id chosen by the client, 1 to 64 characters, unique in the request; the response echoes it
    /// @param transformation the id of a transformation from the catalog
    /// @param parameters the values by parameter name: text, numbers, booleans, or null for no value
    record StepRequest(
            @Nullable String id,
            @Nullable String transformation,

            @Schema(example = "{\"old\": \"Fake\", \"new\": \"Real\"}") @Nullable
            Map<String, @Nullable Object> parameters) {}
}
