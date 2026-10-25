# Design

Proposed in step 8, before any feature code. It adds decisions D40–D46 and refines D12 ([decisions](decisions.md)). The example payloads in [`contract/`](../contract/README.md) are the source of truth for the API: the Java and the TypeScript tests both read them (D20, D46).

## 1. Overview

```
Browser: Vue app              Spring Boot: server/                Java library: library/
GET  /api/catalog  ─────────► CatalogController ────────────────► Catalog
POST /api/runs     ─────────► RunController ─► request records ─► Pipeline.run(input, steps)
                              JSON Schema, Problem Details        parameters → checks → execution
```

One process (D16): the server calls the library in-process. The library knows nothing about HTTP or JSON; the server maps between JSON and the library's types.

Vocabulary:

- **Transformation**: an operation such as Replace, with an id, a name, a category, a description and parameters.
- **Step**: one use of a transformation in a chain, with an id chosen by the client and parameter values.
- **Chain**: an input text and an ordered list of steps (D1).
- **Run**: executing a chain. It gives a result for every step and, when every step ran, the final output.

## 2. API

Every identifier and enum value in the JSON is lowerCamelCase. There is no version prefix: the frontend and the API ship together.

### GET /api/catalog

Everything the frontend needs to build the editor ([example](../contract/catalog.json)):

- `limits`: `maxInputLength` (100,000) and `maxSteps` (50), so the UI can enforce them before sending (D21). Lengths count UTF-16 code units, like JavaScript's `length` and HTML's `maxlength`.
- `categories`: id and name, in display order.
- `transformations`: id, name, category, description, and `parameters` as JSON Schema (section 3).

### POST /api/runs

Runs a chain. Nothing is stored; the response describes one run.

```json
{
  "input": "Fake Python",
  "steps": [
    {
      "id": "s1",
      "transformation": "replace",
      "parameters": { "old": "Fake", "new": "Real" }
    }
  ]
}
```

- `id`: chosen by the client, 1–64 characters, unique in the request. The response echoes it, so the frontend can match results to steps while the user keeps editing.
- `parameters`: one value per parameter name. `null` or a missing key means "no value". A missing `parameters` object means no values at all.

```json
{
  "steps": [{ "id": "s1", "status": "executed", "output": "Real Python" }],
  "output": "Real Python"
}
```

| `status`            | Meaning                              | Fields    | Shown in the UI (D12)      |
| ------------------- | ------------------------------------ | --------- | -------------------------- |
| `executed`          | the step ran                         | `output`  | output under the step      |
| `notConfigured`     | a required value is missing          | `issues`  | neutral hint at the fields |
| `invalidParameters` | a value is present but wrong         | `issues`  | error at the fields        |
| `failed`            | the step could not process this text | `message` | error under the step       |
| `notRun`            | an earlier step did not run          | none      | greyed out                 |

Rules (D42):

- Every step's parameters are checked, also after a step that cannot run, so all configuration problems show at once.
- Execution stops at the first step that is not `executed`. Later steps with valid parameters are `notRun`.
- The top-level `output` is the last step's output when every step executed, the input itself for an empty chain, and `null` otherwise.
- An issue is `{ "parameter": "old", "message": "Enter a value" }`.

### Request errors

Problems inside a step (its values or its execution) are step results with HTTP 200, because the user causes them while typing. Problems with the request as a whole are HTTP 400 with Problem Details (RFC 9457) and an `errors` list of JSON pointers, as in the RFC's own example (D41):

- malformed JSON or a wrong shape: no `input`, `parameters` not an object, a parameter value that is an object or an array;
- an unknown transformation or parameter name, duplicate step ids;
- the limits: an input longer than 100,000 characters, more than 50 steps, a step id longer than 64 characters.

```json
{
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid request content.",
  "instance": "/api/runs",
  "errors": [
    {
      "pointer": "#/steps/0/transformation",
      "detail": "Unknown transformation: reverse"
    }
  ]
}
```

There is no `type` member: RFC 9457 defines a missing `type` as `about:blank`, and Spring leaves it out. The frontend shows an error at the field its pointer names (`#/input` at the input, `#/steps/1/...` at that step) and anything else as a banner. Unexpected failures are a generic 500 Problem Details without internals.

## 3. Parameters

Four kinds, each mapped to a small subset of JSON Schema 2020-12 (D43). The frontend renders exactly these; anything else shows a notice instead of a field.

| Kind    | JSON Schema                                                                                 | Field        |
| ------- | ------------------------------------------------------------------------------------------- | ------------ |
| text    | `type: string`; `title`, `description`, `default`, `minLength` (1 if required), `maxLength` | text input   |
| integer | `type: integer`; `title`, `description`, `default`, `minimum`, `maximum`                    | number input |
| boolean | `type: boolean`; `title`, `description`, `default`                                          | checkbox     |
| choice  | `type: string` with `oneOf` of `{ const, title }`; `title`, `description`, `default`        | select       |

- A transformation's `parameters` is `type: object` with `properties`, `required` (always present, possibly empty) and `additionalProperties: false`.
- Properties are listed in display order. Jackson writes them in that order and JavaScript keeps it; a test pins it.
- Required means "has a non-empty value". A missing required value makes the step `notConfigured`.
- Text values are never trimmed and are at most 10,000 characters long (D45).
- Why not JSON Forms with a UI schema, as KNIME's dialogs use: a vertical form in property order covers every transformation planned here. A UI schema is the next step if groups or conditional fields are ever needed.

Messages from the generic checks:

| Problem                                           | Message                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| a required value is missing or empty              | Enter a value                                                                  |
| a text field gets a number or a boolean           | Enter text                                                                     |
| an integer is text or has a fraction              | Enter a whole number                                                           |
| below `minimum`, above `maximum`, or outside both | Enter {min} or more / Enter {max} or less / Enter a number from {min} to {max} |
| an integer without bounds outside Java's `int`    | Enter a number from -2,147,483,648 to 2,147,483,647                            |
| text longer than the limit                        | Use at most 10,000 characters                                                  |
| a boolean field gets anything else                | Enter true or false                                                            |
| a choice outside the list                         | Choose one of the options                                                      |

## 4. Transformations

First set, built in step 9 (D10):

| Id             | Name          | Parameters                                                                                                  | Behaviour                                                                                                                                   |
| -------------- | ------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `replace`      | Replace       | `old` text, required; `new` text, default empty                                                             | every occurrence, literal, case-sensitive; `$` and `\` are plain characters (D5)                                                            |
| `append`       | Append        | `text` text, default empty                                                                                  | input + text                                                                                                                                |
| `prepend`      | Prepend       | `text` text, default empty                                                                                  | text + input                                                                                                                                |
| `substring`    | Substring     | `start` integer, default 0; `end` integer, optional                                                         | Python slice over grapheme clusters, out-of-range indices clamp (D6, D7)                                                                    |
| `regexExtract` | Regex extract | `pattern` text, required; `group` integer ≥ 0, default 0; `matches` choice first or all, default all; flags | the group of the first or of every match, one per line; empty text without a match; a group that did not take part gives an empty line (D8) |
| `regexReplace` | Regex replace | `pattern` text, required; `replacement` text, default empty; flags                                          | every match; the replacement understands `$1`, `${name}` and `\$` (D8)                                                                      |

The flags are three booleans, default off: `ignoreCase`, `multiline` (`^` and `$` at every line) and `dotAll` (`.` matches line breaks). `ignoreCase` also turns on Unicode case folding, so `Ä` matches `ä`.

Regex checks (D9):

- A pattern that does not compile is `invalidParameters` at `pattern`, with the description and position from Java: "Unclosed group at character 4".
- Group references are checked before running: `group` against the pattern's group count, and `$n` and `${name}` in `replacement` against the group count and `Pattern.namedGroups()` (Java 20+). Java itself reports a bad reference only when something matches: in a probe, `"abc".replaceAll("[0-9]+", "$5 off")` returned `abc`, while `"5"` threw "No group 5". Checking up front makes "$5 off" an error at the field for every input: "The pattern has no group 5. Write \$ for a dollar sign."

Later candidates for step 17, each showing something new:

- **Change case**: upper, lower, title, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE. `Locale.ROOT` by default, with a locale option that shows the Turkish dotted i.
- **Encode and Decode**: Base64, URL-safe Base64, URL encoding, hex; always UTF-8; undecodable input is `failed`.
- **Reformat dates**: each line parsed with one pattern and printed with another, strictly; the first bad line is `failed` with its line number.
- **Line operations**: sort, unique, remove empty lines, keep or drop lines matching a pattern, join, split.

## 5. Library

| Package                                      | Visibility                                  | Contents                                                                      |
| -------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| `dev.stringpipeline.library`                 | public API                                  | `Catalog`, `Pipeline`, `Transformation`, parameters, values, results          |
| `dev.stringpipeline.library.transformations` | package-private, plus one public `BuiltIns` | the transformations and their text helpers (graphemes, lines, regex deadline) |

The server may use only the API package and `BuiltIns`, and an ArchUnit test checks it (D31). The transformation classes are package-private, so the compiler already prevents direct use. `BuiltIns.catalog()` is the one way in, which also keeps the API package free of references to the implementations.

```java
public interface Transformation {
    TransformationInfo info();                // id, name, description, category
    List<Parameter> parameters();             // in display order
    Configuration configure(Arguments args);  // checks only this transformation can make
}

public sealed interface Parameter permits TextParameter, IntegerParameter, BooleanParameter, ChoiceParameter {}
public sealed interface ArgumentValue permits TextValue, NumberValue, BooleanValue {}  // what callers pass in
public sealed interface Configuration permits Ready, Invalid {}                        // Ready can run on a text
public sealed interface StepResult permits Outcome, NotConfigured, InvalidParameters, NotRun {}
public sealed interface Outcome extends StepResult permits Executed, Failed {}         // what running a step gives

public record PipelineResult(List<StepResult> steps, Optional<String> output) {}
```

Each step goes through three stages, and each one returns data rather than throwing (D44):

1. Every `Parameter` turns its raw value into a typed one, or reports an issue. These checks are generic and shared by all transformations.
2. `Transformation.configure` makes the checks only it can make, such as compiling the regex and resolving group references.
3. The configured step runs on the text and returns `Executed` or `Failed`.

Exceptions remain only for programmer errors. Adding a transformation means one package-private class and one line in `BuiltIns`; the frontend needs nothing (D19).

Text rules:

- A character is a grapheme cluster. `java.text.BreakIterator` follows Unicode's extended grapheme clusters since Java 20; a probe on Java 25 counted 👍🏽🇩🇪, e with a combining accent, and x as 4 characters (11 UTF-16 units).
- Case changes use `Locale.ROOT`. There is no Unicode normalisation.
- Line-based steps split on `\r\n`, `\r` and `\n`, and write `\n`.

Limits (D21, D45). `Pipeline` takes a `Limits` value with production defaults; tests pass smaller ones.

- **Regex time.** The matcher reads the text through a `CharSequence` that checks a deadline in `charAt` and stops after 2 s. The step is then `failed`. Java 25 already answers the textbook ReDoS shapes such as `(a+)+$` at once, because its engine remembers failed positions in nested loops. A counted repeat of a wildcard such as `(.*a){30}` still runs for more than 8 seconds on a 129-character text (probe), so the limit stays.
- **Output size.** No step may produce more than 1,000,000 characters, and all steps of a run together no more than 10,000,000, which also bounds the size of the response. Every transformation that can grow its text checks the cap while it builds the result, so a chain such as "a" → "aa" repeated 50 times cannot exhaust memory.

## 6. Server

- `CatalogController` (`GET /api/catalog`) builds its response once at startup. It maps each `Parameter` to JSON Schema with an exhaustive `switch` (D30), so a new parameter kind does not compile until the mapping handles it.
- `RunController` (`POST /api/runs`) hands the request to `RunRequestReader`, then calls `Pipeline` and maps every `StepResult` to the response with an exhaustive `switch`. The reader:
  - collects every request error with its JSON pointer before it answers. The rules need the catalog or several fields at once, so they are plain code rather than Bean Validation annotations;
  - maps JSON values to `ArgumentValue`: string to text, number to number, boolean to boolean, `null` to absent, object or array to 400.
- Wire types live in the server, and the library has no Jackson annotations. The parts of a request end in `Request`, the parts of a response in `Response`.
- `InvalidRequestException` is a Spring `ErrorResponseException`, so Spring renders it as Problem Details. `ApiExceptionHandler` adds a clearer message for unreadable JSON, with the pointer Jackson reports but not its message, which names Java types; and a generic 500 that shows nothing of the server.
- springdoc-openapi 3.1 serves the OpenAPI document at `/v3/api-docs` and Swagger UI at `/swagger-ui.html` (D17); the `status` union is documented with a discriminator.
- ArchUnit checks that the server uses only the library's API package and `BuiltIns`, and that the library depends on nothing but the JDK and JSpecify (D31).
- The server tests run the real library and mock nothing. Mockito is off the test classpath, so Spring's test support does not attach Mockito's agent at runtime, which the JVM would warn about.
- There is no CORS configuration. In development Vite proxies `/api` to the server; in Docker the server serves the frontend (D22).

## 7. Frontend

Components with behaviour get model, controller, view and container (D26). Purely presentational ones are a single view. Domain rules that several components and the store share live in `src/model/`; only the helpers of one component stay in its own `model/` folder.

```
model/                             the domain, pure functions and types, no Vue (step 11)
  catalog.ts                       limits, categories, transformations with their fields
  fields.ts                        JSON Schema → field descriptors; unknown kinds become `unsupported` (D43)
  chain.ts                         input and steps: add, remove, move, edit (D1)
  run.ts                           chain → run request; step results by step id (D40, D42)
  problem.ts                       request errors placed at the input, a step, or a field (D41)
api/                               the network (step 11)
  contract.ts                      zod schemas of the wire format, turned into the domain in one pass (D20)
  client.ts                        fetchCatalog and postRun; every outcome is data, cancellation rejects
queries/                           TanStack Query (D29)
  client.ts                        the query client; a failed call becomes an ApiFailure; retries
  catalog.ts                       useCatalog: once per page
  run.ts                           usePipelineRun: runs the chain 300 ms after the last edit (D11)
stores/pipeline.ts                 Pinia setup store: the chain being edited (D29)
App.vue                            shell: header, error boundary, PipelineEditor
components/
  PipelineEditor/                  the editor: controller, view, container, types; model/messages.ts
  InputPanel.vue                   input text, maxlength from the catalog limits
  StepCard/StepCard.vue            fieldset, legend "Step 2: Replace", status, move and remove, form, output
  StepCard/model/status.ts         status → label and tone (pure)
  StepCard/model/issues.ts         result and request errors → the message at each field (pure)
  ParameterForm/ParameterForm.vue  fields from the schema (D27)
  ParameterForm/registry.ts        field kind → component
  ParameterForm/FieldShell.vue     label, description and issue, linked to the control (D15)
  ParameterForm/fields/            TextField, IntegerField, BooleanField, ChoiceField, UnsupportedField
  TransformationPicker/            combobox with search, groups and descriptions (D28); model/groups.ts
  OutputPanel.vue                  final output and a copy button (D32)
  ui/                              shadcn-vue components (D28)
```

Data flow:

1. `useCatalog` loads the catalog once. `api/contract` validates it, and `model/fields` turns each parameter schema into field descriptors.
2. The store holds the chain. Every edit goes through a pure function from `model/chain`. Step ids come from a counter, so no id is reused while the page is open.
3. `model/run` builds the run request. 300 ms after the last edit (D11), `usePipelineRun` posts it with the query's `AbortSignal`. The request is the query key: a newer request cancels the older one, and a request sent before shows its cached result at once.
4. While a run is pending, the previous results stay visible, matched by step id. A removed step has no result; a new one shows that it is running.
5. A failed call becomes an `ApiFailure`, the query's error. An unreachable server is retried twice, then shown as a banner with Try again. Problem Details pointers go to the input, a step or a field (section 2); anything without such a place is a banner, without Try again, since the same request would fail the same way.

The page (step 13) is one column, as D2 describes: the input, the steps, the search field that adds a step, and the output. Each step card shows its status as an outlined badge, so the coloured text keeps a 4.5:1 contrast on the white card; `--success` joins the shadcn-vue tokens for the executed state. A required field that is empty shows "Enter a value" as a grey hint; a wrong value turns the field red with the server's message under it.

The UI kit (D28, step 12). shadcn-vue's components are copied into `components/ui/` and are our code from then on. `components.json` configures the shadcn-vue CLI, which runs through `npx`. It names no font, so the CLI adds no font import (D47), and it points the CLI at `lib/utils.ts` for `cn`, the class-name helper; the copied components import the `cn` package directly. Probe tests, deleted afterwards, showed how Reka UI's combobox behaves, which the transformation picker builds on:

- The input is an ARIA combobox (`aria-expanded`, `aria-controls`, `aria-autocomplete="list"`), and the highlighted option is announced through `aria-activedescendant`.
- Typing filters with `Intl.Collator` at base sensitivity, so case and accents do not matter. An item matches on its `textValue` or, without one, on its whole text at mount, description included: "slice" finds Substring. A group without matches stays in the DOM with `hidden`: `getByText` still finds its heading, `getByRole` does not.
- The first match is highlighted at once: typing a name and pressing Enter picks it. Escape closes the list.
- jsdom does not implement `scrollIntoView`, which Reka UI calls on the highlighted option, so the test setup stubs it. Nothing else needed a stub: floating-ui, which positions the list, uses a `ResizeObserver` only where one exists.

Accessibility (D15):

- Each step is a `fieldset` whose legend names the step.
- Descriptions and errors are linked to their fields through `aria-describedby`, with ids from `useId`.
- An `<output aria-live="polite">` announces the run summary after the debounce.
- After adding, removing or moving a step, focus goes to the new step's first field, the next step, or the moved step's button.

Proof of R2.1 (D19): an integration test serves a catalog with a transformation the frontend has never seen, with an unfamiliar mix of parameters, and checks that its form renders and runs.

## 8. Tests

| Layer                | What                                                                                                       | Where                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Library              | each transformation, each trap (parameterized), parameter checks, pipeline rules, limits                   | `library/src/test`               |
| Server               | catalog and runs against `contract/`, request errors, a `failed` run, ArchUnit                             | `server/src/test`                |
| Frontend unit        | model functions, zod parsers on `contract/`; the store; queries and the controller inside a test component | `frontend/src/tests/unit`        |
| Frontend component   | each view with full props, events through `vi.fn()`, found by role and name                                | `frontend/src/tests/component`   |
| Frontend integration | containers on a stand-in API: the keyboard path, the R2.1 proof, failures                                  | `frontend/src/tests/integration` |
| End to end           | Gherkin features against the real API and the built app (D23)                                              | `frontend/e2e`                   |

The stand-in API (`src/tests/helpers/api.ts`) runs on MSW (D33). It serves a catalog and runs Replace and Append by the rules of D42, so a test reads like a session: type a text, add a step, read its output. It computes its answers instead of replaying canned ones, and the app parses them with its own contract schemas, so it cannot drift from the wire format unnoticed. A gate holds a response back to look at the editor while a run is on its way.

The end-to-end tests (step 15) are Gherkin features, run by Playwright through playwright-bdd: the brief's chain (`@smoke`), a pattern that Java cannot compile, with the server's message at its field, and an emoji that Substring keeps whole. Playwright starts the API with Gradle on port 8091 and the built app with `vite preview` on port 4191, whose proxy reaches that API through `API_PROXY_TARGET`; development servers on 8080 and 5173 are never touched. The steps find elements by role and name, and read texts inside them.

## 9. Points to approve

1. `GET /api/catalog` with limits, instead of a bare list of transformations: one call gives the frontend everything it needs to build the editor.
2. Checking every step's parameters even after a step that cannot run (refines D12).
3. Caps of 10,000 characters per text parameter and 1,000,000 characters per step output.
