package dev.stringpipeline.server.api;

import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Pipeline;
import dev.stringpipeline.library.transformations.BuiltIns;
import java.time.Duration;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/// A `failed` step, which `contract/` has no example of: its usual cause is a regex that runs out of time, here with
/// the limit lowered to 100 ms so the test stays fast.
@WebMvcTest(RunController.class)
@Import(FailedStepTest.QuickRegexLimit.class)
class FailedStepTest {

    @TestConfiguration(proxyBeanMethods = false)
    static class QuickRegexLimit {

        @Bean
        Catalog catalog() {
            return BuiltIns.catalog();
        }

        @Bean
        Limits limits() {
            return Limits.DEFAULT.withRegexTimeout(Duration.ofMillis(100));
        }

        @Bean
        Pipeline pipeline(Limits limits) {
            return new Pipeline(limits);
        }
    }

    private final MockMvcTester mvc;

    FailedStepTest(@Autowired MockMvcTester mvc) {
        this.mvc = mvc;
    }

    @Test
    @DisplayName("reports a regex that runs out of time as a failed step with HTTP 200 (D12, D21)")
    void reportsATimedOutRegexAsAFailedStep() {
        String input = "a".repeat(29) + "b".repeat(100);
        String request = """
                {"input": "%s", "steps": [
                  {"id": "s1", "transformation": "regexExtract", "parameters": {"pattern": "(.*a){30}"}},
                  {"id": "s2", "transformation": "append", "parameters": {"text": "!"}}
                ]}""".formatted(input);

        assertThat(mvc.post()
                        .uri("/api/runs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .hasStatusOk()
                .bodyJson()
                .isStrictlyEqualTo("""
                        {
                          "steps": [
                            {
                              "id": "s1",
                              "status": "failed",
                              "message": "The pattern took longer than 100 milliseconds on this text. Try a simpler pattern."
                            },
                            {"id": "s2", "status": "notRun"}
                          ],
                          "output": null
                        }""");
    }
}
