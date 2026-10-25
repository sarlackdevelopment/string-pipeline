package dev.stringpipeline.server.api;

import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Pipeline;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Locale;
import org.springframework.context.MessageSource;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/// `POST /api/runs` (R1.2, D40). Stateless: nothing is stored, the response describes one run.
@RestController
@RequestMapping("/api")
@Tag(name = "String Pipeline")
class RunController {

    private final RunRequestReader reader;
    private final Pipeline pipeline;

    RunController(Catalog catalog, Limits limits, Pipeline pipeline, MessageSource messageSource) {
        this.reader = new RunRequestReader(catalog, limits, messageSource);
        this.pipeline = pipeline;
    }

    @PostMapping("/runs")
    @Operation(
            summary = "Run a chain",
            description = "Checks every step's parameters, then runs the steps in order until one does not execute."
                    + " Problems inside a step come back as its status with HTTP 200; problems with the request"
                    + " itself are a 400 with Problem Details and JSON pointers.")
    RunResponse run(@RequestBody RunRequest request, Locale language) {
        RunRequestReader.Run run = reader.read(request, language);
        return RunResponse.of(run.ids(), pipeline.run(run.input(), run.steps()), language);
    }
}
