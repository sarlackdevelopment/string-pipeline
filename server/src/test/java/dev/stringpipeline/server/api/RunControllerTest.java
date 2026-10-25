package dev.stringpipeline.server.api;

import static org.assertj.core.api.Assertions.assertThat;

import dev.stringpipeline.server.LibraryConfiguration;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

@WebMvcTest(RunController.class)
@Import(LibraryConfiguration.class)
class RunControllerTest {

    private final MockMvcTester mvc;

    RunControllerTest(@Autowired MockMvcTester mvc) {
        this.mvc = mvc;
    }

    private MvcTestResult run(String json) {
        return mvc.post()
                .uri("/api/runs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
                .exchange();
    }

    private static String read(String path) throws IOException {
        return new ClassPathResource(path).getContentAsString(StandardCharsets.UTF_8);
    }

    // A request with the given steps, written as JSON objects, on the input "abc".
    private static String chain(String... steps) {
        return "{\"input\": \"abc\", \"steps\": [" + String.join(", ", steps) + "]}";
    }

    @ParameterizedTest(name = "{0} gives HTTP {1}")
    @CsvSource({"brief-chain, 200", "step-statuses, 200", "unknown-transformation, 400"})
    @DisplayName("answers every example of contract/examples exactly (D46)")
    void answersTheContractExamples(String example, int status) throws IOException {
        assertThat(run(read("examples/" + example + ".request.json")))
                .hasStatus(status)
                .bodyJson()
                .isStrictlyEqualTo(new ClassPathResource("examples/" + example + ".response.json"));
    }

    @Nested
    @DisplayName("Runs")
    class Runs {

        @Test
        void returnsTheInputForAnEmptyChain() {
            assertThat(run(chain())).hasStatusOk().bodyJson().isStrictlyEqualTo("""
                            {"steps": [], "output": "abc"}""");
        }

        @Test
        void treatsANullParameterValueAsNoValue() {
            assertThat(run(chain("""
                            {"id": "s1", "transformation": "append", "parameters": {"text": null}}"""))).hasStatusOk().bodyJson().isStrictlyEqualTo("""
                            {"steps": [{"id": "s1", "status": "executed", "output": "abc"}], "output": "abc"}""");
        }

        @Test
        void acceptsAStepWithoutParameters() {
            assertThat(run(chain("""
                            {"id": "s1", "transformation": "prepend"}""")))
                    .hasStatusOk()
                    .bodyJson()
                    .extractingPath("$.output")
                    .isEqualTo("abc");
        }
    }

    @Nested
    @DisplayName("Request errors are Problem Details with JSON pointers (D41)")
    class RequestErrors {

        @Test
        void reportsEveryMissingField() {
            assertThat(run("{}"))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                    .bodyJson()
                    .isLenientlyEqualTo("""
                            {
                              "title": "Bad Request",
                              "status": 400,
                              "detail": "Invalid request content.",
                              "instance": "/api/runs",
                              "errors": [
                                {"pointer": "#/input", "detail": "The input is required."},
                                {"pointer": "#/steps", "detail": "The steps are required."}
                              ]
                            }""");
        }

        @Test
        void reportsAllProblemsOfARequestAtOnce() {
            assertThat(run("""
                            {"steps": [{"id": "", "transformation": "reverse"}, null]}"""))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .bodyJson()
                    .extractingPath("$.errors[*].pointer")
                    .asArray()
                    .containsExactly("#/input", "#/steps/0/id", "#/steps/0/transformation", "#/steps/1");
        }

        @Test
        void rejectsAnInputOverTheLimit() {
            String input = "a".repeat(100_001);

            assertThat(run("{\"input\": \"" + input + "\", \"steps\": []}"))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .bodyJson()
                    .extractingPath("$.errors[0]")
                    .convertTo(RequestError.class)
                    .isEqualTo(new RequestError("#/input", "The input is longer than 100,000 characters."));
        }

        @Test
        void rejectsMoreStepsThanTheLimit() {
            String steps = IntStream.rangeClosed(1, 51)
                    .mapToObj(index -> "{\"id\": \"s" + index + "\", \"transformation\": \"append\"}")
                    .collect(Collectors.joining(", "));

            assertThat(run(chain(steps)))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .bodyJson()
                    .extractingPath("$.errors[0]")
                    .convertTo(RequestError.class)
                    .isEqualTo(new RequestError("#/steps", "A chain can have at most 50 steps."));
        }

        @Test
        void rejectsADuplicateStepId() {
            assertThat(run(chain(
                            "{\"id\": \"s1\", \"transformation\": \"append\"}",
                            "{\"id\": \"s1\", \"transformation\": \"prepend\"}")))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .bodyJson()
                    .extractingPath("$.errors[0]")
                    .convertTo(RequestError.class)
                    .isEqualTo(new RequestError("#/steps/1/id", "The step id s1 is used more than once."));
        }

        @Test
        void rejectsAStepIdOverSixtyFourCharacters() {
            assertThat(run(chain("{\"id\": \"" + "x".repeat(65) + "\", \"transformation\": \"append\"}")))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .bodyJson()
                    .extractingPath("$.errors[0]")
                    .convertTo(RequestError.class)
                    .isEqualTo(new RequestError("#/steps/0/id", "A step id can have at most 64 characters."));
        }

        @Test
        void rejectsAParameterTheTransformationDoesNotHave() {
            assertThat(run(chain("""
                            {"id": "s1", "transformation": "append", "parameters": {"colour": "red"}}""")))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .bodyJson()
                    .extractingPath("$.errors[0]")
                    .convertTo(RequestError.class)
                    .isEqualTo(new RequestError("#/steps/0/parameters/colour", "Append has no parameter colour."));
        }

        @Test
        void escapesAParameterNameInThePointer() {
            assertThat(run(chain("""
                            {"id": "s1", "transformation": "append", "parameters": {"a/b~c": 1}}""")))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .bodyJson()
                    .extractingPath("$.errors[0].pointer")
                    .isEqualTo("#/steps/0/parameters/a~1b~0c");
        }

        @Test
        void rejectsAnObjectAsAParameterValue() {
            assertThat(run(chain("""
                            {"id": "s1", "transformation": "append", "parameters": {"text": {"nested": true}}}""")))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .bodyJson()
                    .extractingPath("$.errors[0]")
                    .convertTo(RequestError.class)
                    .isEqualTo(new RequestError(
                            "#/steps/0/parameters/text",
                            "A parameter value must be text, a number, a boolean or null."));
        }

        @Test
        void explainsMalformedJson() {
            assertThat(run("{\"input\": "))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .bodyJson()
                    .extractingPath("$.detail")
                    .isEqualTo("The request body is not valid JSON or does not have the expected shape.");
        }

        @Test
        void pointsAtAValueOfTheWrongTypeWithoutNamingJavaTypes() {
            assertThat(run("{\"input\": \"abc\", \"steps\": {}}"))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .bodyJson()
                    .isStrictlyEqualTo("""
                            {
                              "title": "Bad Request",
                              "status": 400,
                              "detail": "The request body is not valid JSON or does not have the expected shape.",
                              "instance": "/api/runs",
                              "errors": [{"pointer": "#/steps", "detail": "This value has the wrong type."}]
                            }""");
        }
    }

    @Nested
    @DisplayName("Answers in the language of Accept-Language (D52)")
    class Languages {

        private MvcTestResult run(String languages, String json) {
            return mvc.post()
                    .uri("/api/runs")
                    .header(HttpHeaders.ACCEPT_LANGUAGE, languages)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json)
                    .exchange();
        }

        @Test
        void writesStepResultsInTheLanguage() {
            assertThat(run("ru-RU,ru;q=0.9,en;q=0.8", chain("""
                            {"id": "s1", "transformation": "replace"}""")))
                    .hasStatusOk()
                    .hasHeader(HttpHeaders.CONTENT_LANGUAGE, "ru")
                    .bodyJson()
                    .isStrictlyEqualTo("""
                            {
                              "steps": [
                                {
                                  "id": "s1",
                                  "status": "notConfigured",
                                  "issues": [{"parameter": "old", "message": "Введите значение"}]
                                }
                              ],
                              "output": null
                            }""");
        }

        @Test
        void writesRequestErrorsInTheLanguage() {
            assertThat(run("de", """
                            {"steps": [{"id": "s1", "transformation": "append", "parameters": {"colour": "red"}}]}"""))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .hasHeader(HttpHeaders.CONTENT_LANGUAGE, "de")
                    .bodyJson()
                    .isLenientlyEqualTo("""
                            {
                              "detail": "Ungültiger Inhalt der Anfrage.",
                              "errors": [
                                {"pointer": "#/input", "detail": "Die Eingabe fehlt."},
                                {"pointer": "#/steps/0/parameters/colour", "detail": "Anhängen hat keinen Parameter colour."}
                              ]
                            }""");
        }

        @Test
        void explainsMalformedJsonInTheLanguage() {
            assertThat(run("ru", "{\"input\": "))
                    .hasStatus(HttpStatus.BAD_REQUEST)
                    .bodyJson()
                    .extractingPath("$.detail")
                    .isEqualTo("Тело запроса не является корректным JSON или имеет не ту структуру.");
        }

        @Test
        void speaksEnglishToAnyOtherLanguage() {
            assertThat(run("fr", chain()))
                    .hasStatusOk()
                    .hasHeader(HttpHeaders.CONTENT_LANGUAGE, "en")
                    .hasHeader(HttpHeaders.VARY, HttpHeaders.ACCEPT_LANGUAGE);
        }
    }
}
