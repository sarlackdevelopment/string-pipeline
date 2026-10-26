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
- `examples`: ready-made chains with an id, a name, an input and steps, each step with `transformation` and `parameters` as in a run request; a parameter an example leaves out keeps its default (D50).

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

### Languages

The texts of both endpoints, from the catalog's names and descriptions to step messages and request errors, are in the language that `Accept-Language` asks for, as a browser sends it (`de-DE,de;q=0.9,en;q=0.8`): English, German or Russian. Any other language, or none, gets English. A response names its language in `Content-Language` and has `Vary: Accept-Language` (D52, step 22). Ids, values and pointers are the same in every language; the examples in `contract/` are the English answers.

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

Second set, built in step 17 (D10), each showing something new:

| Id               | Name            | Parameters                                                                                                                                                                                       | Behaviour                                                                                                                                                                                                                                                                                |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `changeCase`     | Change case     | `to` choice of UPPER CASE, lower case, Title Case, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, default upper; `language` choice of any or Turkish and Azerbaijani, default any | the case rules of the language: `Locale.ROOT`, or Turkish, where i becomes İ and I becomes ı; the identifier styles turn each line into one name, splitting words at punctuation, at camelCase and after acronyms (HTTPResponse)                                                         |
| `lineOperations` | Line operations | `operation` choice of sort A to Z, sort Z to A, remove duplicates, remove blank lines, reverse, default sort; `ignoreCase` boolean                                                               | sorting compares numbers by value and text by the collation of `Locale.ROOT`, and keeps equal lines in their order; duplicates are exact copies, or copies apart from case                                                                                                               |
| `encode`         | Encode          | `format` choice of Base64, URL-safe Base64, URL and hexadecimal, default Base64                                                                                                                  | the UTF-8 bytes of the text; URL-safe Base64 has no padding; URL encoding follows RFC 3986, so a space is %20                                                                                                                                                                            |
| `decode`         | Decode          | `format` as for Encode                                                                                                                                                                           | ignores spaces and line breaks in Base64 and hexadecimal, keeps + in URL encoding; a text not in the format, or bytes that are not UTF-8, make the step `failed` with the reason                                                                                                         |
| `reformatDates`  | Reformat dates  | `from` text, default `yyyy-MM-dd`; `to` text, default `dd.MM.yyyy`                                                                                                                               | each line read strictly with `DateTimeFormatter` letters, as a date, a time or both; English month names in any case; `yyyy` works because the era defaults to ours; empty lines stay empty; the first line that is not a date makes the step `failed` with its number and Java's reason |

Checks of the second set:

- A pattern that Java cannot read is `invalidParameters` at its field, with Java's words: "Unknown pattern letter: b", translated for the usual mistakes (D52). Both date patterns are checked at once.
- An output pattern that needs a field the input does not have, such as the hour for dates, is `failed`: "The output pattern needs more than the input pattern reads (Unsupported field: HourOfDay)."
- A case change can make a text longer (ß becomes SS), and so can encoding; both check the output cap (D45).

## 5. Library

| Package                                      | Visibility                                  | Contents                                                                                                  |
| -------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `dev.stringpipeline.library`                 | public API                                  | `Catalog`, `Example`, `Pipeline`, `Transformation`, parameters, values, results, `Message` and `Messages` |
| `dev.stringpipeline.library.transformations` | package-private, plus one public `BuiltIns` | the transformations and their text helpers (graphemes, lines, regex deadline)                             |

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

Texts (D52, step 22). Every text in the API package is a `Message`: a key into the library's bundles, `messages.properties` in English with `_de` and `_ru` beside it, and the values for its placeholders; or a verbatim text, such as a message of Java's. The library knows no language. `Messages.render(message, locale)` formats a message with `MessageFormat` for one language, English when the library does not speak it, so a count gets the language's thousands separator. Java's messages are in English only, so `JdkMessage` translates the regex and date-pattern errors made while typing, matched by their exact wording, and passes any other on as Java wrote it.

Examples (D50, step 19). An `Example` is an id, a name, an input and library `Step`s. `BuiltIns` builds the transformations first and the examples from those very objects, and `Catalog` checks it with an identity set: a client opens an example by its transformation ids and runs the catalog's own transformations, so the example has to run the same ones. `ExamplesTest` runs every example through the real pipeline and pins its output.

Text rules:

- A character is a grapheme cluster. `java.text.BreakIterator` follows Unicode's extended grapheme clusters since Java 20; a probe on Java 25 counted 👍🏽🇩🇪, e with a combining accent, and x as 4 characters (11 UTF-16 units).
- Case changes use `Locale.ROOT` unless a step asks for Turkish or Azerbaijani. There is no Unicode normalisation.
- Line-based steps split on `\r\n`, `\r` and `\n`, and write `\n`. A line break at the very end closes the last line and is written again; it does not make an empty line.

Limits (D21, D45). `Pipeline` takes a `Limits` value with production defaults; tests pass smaller ones.

- **Regex time.** The matcher reads the text through a `CharSequence` that checks a deadline in `charAt` and stops after 2 s. The step is then `failed`. Java 25 already answers the textbook ReDoS shapes such as `(a+)+$` at once, because its engine remembers failed positions in nested loops. A counted repeat of a wildcard such as `(.*a){30}` still runs for more than 8 seconds on a 129-character text (probe), so the limit stays.
- **Output size.** No step may produce more than 1,000,000 characters, and all steps of a run together no more than 10,000,000, which also bounds the size of the response. Every transformation that can grow its text checks the cap while it builds the result, so a chain such as "a" → "aa" repeated 50 times cannot exhaust memory.

## 6. Server

- `CatalogController` (`GET /api/catalog`) builds its response once at startup, for each language. It maps each `Parameter` to JSON Schema with an exhaustive `switch` (D30), so a new parameter kind does not compile until the mapping handles it. The examples' values become JSON through an exhaustive `switch` over `ArgumentValue`, in the transformation's display order, so the JSON is the same at every start.
- `RunController` (`POST /api/runs`) hands the request to `RunRequestReader`, then calls `Pipeline` and maps every `StepResult` to the response with an exhaustive `switch`. The reader:
  - collects every request error with its JSON pointer before it answers. The rules need the catalog or several fields at once, so they are plain code rather than Bean Validation annotations;
  - maps JSON values to `ArgumentValue`: string to text, number to number, boolean to boolean, `null` to absent, object or array to 400.
- Wire types live in the server, and the library has no Jackson annotations. The parts of a request end in `Request`, the parts of a response in `Response`.
- `InvalidRequestException` is a Spring `ErrorResponseException`, so Spring renders it as Problem Details. `ApiExceptionHandler` adds a clearer message for unreadable JSON, with the pointer Jackson reports but not its message, which names Java types; and a generic 500 that shows nothing of the server.
- Languages (D52, step 22). `LanguageConfiguration` replaces Spring Boot's `LocaleResolver` with one that gives only the library's languages and English by default, so a controller takes the request's language as a `Locale` argument and renders the library's messages in it. An interceptor names it in `Content-Language` and adds `Vary: Accept-Language`. The server's own texts, the request errors, are in `messages.properties` and its `_de` and `_ru` files, read by Spring's `MessageSource`; `spring.messages.fallback-to-system-locale=false` makes English the fallback there too.
- springdoc-openapi 3.1 serves the OpenAPI document at `/v3/api-docs` and Swagger UI at `/swagger-ui.html` (D17); the `status` union is documented with a discriminator.
- ArchUnit checks that the server uses only the library's API package and `BuiltIns`, and that the library depends on nothing but the JDK and JSpecify (D31).
- The server tests run the real library and mock nothing. Mockito is off the test classpath, so Spring's test support does not attach Mockito's agent at runtime, which the JVM would warn about.
- There is no CORS configuration. In development Vite proxies `/api` to the server; in Docker the server serves the frontend (D22).

Packaging (D22, step 18). One image holds the server and the built frontend, so a browser reaches both on one origin. The `Dockerfile` has three stages: Node 24 runs `npm ci` and `npm run build`, the JDK 25 image builds the jar with `gradlew :server:bootJar`, and the JRE 25 image runs it as a user of its own. Spring Boot serves the frontend from the folder that `SPRING_WEB_RESOURCES_STATIC_LOCATIONS` names, with `index.html` at `/`; the jar itself stays the API alone, as the manual path runs it. The app has one page and no routes of its own, so the server needs no fallback to `index.html`. The base images are pinned to exact versions, `.dockerignore` lets in only what the build needs, and BuildKit keeps the npm and Gradle caches between builds. The end-to-end features run against the container too (`E2E_BASE_URL`). Since step 29, `render.yaml` runs the same image as a web service on Render's free plan (D58): Render builds the Dockerfile with BuildKit, routes the traffic to the port in `PORT`, set to 8080, and deploys again on each push to main that changes what goes into the image.

## 7. Frontend

Components with behaviour get model, controller, view and container (D26). Purely presentational ones are a single view. Domain rules that several components and the store share live in `src/model/`; only the helpers of one component stay in its own `model/` folder.

```
model/                             the domain, pure functions and types, no Vue (step 11)
  catalog.ts                       limits, categories, transformations with their fields, example chains (D50)
  fields.ts                        JSON Schema → field descriptors; unknown kinds become `unsupported` (D43)
  chain.ts                         input and steps: add, remove, move, edit, turn off (D1, D48)
  run.ts                           chain → run request without the steps that are off; results by step id (D40, D42)
  problem.ts                       request errors placed at the input, a step, or a field (D41)
  link.ts                          the chain in the address's fragment: written, read, checked against the catalog (D49)
api/                               the network (step 11)
  contract.ts                      zod schemas of the wire format, turned into the domain in one pass (D20)
  client.ts                        fetchCatalog and postRun, with Accept-Language; every outcome is data, cancellation rejects
queries/                           TanStack Query (D29)
  client.ts                        the query client; a failed call becomes an ApiFailure; retries
  catalog.ts                       useCatalog: once per page and language (D52); once more through a new service worker (D56)
  run.ts                           usePipelineRun: runs the chain 300 ms after the last edit (D11)
stores/pipeline.ts                 Pinia setup store: the chain being edited (D29)
composables/useFocusRequest.ts     focuses the part a container asks for, after the DOM updated (D15)
composables/useChainLink.ts        opens the chain of a link, and writes the chain back into the address (D49)
composables/useTheme.ts            light, dark or the system's theme, kept in localStorage (D51)
composables/useLanguage.ts         the interface's language: switches the texts and keeps the choice (D52)
composables/useDragToReorder.ts    drags the items of a list by their handles, with SortableJS, and reports each move (D54)
i18n/                              the app's own texts in vue-i18n (D52)
  index.ts                         the languages, the first one, the Russian plural rule, createAppI18n
  en.ts, de.ts, ru.ts              the texts; English is the type of the others
App.vue                            shell as high as the window (D53): header with the language and the theme, <html lang>, error boundary, PipelineEditor
components/
  PipelineEditor/                  the editor: controller, view, container, types; model/: messages, focus, summary
  CopyLinkButton.vue               copies a link to the chain (D49)
  ThemeSwitcher.vue                light, dark or the system's theme, a radio group in the header (D51)
  LanguageSwitcher.vue             English, Deutsch or Русский, the browser's own select in the header (D52)
  InputPanel.vue                   input text, maxlength from the catalog limits
  StepCard/StepCard.vue            fieldset, legend "Step 2: Replace", status, on/off switch, move and remove, form, output
  StepCard/model/status.ts         status → label and tone (pure)
  StepCard/model/issues.ts         result and request errors → the message at each field (pure)
  StepCard/types.ts                the parts of a card that can take the focus (D15)
  ParameterForm/ParameterForm.vue  fields from the schema (D27)
  ParameterForm/registry.ts        field kind → component
  ParameterForm/FieldShell.vue     label, description and issue, linked to the control (D15)
  ParameterForm/fields/            TextField, IntegerField, BooleanField, ChoiceField, UnsupportedField
  TransformationPicker/            combobox with search, groups and descriptions (D28); model/groups.ts
  OutputPanel.vue                  final output, a copy button, and Copy link (D32, D49)
  EditorNotices.vue                a failed run and a broken link as toasts at the bottom right (D55)
  ui/                              shadcn-vue components (D28)
```

Data flow:

1. `useCatalog` loads the catalog once for each language. `api/contract` validates it, and `model/fields` turns each parameter schema into field descriptors.
2. The store holds the chain. Every edit goes through a pure function from `model/chain`. Step ids come from a counter, so no id is reused while the page is open.
3. `model/run` builds the run request. 300 ms after the last edit (D11), `usePipelineRun` posts it with the query's `AbortSignal`. The request is the query key: a newer request cancels the older one, and a request sent before shows its cached result at once.
4. While a run is pending, the previous results stay visible, matched by step id. A removed step has no result; a new one shows that it is running.
5. A failed call becomes an `ApiFailure`, the query's error. An unreachable server is retried twice, then shown as a notice with Try again (D55); while the browser is offline, the run waits instead (D57). Problem Details pointers go to the input, a step or a field (section 2); anything without such a place is a banner, without Try again, since the same request would fail the same way.

The page (step 13) was one column at first, as D2 described: the input, the steps, the search field that adds a step, and the output. Steps 23 and 24 gave it the layout of D53, described below. Each step card shows its status as an outlined badge, so the coloured text keeps a 4.5:1 contrast on the white card; `--success` joins the shadcn-vue tokens for the executed state. A required field that is empty shows "Enter a value" as a grey hint; a wrong value turns the field red with the server's message under it.

The UI kit (D28, step 12). shadcn-vue's components are copied into `components/ui/` and are our code from then on. `components.json` configures the shadcn-vue CLI, which runs through `npx`. It names no font, so the CLI adds no font import (D47), and it points the CLI at `lib/utils.ts` for `cn`, the class-name helper; the copied components import the `cn` package directly. Probe tests, deleted afterwards, showed how Reka UI's combobox behaves, which the transformation picker builds on:

- The input is an ARIA combobox (`aria-expanded`, `aria-controls`, `aria-autocomplete="list"`), and the highlighted option is announced through `aria-activedescendant`.
- Typing filters with `Intl.Collator` at base sensitivity, so case and accents do not matter. An item matches on its `textValue` or, without one, on its whole text at mount, description included: "slice" finds Substring. A group without matches stays in the DOM with `hidden`: `getByText` still finds its heading, `getByRole` does not.
- The first match is highlighted at once: typing a name and pressing Enter picks it. Escape closes the list.
- jsdom does not implement `scrollIntoView`, which Reka UI calls on the highlighted option, so the test setup stubs it. Since step 24 it also stubs the pointer capture that a toast asks about when a press inside it ends. Nothing else needed a stub: floating-ui, which positions the list, uses a `ResizeObserver` only where one exists.

Accessibility (D15, built in step 16):

- Each step is a `fieldset` whose legend names the step.
- Descriptions and errors are linked to their fields through `aria-describedby`, with ids from `useId`; a wrong value also sets `aria-invalid`.
- An `<output aria-live="polite">` under the Output heading says in one sentence how the latest run went: "All 2 steps ran." or "Step 2, Replace, needs a value." It leaves the output out, so typing does not repeat it at every pause, and it keeps the previous sentence while the next run is on its way. A second live region confirms a copy, which a changed button label alone does not announce.
- After an edit the focus keeps the user's place. A new step's first field takes it (the step itself when it has no fields). After a removal, the step that took its place takes it, or the search field once the last step is gone. After a move, the button that moved the step keeps it, or the step itself once that button no longer applies at an end of the chain. The controller decides where (`model/focus.ts`); the component that owns the place focuses it once the DOM has updated (`composables/useFocusRequest.ts`).
- The picker's list opens next to its search field, inside the page's landmarks, instead of in a portal at the end of the body.
- Windows contrast themes drop box shadows, which carry the focus rings here; outlines in system colours take their place. The search field of the picker shows a focus ring too, which the copied combobox lacked.
- The end-to-end tests run axe on the editor with an error and the list open, walk every stop of the Tab key and check that each one shows the focus, and check the focus outline in a contrast theme.
- Since step 21: the theme is a radio group, a single stop of the Tab key before the input, where the arrow keys move the choice. axe runs in the dark theme too. For people who ask their system for less motion, a rule outside the cascade layers stops every animation and transition.
- Since step 22: the language select is the first stop of the Tab key, and axe runs on the page in German. The copied combobox input sets `aria-controls` and `aria-activedescendant` only while its list shows, as WAI-ARIA asks: Reka UI kept both after the list had closed and left the page, pointing at nothing, which axe reported once a scenario ran it after the list was closed.

Turning a step off (D48, step 19). Each step has a switch named "Run step 2". A step that is off keeps its place and its values, and `model/run` leaves it out of the request, so the text passes through it unchanged; an older result for its id is not shown. Its card says Off, gets a dashed border instead of a lighter colour, which would push its text below 4.5:1, and says that the text passes through. The live region counts it: "1 of 2 steps ran; 1 is off." The kit's switch was changed in two ways. Off, shadcn-vue draws a light grey track, 1.26:1 against the card, below the 3:1 that WCAG 1.4.11 asks of a control; ours is outlined in the muted text colour, 4.75:1. In a Windows contrast theme, system colours paint the thumb and the track that is on, which the theme would otherwise paint in the card's colour: an end-to-end test checks the thumb.

The chain in a link (D49, step 19). `model/link` writes a chain as `#chain=` and its JSON in UTF-8 and URL-safe Base64; the JSON is a run request without step ids, and a step that is off says `"enabled": false`. Reading a link checks it with zod, then against the catalog: an unknown transformation stops it with a message, values without a field are dropped, and a value that does not fit its field, by type or as a choice, gets the field's default. The store's `load` gives the steps new ids (D40). `useChainLink`, called by the editor's controller:

- reads the address once the catalog is there, and again on `hashchange`, as when another link is followed in the same page or Back returns to one; an address without a chain then means an empty one;
- writes the chain back with `history.replaceState` 300 ms after the last edit, so typing adds no history entries and stays under Safari's limit of 100 changes in 10 seconds; a write still waiting when the editor goes away is cancelled;
- leaves an empty chain without a fragment, so the plain address stays plain.

Copy link copies a link built from the chain itself, not from the address, which may still be waiting for its pause. A link that cannot be read shows an alert above the editor, which goes away with the next edit.

Examples (D50, step 19). `api/contract` checks the catalog's examples like its transformations: unique ids, and only transformations and parameters that the catalog has. Each step then gets a value for every field, the example's or the field's default, as a step added from the picker has. The controller turns each example into a link to its chain (`model/link`), and the view lists those links under the search that adds steps: a click follows the link, `useChainLink` opens the chain, and Back returns to the one before. They sit after the search, not above the input, so the input stays the first stop of the Tab key; for the same reason Copy link moved from above the input to the output's header, next to Copy.

Themes (D51, step 21). `useTheme` wraps VueUse's `useColorMode`: the choice, `light`, `dark` or `auto`, is kept in `localStorage`, and `light` or `dark` goes on `<html>`. The tokens under `.dark` are shadcn-vue's neutral dark palette, with Tailwind's green-500 for an executed step; the copied components' `dark:` utilities, idle until now, follow the same class, and `color-scheme` darkens what the browser draws itself. A small script in `index.html` applies the same rule before the first paint, so a dark page does not flash white while the app loads; a unit test runs that script in a Node sandbox, and an end-to-end test blocks the app's own scripts and finds the page dark all the same. The switcher is Reka UI's radio group in the look of a segmented control. In a Windows contrast theme the chosen option is filled with Highlight and opts out of the backplate the theme draws behind text, which otherwise hid its label.

Languages (D52, step 22). The app's own texts are in `src/i18n/`, one file per language. English is the type of the others, so a text missing from German or Russian does not compile, and a unit test checks that each one takes the same values. vue-i18n runs with the Composition API only; its build flags in `vite.config.ts` leave the legacy API out of the bundle.

- `initialLanguage` takes the stored choice, else the first of `navigator.languages` that the app speaks, else English. `useLanguage` switches the language and stores the choice, and the shell keeps `<html lang>` in step, so a screen reader reads the page in the right voice.
- Models that write texts, such as the status labels, the run summary and the messages of a failed call, take vue-i18n's `t` as an argument and stay plain functions. A link that cannot be opened is a `LinkProblem`, data until the controller words it, so its alert follows a change of language.
- Both calls send `Accept-Language`, and the language is part of both query keys: choosing another one fetches the catalog and runs the chain again in it. Meanwhile the editor keeps the catalog it has (`keepPreviousData`), so it stays on the page.
- Russian takes one of three plural forms, which `Intl.PluralRules` picks from Unicode's CLDR data; where a count could take any form, the text puts it after a colon, as the server's Russian texts do.
- The select is the browser's own, with each language named in itself and marked with its `lang`, so a reader finds theirs whatever the page is in.
- In tests every component gets English through Vue Test Utils' global plugins, a new instance per test. The end-to-end helpers find elements by the app's texts in all three languages, and Playwright runs in `en-US`, since it would otherwise take the system's language.

With vue-i18n the one bundle passed Vite's warning size of 500 kB, so the libraries went into a `vendor` chunk of their own (442 kB, 70 kB for the app). Browsers keep it cached across the app's updates. SortableJS and Reka UI's toasts brought it to 499 kB, so since step 24 Vue has a chunk of its own: `vue` 115 kB, `vendor` 384 kB, the app 74 kB.

Layout (D53, steps 23 and 24).

- The shell is a column as high as the window: the header; a white band with the card that holds the input and the search with the examples; the steps, the only part with `overflow-y: auto`; and the output as the footer. The parts that stay are white, like the header, and the steps scroll on the page's grey. They are neighbours, not `position: fixed` or `sticky`, so nothing lies over the content, and a field that takes the focus is scrolled into view inside the steps, never under a bar (WCAG 2.4.11). The tab order follows the page: the header, the input, the search, the examples, the steps, the output's buttons.
- The `shell` variant in `index.css` turns this on in a window at least md wide and 40rem high: measured in Chromium, the steps get 255 pixels in a laptop's window of 1366 × 650, and 405 in one of 1280 × 800. In a smaller window, such as a phone held either way, the page scrolls as a whole, in the same order: fixed parts there would leave the steps a strip.
- To keep the fixed parts small, the input grows with its text up to 128 pixels (`field-sizing: content`) and then scrolls, and the output's box stops at 128 pixels as well. An empty chain shows a line that points at the search and the examples.
- In step 23 the output scrolled with the steps, and the two live regions next to its buttons, positioned absolutely with nothing positioned between them and the page, sat below the window and made the whole page scroll; the part that scrolls had to be relative. With the output in the footer nothing of the kind is left there. An end-to-end scenario checks that the page itself never scrolls, with steps below the window; with the old layout and without the fix it failed by 713 pixels.
- `scrollbar-gutter: stable` keeps the room for the scroll bar, so the cards do not shift when the chain grows past the window. The `page-width` utility gives the header, the card, the steps and the footer the same width, up to Tailwind's 2xl breakpoint, 1536 pixels.
- The steps are a grid of two columns from lg up, filled row by row, so the chain reads as text does; the cards in a row share their height. A step's fields go into two columns once the card is 32rem wide, a container query, so a card at half the window's width keeps them in one.
- The header is a grid from sm up: the title with the tagline, and the settings, which keep their own column; a long tagline wraps inside its column. Below lg the theme options show only their icons, with their names for screen readers, and stay 24 pixels high, the least size of a target in WCAG 2.5.8. Measured in Chromium, the header is the same in all three languages from 700 pixels up; below that only the tagline's lines differ.
- The favicon is an SVG: three steps of a chain, the middle one in the green of an executed step. A PNG of 32 pixels, rendered from it in Chromium, serves browsers that do not take an SVG icon.

Drag and drop (D54, step 23).

- SortableJS 1.15 drags a step by the handle in its header. `useDragToReorder` makes one SortableJS for the list's element, a new one when the list comes back after its last step went, and destroys it with the list. On a desktop SortableJS uses the browser's own drag and drop; on a touch screen it drags a copy, at the end of the body so that the part that scrolls does not cut it off. Near the edge of the part that scrolls, it scrolls.
- SortableJS moves the dragged element in the DOM itself, but Vue renders the list from the state. At the drop the composable puts the element back in front of the node that followed it when the drag started, and reports the move as two positions; the view turns the first into the step's id, the store moves the step with `moveStepTo` from `model/chain`, and Vue moves the element. The node in front of which it goes back matters: Vue marks the end of a list with an empty text node, and an element put back by its position, after the last of the others, would land behind that mark, where Vue no longer looks for it. A unit test plays SortableJS's part and fails with such a way back.
- `moveStep`, the buttons' move by one place, is now `moveStepTo` the position next to the step.
- The handle shows only while the step can move. It is `aria-hidden` and not a stop of the Tab key: the buttons move a step from the keyboard and with a single tap, which WCAG 2.5.7 asks of anything done by dragging. Pressing on the handle gives the card the focus, which it can lose while Vue moves it; the controller gives it back.
- For people who ask for less motion, the global rule that shortens transitions also stops SortableJS's animation, which is a CSS transition.
- SortableJS needs a layout, which jsdom does not have, so the unit and component tests use a stand-in (`tests/helpers/sortable.ts`) and play SortableJS's part; an end-to-end scenario drags a step in Chromium and checks that the chain runs in its new order.

Notices (D55, step 24).

- A run that failed as a whole and a link that could not be opened were alerts in the page; they are now toasts. `PipelineEditorView` holds Reka UI's `ToastProvider` and places its `ToastViewport`: fixed to the bottom of a phone's screen, and in a window with the fixed parts at the bottom right of the steps, so a notice never covers the output. `EditorNotices` turns the view's `runAlert` and `linkProblem` props into toasts through the provider's store (`useToastManager`), and renders them.
- One toast per kind, by id. Another message updates the toast and starts its 8 seconds again; the same message, as from a server that stays down, changes nothing, so the toast still goes and a screen reader does not hear it again. When the prop goes back to `null`, after a run that succeeds or an edit after a broken link, the toast closes.
- Try again, when another try can help, is the toast's action. Reka UI asks for an alternative for screen readers, since the toast goes away: changing the chain runs it again.
- Reka UI gives each toast its place in the stack as variables (`--reka-toast-index`, `--reka-toast-offset-y`, `--reka-toast-height`, and the frontmost height on the list) and marks a spread-out stack with `data-expanded`. `.notice-toast` in `index.css` reads them: collapsed, the older toasts sit 10 pixels above the newest, 5 % smaller each and blank; spread out, each sits above the newer ones. A toast slides in from below, fades out, and follows a swipe to the right. The rule that shortens motion for people who ask for less covers these transitions too.
- Reka UI announces a toast through a live region of its own, assertive for an error, with the provider's label first: "Notification". axe found the description's red at 90 % below 4.5:1 on a white card, in the toasts and in shadcn-vue's destructive alert, which the catalog's failure still uses; both use the full red now.
- A component test plays the timers with Vitest's fake ones: a toast goes after 8 seconds, the same message again keeps its time, another starts it again. An end-to-end feature makes the runs fail with Playwright's `route`, runs axe with a notice on screen, waits for it to go, and checks the stack and its spreading out.

Offline (D56, D57, step 26).

- vite-plugin-pwa writes `manifest.webmanifest` and, with Workbox, `sw.js` into the build, and adds to `index.html` the manifest's link and a script that registers the worker once the page has loaded. The icons are PNGs rendered from the favicon in Chromium: 192 and 512 pixels as it is, and for the maskable and the Apple icon a square filled to its edges with the chain at 80 %, inside the safe zone that a platform's mask leaves.
- The worker keeps the built files (the scripts, the stylesheet, `index.html`, the icons) and answers a navigation to `/` with `index.html` from them. Only `/`: in Docker the API and Swagger UI share the origin (D22), and a worker that answered every navigation would show the app in their place.
- `GET /api/catalog` goes through NetworkFirst with a timeout of 3 seconds: the server's answer when it comes in time, else the copy kept from the last time; an answer that comes late still updates the copy. The server sends `Vary: Accept-Language` (D52), so the browser's cache keeps one copy per language. `POST /api/runs` passes the worker untouched.
- On a first visit the catalog loads before the worker exists. `keepCatalogForOffline` waits until the worker takes the page over (`clientsClaim`, then `controllerchange`) and loads the catalog once more, through it.
- A new version installs in the background, takes over at once (`skipWaiting`) and deletes the old files. The page that is open goes on with the files it loaded, which are all of them; only the catalog comes later, and the new worker serves it the same way. The next page that opens is the new version.
- Spring Boot serves the manifest as `application/octet-stream`, since its servlet container has no type for `.webmanifest`; browsers read a manifest whatever its type.
- `npm run dev` registers no worker. The end-to-end tests block service workers, through the test in `e2e/support/test.ts`, which reads the scenario's tags: Playwright's routes do not see what a worker answers, and a reload would take the app's files from its cache, so a feature that stands in for the server or blocks the app's scripts would test something else. The scenarios tagged `@service-worker` allow it: the app opens offline once it has been open, and `/api/catalog` stays the server's JSON. Three mutations each failed a scenario: the catalog from the network only, every navigation answered with the app, and no second load of the catalog.
- A run waits for the network (D57). TanStack Query's network mode `online` holds a request, or the retry of one that failed, while its `onlineManager` says the browser is offline, and sends it once the browser is back; meanwhile the query's fetch status is `paused`. `usePipelineRun` counts a paused run as updating, so the previous result stays marked as not current, and passes the pause on as `waitsForNetwork`. The output says "Waiting for the network" instead of "Updating", and `EditorNotices` shows a notice of its own, grey with a sign of the network and polite for a screen reader, since it is not an error; the network coming back closes it. Before step 26 a held run did not count as updating, and the editor showed the previous result as the current one; a unit test showed it before the fix.
- `onlineManager` learns of the network from the browser's `online` and `offline` events only, and starts as online, so a page that opens without the network sends its run, and the run fails. Since step 27 such a run waits as well: while `navigator.onLine`, read through VueUse's `useOnline`, says the browser is offline, a run that could not reach the server is not tried again (`shouldRetry`), counts as waiting for the network, and raises no error notice, and the browser's `online` event sends it again. The flag counts only after a request failed: a wrong `false` changes nothing while the network works, whereas telling `onlineManager` at the start would hold every run.
- The axe step of the end-to-end tests waits until finite animations end: with a notice still fading in, axe measured its grey text at 3.2:1 instead of 4.7:1.

Proof of R2.1 (D19): an integration test serves a catalog with a transformation the frontend has never seen, with an unfamiliar mix of parameters, and checks that its form renders and runs.

## 8. Tests

| Layer                | What                                                                                                       | Where                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Library              | each transformation, each trap (parameterized), parameter checks, pipeline rules, limits, texts            | `library/src/test`               |
| Server               | catalog and runs against `contract/`, request errors, a `failed` run, languages, ArchUnit                  | `server/src/test`                |
| Frontend unit        | model functions, zod parsers on `contract/`; the store; queries and the controller inside a test component | `frontend/src/tests/unit`        |
| Frontend component   | each view with full props, events through `vi.fn()`, found by role and name                                | `frontend/src/tests/component`   |
| Frontend integration | containers on a stand-in API: the keyboard path, the R2.1 proof, failures                                  | `frontend/src/tests/integration` |
| End to end           | Gherkin features against the real API and the built app (D23)                                              | `frontend/e2e`                   |

The stand-in API (`src/tests/helpers/api.ts`) runs on MSW (D33). It serves a catalog and runs Replace and Append by the rules of D42, so a test reads like a session: type a text, add a step, read its output. It computes its answers instead of replaying canned ones, and the app parses them with its own contract schemas, so it cannot drift from the wire format unnoticed. A gate holds a response back to look at the editor while a run is on its way.

The end-to-end tests (step 15) are Gherkin features, run by Playwright through playwright-bdd: the brief's chain (`@smoke`), a pattern that Java cannot compile, with the server's message at its field, and an emoji that Substring keeps whole. Playwright starts the API with Gradle on port 8091 and the built app with `vite preview` on port 4191, whose proxy reaches that API through `API_PROXY_TARGET`; development servers on 8080 and 5173 are never touched. The steps find elements by role and name, and read texts inside them. A second feature (step 16) checks accessibility: axe, the stops of the Tab key and a contrast theme. A second Playwright project, `npm run screenshots`, takes the pictures in `docs/images` from the same running app. Since step 22 the helpers find elements by the app's texts in any of its three languages, and a feature runs the editor in German and Russian against the real API (D52). Since step 23 a feature checks the layout in windows of given sizes: what stays in view while the steps scroll, that the page itself never scrolls in a window large enough for the fixed header and footer, and that the header is as high in all three languages (D53). A scenario of the chain feature drags a step to another place (D54). Since step 26 service workers are blocked, except in the scenarios tagged `@service-worker`, which take the browser offline (D56); a third scenario of that feature takes the browser offline and back while a run waits for the network, and since step 27 a fourth opens the page offline and brings the network back (D57).

## 9. Points approved at the design review

The developer approved these three points in step 8, before any feature code was written:

1. `GET /api/catalog` with limits, instead of a bare list of transformations: one call gives the frontend everything it needs to build the editor.
2. Checking every step's parameters even after a step that cannot run (refines D12).
3. Caps of 10,000 characters per text parameter and 1,000,000 characters per step output.
