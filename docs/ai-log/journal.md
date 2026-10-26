# Journal

What happened at each step, written for people. [agent-log.md](agent-log.md) has the same steps in a form meant for agents.

## Step 1. Understand the brief (2026-10-22)

**Asked.** Read the brief and the email it came with, and explain in plain words what has to be built. Before that, the developer had shared their written working conventions from earlier projects (process, code patterns, commit style); the assistant follows them in every step.

**AI did.**

- Read the PDF brief and the email. The email sets the deadline, one week (2026-10-29), and adds no requirements.
- Numbered the requirements R1.1–R4.4, since the brief has no IDs ([requirements](../requirements.md)).
- Said that R2.1 mirrors how KNIME builds its node dialogs: the settings are described on the Java side, and Vue generates the form. When the developer asked whether the assistant really knew what KNIME does, it checked instead of answering from memory. Several GitHub pages returned 404, so it read the npm registry entry of `@knime/jsonforms`, described as the KNIME JSON Forms integration built on `@jsonforms/vue`, which renders a dialog from a JSON schema, a UI schema and data.

**Decided.** R2.1 is the requirement reviewers will look at first. Our form description (D18) follows KNIME's own approach with a smaller renderer.

**Checked.** The statements about KNIME against the npm registry.

**Commit.** None. The requirement list is committed in step 7.

## Step 2. Ambiguities and decisions (2026-10-22)

**Asked.** A table of ambiguities with a decision for each. The developer's main frontend stack is React, so the Vue code should be easy to navigate for a React developer.

**AI did.** Proposed D1–D25 in five groups, a list of text traps that each become a test, the out-of-scope list and three extras for after the brief. Proposed a deliberately simple Vue style: no store, plain HTML elements, no `provide`/`inject`. Asked which web framework the developer knows, and whether development should move to a separate session so its log can be shared whole.

**Decided.** The developer chose Spring Boot (D17) and agreed to separate sessions (D25). They turned down the simplified Vue style, which led to step 3.

**Commit.** None. Recorded in step 7.

## Step 3. Frontend and Java architecture (2026-10-22)

**Asked.** Write the Vue code at a senior level: idiomatic patterns, but clean and explainable.

**AI did.** Added D26–D31: model, controller, view and container per component; forms from a registry of field components; plain HTML plus a headless combobox; no global store; a Java model built on sealed interfaces and records; ArchUnit for the module boundaries. Mapped each React pattern the developer knows to its Vue counterpart, for example a composable for a custom hook, `defineModel` for controlled or uncontrolled state, `onErrorCaptured` for an error boundary, `vue-tsc --build` for `tsc -b`.

**Decided.** D26, D27, D30 and D31 as proposed. The developer questioned D28 and D29 next.

**Commit.** None. Recorded in step 7.

## Step 4. Libraries (2026-10-23)

**Asked.** Should the UI and the global state use libraries? Use modern approaches where they are justified. Keep the AI log step by step, in two parallel tracks: one for another agent, one for people.

**AI did.** Checked current versions and licenses on the npm registry: pinia 4.1.0, @tanstack/vue-query 5.104.5, reka-ui 2.11.0, shadcn-vue 2.8.2, @vueuse/core 15.0.0 and msw 3.0.3 are MIT-licensed; `@knime/components` 2.0.0 is "GPL 3 and Additional Permissions"; primevue 5.0.4 points to its own license file. Revised D28 (shadcn-vue on Reka UI) and D29 (TanStack Query plus a Pinia setup store), added D32 (VueUse) and D33 (MSW), and designed this log.

**Decided.** All of it, with one rule: a modern tool needs a written reason in the decision log.

**Commit.** None. Recorded in step 7.

## Step 5. Backend scaffold (2026-10-23)

**Asked.** Create the project step by step, following the commit order of the developer's earlier projects: the project first.

**AI did.**

- Looked up current versions instead of relying on memory: Spring Boot 4.1.2 with Java 25 from Spring Initializr's metadata, Gradle 9.8.2, Error Prone 2.51.0, NullAway 0.14.3, JSpecify 1.0.1, Spotless 8.10.4, palantir-java-format 2.102.0, and the JUnit (6.0.3) and AssertJ (3.27.7) versions that Spring Boot 4.1.2 manages.
- Generated a reference project with Spring Initializr in a scratch folder and reused its Gradle wrapper. The wrapper jar's SHA-256 matched the one published on services.gradle.org; the distribution's SHA-256 went into `gradle-wrapper.properties`.
- Found no JDK on the machine. Downloaded Temurin 25.0.4.1, verified its SHA-256 and unpacked it into the user's JDK folder without touching PATH.
- Wrote the build: `library/`, `server/` and the shared conventions in `buildSrc/` (D34, D35).
- Checked that the strict settings really fail the build, with throwaway probe files deleted afterwards: a `return null` failed through NullAway, a raw `List` through `-Xlint:all -Werror`, a `toString()` without `@Override` through Error Prone. A `split(",")` passed: Error Prone's `StringSplitter` check is off by default, so splitting text into lines needs tests of its own.

**Checked.** `./gradlew build` green: compilation with all checks, formatting, 1 test (the Spring context starts). The first build took about 7 minutes, mostly downloads.

**Commit.** `8b41a2a chore: scaffold Gradle build with Java 25 library and Spring Boot server`

## Step 6. Frontend scaffold (2026-10-23)

**AI did.**

- Generated a reference project with the official create-vue 3.24.0 in a scratch folder to see the current conventions, then wrote a clean scaffold modelled on it: Vite 8, Vue 3.5, TypeScript 6 (D37), Vitest 5, Tailwind CSS 4, oxlint plus ESLint, Prettier (D36).
- Found two copies of DOM Testing Library: `@testing-library/vue` 8.1 depends on version 9, while `jest-dom` 7 and `user-event` need 10. Added an npm override; it took effect only after the lockfile was regenerated.
- `npm audit` reported four high-severity findings, all one advisory: GHSA-vfj7-8cjw-p6xm in `braces`, reached through `@vue/eslint-config-typescript`. The package runs only at lint time, no fixed release exists, and `npm audit --omit=dev` is clean, so the risk was accepted and listed in the README (D39).
- Probes, deleted afterwards: `any`, a non-null assertion, a floating promise, the Options API and an `img` without `alt` failed ESLint; an `enum` and an unchecked array index failed `vue-tsc`. Oxlint printed nothing at all, so a probe with `debugger` and `x === NaN` confirmed that it runs and simply stays silent on clean code.
- Noticed that `vue-tsc --build` re-checks every project on each run despite `noEmit`; the official template behaves the same. Left as is: correctness is unaffected, and the check takes about a second.

**Checked.** `format:check`, `lint`, `typecheck`, 1 test, `build`: all green.

**Commit.** `03aa8b0 chore: scaffold Vue 3 frontend with strict TypeScript, Vite and Vitest`

## Step 7. Requirements, decisions and this log (2026-10-23)

**Asked.** Set `JAVA_HOME` for the developer's account, then write the docs.

**AI did.** Set `JAVA_HOME` at user level. Wrote `docs/requirements.md`, `docs/decisions.md` and this log. The decision texts were taken from the planning transcript rather than reconstructed from memory, then translated and tightened. D25 and D31 were revised to match what actually happened, and D34–D39 record the choices made while scaffolding.

**Checked.** Prettier over all Markdown; every relative link resolves.

**Commit.** `7db207e docs: requirements, decisions and the AI usage log`

## Step 8. Design (2026-10-23)

**Asked.** The next step, a design to approve before any feature code. The developer chose to continue in the same session instead of starting a separate one.

**AI did.**

- Wrote [design.md](../design.md): the API (`GET /api/catalog`, `POST /api/runs`), the step statuses and run rules, request errors as Problem Details with JSON pointers, four parameter kinds as a JSON Schema subset, the first six transformations with their exact parameters, the library's packages and types, the server's mappings, the frontend's component tree and data flow, and the test plan.
- Wrote the contract in `contract/`: the catalog and three request and response examples, which the Java and the TypeScript tests will both read.
- Probed Java 25 before relying on it. `BreakIterator` counted 👍🏽🇩🇪, an e with a combining accent, and x as 4 characters. `Pattern.namedGroups()` exists. The replacement `$5 off` threw "No group 5" on a text with a match but returned `abc` unchanged on a text without one, so the library will check group references itself. The example outputs were recomputed in Java.
- Added D40–D46 and refined D12 and D25.

**Decided.** The developer approved the three open points: `GET /api/catalog` with limits, checking every step's parameters even after a step that cannot run, and the size caps of 10,000 characters per text parameter and 1,000,000 per step output.

**Checked.** Every contract file parses as JSON; Prettier; every relative link resolves.

**Commit.** `5561057 docs(design): API contract, transformations, library and frontend design`

## Step 9. The library (2026-10-23)

**Asked.** Commit the approved design, then build step 9, the library.

**AI did.**

- Wrote the API package as designed: the parameter kinds, the raw values, the results as sealed interfaces with records, `Pipeline` with its three stages, `Catalog` and `Limits`. The six transformations live in a package of their own behind `BuiltIns`, and their classes are package-private.
- Parsed Regex replace's replacement itself instead of handing it to `Matcher.appendReplacement`. Every group reference is then checked before the step runs, and the output cap is checked before a long group is copied. A parity test runs 21 replacements through both our parser and Java's and expects the same ones accepted and the same output.
- Made `javac` read sources as UTF-8 explicitly, since the code and tests contain Ä, € and emoji.
- Error Prone stopped the build three times, and each fix improved the code: `BadInstanceof` for `x instanceof Integer` used as a null check, `MissingSummary` for doc comments that started with `@throws`, and `AvoidCommonTypeNames` for nested test classes called `Integer` and `Boolean`.
- The first backtracking test failed: Java 25 answered `(a+)+$` at once. A jshell probe showed that its regex engine also handles `(a|aa)+$`, `(x+x+)+y` and `(a?){n}a{n}` instantly, because it remembers failed positions in nested loops, while a counted repeat of a wildcard, `(.*a){30}`, ran for more than 8 seconds on 129 characters. The tests use that pattern now, and the time limit stays.
- While writing the per-step output cap, noticed that 50 steps of up to 1,000,000 characters each would still make a huge response, and added a cap for a whole run: 10,000,000 characters.

**Decided.** D21, D31 and D45 refined; the design's message table now lists the exact texts.

**Checked.** `./gradlew build`: 135 library tests and the server's 1 green, formatting clean, Error Prone and NullAway clean.

**Commit.** `dcd495d feat(library): transformations, parameters and the pipeline with tests`

## Step 10. The web API (2026-10-23)

**Asked.** Build step 10, the web API.

**AI did.**

- Added springdoc-openapi 3.1.1, which is built against Spring Boot 4.1, and ArchUnit 1.5.1, after checking both on Maven Central.
- Wrote `GET /api/catalog` and `POST /api/runs` as designed. `ParameterSchemas` maps every parameter kind to JSON Schema with an exhaustive switch, `RunRequestReader` collects every request error with its JSON pointer, and `RunResponse` maps every step result with an exhaustive switch. The request checks are plain code rather than Bean Validation annotations, because the rules need the catalog or several fields at once.
- Looked up the Spring Boot 4 and Jackson 3 names in the jars instead of guessing them: `@WebMvcTest` moved to `org.springframework.boot.webmvc.test.autoconfigure`, and Jackson 3 says `isString()` and `propertyNames()` where Jackson 2 said `isTextual()` and `fieldNames()`.
- Two tests failed at first, both on Problem Details: Spring 7 leaves out `"type": "about:blank"`, which RFC 9457 defines as the default when `type` is missing. The contract and the design now follow the RFC. A third assertion compared a JSON path value (a map) with a record; it now converts the value first.
- Found the cause of the JVM's class-data-sharing warning in the server tests: Spring's test support attaches Mockito's agent at runtime when Mockito is on the classpath. The server tests mock nothing, so Mockito is excluded from their classpath, and the warning is gone.
- Started the real server with `bootRun` and called it with curl: the catalog, both run examples and the 400 example answer as the contract says, Swagger UI loads, and the OpenAPI document carries the `status` discriminator.

**Decided.** D23 and D41 refined.

**Checked.** `./gradlew build`: 161 tests green, 135 in the library and 26 in the server.

**Commit.** `aacb5a6 feat(server): catalog and run endpoints with Problem Details and OpenAPI`

## Step 11. The frontend model (2026-10-25)

**Asked.** After trying the API in Swagger UI, continue with the frontend, starting with its model.

**AI did.**

- Added zod 4.6.7 and MSW 3.0.3, after checking both on the npm registry.
- Wrote the domain in `src/model/`: the catalog; form fields from JSON Schema, where an unknown kind becomes `unsupported`; the chain as pure functions that return the same object when nothing changes; the run request and the results by step id; and request errors placed at the input, a step or a field.
- Wrote `src/api/`: zod schemas of the wire format that turn into the domain in one pass, with a strict envelope but open parameter schemas and Problem Details; and a client whose every outcome is data, except a cancellation, which rejects as `fetch` does.
- Moved the chain model from the editor's folder to `src/model/`, because the store uses it too (D26 refined).
- Fixed three things the checks found. MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame`. Vite rewrites ``new URL(`…${name}`, import.meta.url)`` into asset imports of a whole folder, which failed for `contract/` outside the frontend's root, so the test helper builds the path with `node:path`. Oxlint asked the cancellation test to name the error it expects.
- Probed MSW with a request no test had prepared: it never reached the network; MSW logged an error and the client returned a network error. The setup comment had claimed such a test would fail; it now says what actually happens.
- `npm audit` came back clean: GitHub withdrew GHSA-vfj7-8cjw-p6xm on 2026-10-23, a few hours after step 6 recorded it, so the README's Known issues section is gone.

**Checked.** `format:check`, `lint`, `typecheck`, 45 tests in 7 files (44 new), `build`; `npm audit` clean.

**Commit.** `6f199f3 feat(model): catalog, chain and run models with contract-checked parsing`

## Step 12. The UI primitive (2026-10-25)

**Asked.** Check the UI primitive before building on it.

**AI did.**

- Checked the current versions on the npm registry, ran `init` of shadcn-vue 2.8 in the project, and read its diff before keeping anything. Its preflight looks for the `@/` alias in the root `tsconfig.json`, so that file now repeats the alias for tools.
- Did not keep three things `init` did. It made the shadcn-vue CLI a runtime dependency just to import one CSS file, which brought in the CLI's whole dependency tree and 8 `npm audit` findings, 2 of them high. The CLI is gone, and the nine state variants and one utility from that file, which shadcn-vue's components rely on, are copied into `index.css` with their MIT source named. It imported the Geist font from Google Fonts, under a font-family name that did not even match; the app now uses the system font stack and makes no third-party request (D47). `components.json` no longer names a font, since the CLI's `add` would otherwise write the import back. It added theme tokens for sidebars, charts and a dark mode, none of which this app has.
- Checked the new `cn` package before keeping it: it lives in the shadcn-ui organisation on GitHub, under the MIT licence, and has no dependencies.
- Read the sources of Reka UI's combobox. It is built on Reka's listbox. It filters with `Intl.Collator` over each item's `textValue` or, without one, the item's text when it mounts; hides an empty group with the `hidden` attribute; positions the list with floating-ui; and scrolls the highlighted option into view with `scrollIntoView`.
- Wrote seven probe tests against the shadcn-vue combobox in jsdom, then deleted them. They first failed on `scrollIntoView`, which jsdom lacks. With a stub, they confirmed the ARIA attributes, filtering that ignores case, search in descriptions, hidden empty groups, Enter on the first match, and Escape. They also found two unlabelled `role="group"` wrappers around the search input. A second probe showed that a `ResizeObserver` stub is not needed: floating-ui uses one only where it exists.
- Kept the `scrollIntoView` stub in the test setup, removed the unlabelled group roles from the copied components, and made the copies pass the strict lint. Two rules are off for their folder: single-word names, and form labels. The label rule now knows the kit's text controls by name, so it checks their labels where they are used; a probe confirmed it. Like a native input, an `<Input>` without `type` escapes that rule. `vue/require-default-prop` is off everywhere, since TypeScript already types an optional prop as possibly `undefined`. Everything else was fixed in the code, except the input-group addon's click-to-focus for the mouse, which keeps a commented exception.

**Decided.** D28 confirmed and refined; D47 added.

**Checked.** `format:check`, `lint`, `typecheck`, 45 tests, `build`; `npm audit` clean.

**Commit.** `5fe6adf chore(ui): shadcn-vue kit on Reka UI, checked by probe tests`

## Step 13. The UI (2026-10-25)

**Asked.** Build the UI on the model.

**AI did.**

- Added Pinia 4.1 and TanStack Query 5.104 after checking them on the npm registry. Pinia 4 brings a new dependency, `nostics`, a diagnostics library maintained by the authors of Pinia, VueUse and Nuxt. npm 11 now blocks install scripts that `package.json` does not approve; vue-demi's, which only switches files for Vue 2, is denied in `allowScripts`.
- Built the editor of design section 7: a Pinia store for the chain, queries for the catalog and the runs, and the editor's controller, view and container (D26). The controller is the only code that touches the store and the queries.
- The parameter form comes from the catalog (R2.1, D27). A registry maps each field kind to a component, and its type fails the build when a kind has no component. `FieldShell` gives every field its label, description and message, linked with `aria-describedby`.
- Added checkbox, native select and alert through the shadcn-vue CLI. This time the CLI changed neither `index.css` nor the dependencies. Fixed the emit type of the native select.
- Failed calls: a query function throws them as `ApiFailure`, and only an unreachable server is retried, twice. A rejected request puts its messages at the input, the step or the field; anything else becomes a banner.
- Ran the app against the real server in headless Chrome, through a throwaway Playwright script outside the repository, and looked at screenshots at desktop and phone width. That caught a bug the tests had not: the "Updating" mark never went away. `refDebounced` keeps its value in a deep `ref`, which wraps the request in a reactive proxy, so the sent request never equalled the latest one by identity; `watchDebounced` now writes into a shallow ref (D32 revised). The screenshots also showed a checkbox description pushed down by the grid, and a Copy button that was active for empty output.
- Ran axe-core in the same browser: no violations in the editor, and one best-practice notice while the picker is open, because its list is rendered at the end of `body`, outside the page's landmarks. That is left for step 16.
- Kept the status colours readable. On a tinted badge, red text drops to about 4.4:1, so the badges are outlined, and `--success` (Tailwind's green-700, 5:1 on white) joined the theme tokens.
- ESLint's label rule wanted every label both to wrap its control and to point at it with `for`. It now accepts either, as HTML does.
- Added 28 unit tests: the store, the retry policy, and the pure functions of the components. The App test now renders with the store and the query client and gets the catalog from MSW. Behaviour tests of the views and containers come in step 14.

**Decided.** D29 refined, D32 revised, D39 extended.

**Checked.** `format:check`, `lint`, `typecheck`, 73 tests in 13 files, `build`; `npm audit` clean. In the browser, the brief's chain gives "Real Python!".

**Commit.** `34be9ca feat(ui): pipeline editor with schema-driven forms`

## Step 14. The behaviour tests (2026-10-25)

**Asked.** Test how the UI behaves: views, containers, the whole path from the keyboard.

**AI did.**

- Wrote a stand-in API for the tests on MSW (D33). It serves a catalog and runs Replace and Append by the rules of D42, computing each answer from the request instead of replaying a canned one. The app parses its answers with its own contract schemas, so the stand-in cannot drift from the wire format unnoticed. A gate holds a response back, to look at the editor while a run is on its way.
- Component tests render each view with full props and check its events with typed `vi.fn()` mocks, finding everything by role and name: the step card, the form with a field of every kind, the picker, the input, the output and the editor's view (45 tests).
- Unit tests run the run query and the editor's controller inside a test component, Vue's counterpart of `renderHook`. They show that a burst of edits sends one request, that a request still on its way is aborted when a newer one goes out (D11), that the previous result stays meanwhile, and that undoing an edit shows the earlier result without a new call (14 tests).
- Integration tests render the editor on the stand-in API. One builds the brief's chain and reorders it with the keyboard alone, asserting where the focus is at each step. One proves R2.1: a catalog with a transformation this frontend has never seen, with an integer, a one-character text, a three-way choice, a checkbox and a parameter of an unknown kind; its form renders, and the server receives the typed values. Others cover a catalog that fails to load, a server that cannot be reached during a run, and a rejected request whose errors land at the input and at a field. The App test now also checks the error boundary.
- Every workaround from step 13 is pinned by a test that fails if a library changes under it: the picker's empty value (the same transformation twice in a row), the shallow ref behind "Updating", and Vue reading an empty number field as ''.
- The copy test showed how VueUse copies: through the Clipboard API only where `clipboard-write` is granted, and through `document.execCommand` elsewhere. jsdom has neither, so that test grants the permission and provides `ClipboardItem`; user-event provides the clipboard.
- One test first failed on its own order: TanStack Query drops the error of a query that never had data as soon as it fetches again, so the test now waits for the result.
- oxlint asked for typed mocks; ESLint now accepts `waitFor(() => expect(...))` in tests, the usual way to wait for an assertion.
- The suite passes three times in a row and in shuffled order. Coverage with V8: 94.5 % of statements; in the app's own code only the page reload and the guard against a programmer error stay unrun.

**Decided.** D33 refined.

**Checked.** `format:check`, `lint`, `typecheck`, 141 tests in 22 files, `build`.

**Commit.** `2f18d97 test: behaviour tests of views, controller and editor on a stand-in API`

## Step 15. The end-to-end smoke test (2026-10-25)

**Asked.** One `@smoke` journey against the real backend.

**AI did.**

- Added Playwright 1.64 and playwright-bdd 9.2 after checking them on the npm registry; `npm audit` stays clean. Playwright's headless Chromium shell is enough for these tests and is a smaller download than the full browser; the README says how to install it.
- Wrote one feature with the header the plan asks for (As a / I want / So that, with requirement IDs) and three scenarios against the real Java code: the brief's chain, replace then append (`@smoke`); a pattern that Java cannot compile, whose message the server places at the Pattern field; and an emoji with a skin tone that Substring keeps whole.
- The steps find elements by role and name and read texts inside them.
- Playwright starts the API through Gradle on port 8091 and the built app with `vite preview` on port 4191. The developer's API on 8080 kept running throughout, and nothing on 8091 or 4191 was left behind. `vite preview` takes its proxy from the dev server's settings, so the proxy target now comes from `API_PROXY_TARGET`, defaulting to 8080. Gradle runs without its daemon here: a daemon would start the server outside the process tree that Playwright stops.
- The first run did not start at all: the shell had `NoDefaultCurrentDirectoryInExePath` set, which keeps cmd.exe from running commands from the current folder, so the config now calls the wrapper as `.\gradlew.bat`.
- Checked that the steps can fail: a throwaway scenario expecting the wrong output failed with a clear message, and was deleted.

**Decided.** D23 refined.

**Checked.** The three scenarios pass twice in a row, in about 25 s with the server start and the build. `format:check`, `lint`, `typecheck`, 141 Vitest tests, `build`; `npm audit` clean.

**Commit.** `47fc393 test(e2e): Gherkin smoke journey against the real API with Playwright`

## Step 16. Accessibility (2026-10-25)

**Asked.** Focus, the live region, errors linked to fields, contrast themes, screenshots.

**AI did.**

- Made the focus keep the user's place. A new step's first field takes it; after a removal, the step that took the removed one's place, or the search field once the last step is gone; after a move, the button that moved the step, or the step itself once that button is disabled at an end of the chain. A pure function in the editor's model decides where the focus goes, and the controller hands each decision as a new object to the component that owns the place, which focuses it once the DOM has updated, like a React effect that depends on the request.
- Added a live region under the Output heading. It says in one sentence how the latest run went, such as "Step 2, Replace, needs a value.", but never the output, so typing does not repeat it at every pause; it keeps the previous sentence while the next run is on its way. A second live region confirms a copy, because a changed button label alone is not announced.
- Moved the picker's list out of the portal at the end of the body, so it opens inside the page's landmarks; axe no longer reports it.
- Contrast themes: they drop box shadows, which carry the focus rings, so the focus and the highlighted option now get outlines in system colours. Chromium's emulation draws the real system palette, which the screenshots show.
- A screenshot with the keyboard focus on the picker found a real gap: its search field showed no focus at all. The copied combobox puts its input in an input group that only draws a ring for an input-group-control. The group now draws one for the search field too.
- Added a second end-to-end feature: a step added from the keyboard takes the focus and the run is announced; axe finds no violations with an error at a field and the list open; every stop of the Tab key shows the focus; the focus outline stays visible in a contrast theme. Throwaway probes made the last two fail without their fixes, and were reverted.
- Errors were already linked to their fields in step 13 (`aria-describedby` and `aria-invalid`); the new tests check them through the accessible description.
- A component test that focused a card while it mounted failed only under Testing Library, which moves the rendered nodes once after mounting and so drops that focus. The component tests now ask after the first render, and the integration tests cover a card that arrives with a request.
- Added `npm run screenshots`, a second Playwright project that takes the pictures in `docs/images` from the running app; the README now opens with one. Added `@axe-core/playwright` (MPL-2.0, used only in tests).

**Decided.** D15 refined.

**Checked.** `format:check`, `lint`, `typecheck`, 165 tests in 24 files, `build`; seven end-to-end scenarios; `npm audit` clean.

**Commit.** `aa13999 feat(a11y): focus after edits, run announcements and contrast themes`

## Step 17. The harder transformations (2026-10-25)

**Asked.** The harder transformations of D10: case and language, line operations, encodings, dates.

**AI did.**

- Probed Java 25 in jshell first. In Turkish, i becomes İ; without a language, İ becomes i with a combining dot, and ß becomes SS. Strict date parsing rejects `yyyy` unless an era is given, while the lenient default silently turns 30 February into 28 February. The collation of `Locale.ROOT` sorts é next to e. Java's own Base64 errors read "Illegal base64 character 21".
- Added five transformations in two new categories, Lines and Conversions: Change case (eight cases, and Turkish or Azerbaijani as a language), Line operations (sort, remove duplicates, remove blank lines, reverse), Encode and Decode (Base64, URL-safe Base64, URL encoding, hexadecimal; always UTF-8), and Reformat dates (strict, English month names in any case, every line on its own, the first bad line named with its number). Each is one class and one line in `BuiltIns` (D19). They share a helper that reads `\r\n`, `\r` and `\n` and keeps a final line break.
- Sorting puts numbers in order of their value, so file2 comes before file10. The first version of removing duplicates compared every line with every earlier one, and reused the sort order, so file02 and file2 counted as the same line. It now keeps a set of exact lines, or of collation keys when case is ignored, and sorting computes each line's keys once instead of in every comparison.
- The frontend needed no code (R2.1). The catalog that a server on a spare port returned became `contract/catalog.json`, which both sides test against; the frontend tests that count the catalog were updated, and an end-to-end scenario adds Change case, picks Turkish and gets "İSTANBUL" from the real API.
- Found that the Java formatter writes a Unicode escape as the character itself, so the comment of the test texts had been wrong since step 9. The e with a combining accent is now built from its code points, which an editor that normalises to NFC cannot change. A `\u` inside a comment then broke the build: Java reads Unicode escapes before it knows what a comment is.
- While the IDE was indexing, the long keyboard journey passed Vitest's 5-second limit. The limit is now 15 seconds, and Testing Library waits up to 3 seconds; checks that pass still return at once. Once more, during heavy indexing, the two longest integration tests failed; three runs after it and a run beside two other full runs of the suite all passed.
- Added 74 library tests, with new traps: the Turkish i and ß, Windows line endings in the line steps, and empty input for every new transformation.

**Decided.** D10 refined; four traps added to the table.

**Checked.** `./gradlew build` with 235 Java tests (library 209, server 26); `format:check`, `lint`, `typecheck`, 165 Vitest tests, `build`; eight end-to-end scenarios.

**Commit.** `40ac254 feat(library): case, line, encoding and date transformations`

## Step 18. One-command start (2026-10-25)

**Asked.** `docker compose up` as the one-command start (D22).

**AI did.**

- Wrote a `Dockerfile` with three stages: Node 24 builds the frontend, the Temurin JDK 25 image builds the server jar with the Gradle wrapper, and the Temurin JRE 25 image runs it. The base images are pinned to exact versions (D39) and exist for ARM64 too, as do the native packages in the npm lockfile, so the image should also build on an Apple Silicon Mac; that build was not tried. BuildKit caches keep npm's and Gradle's downloads between builds: the first build took two and a half minutes, a rebuild after a change in the last stage four seconds.
- Spring Boot serves the built frontend from a folder that an environment variable names, so the jar and the manual path stay as they were. The app has one page and no routes of its own, so the server needs no fallback to `index.html`.
- `.dockerignore` lets in only what the build needs. Listing the build context showed ESLint's cache in it, which is now left out too; after that the context held exactly the 227 files that Git tracks in those folders.
- The first image ran as the base image's `ubuntu` user, which belongs to groups such as `sudo` and `adm`. The server now runs as a system user of its own, without a shell.
- `compose.yaml` publishes port 8080, or the one in `PORT`.
- The README now starts with the prerequisites and how to run the app, right after the screenshots, so the one command is the first thing a reviewer reads.
- Playwright can now test an app that already runs (`E2E_BASE_URL`). All eight scenarios passed against the container, which ran on port 8095 beside the developer's API on 8080.
- Docker Desktop was installed but not running, so it was started for the build. Afterwards the container and the throwaway images were removed, and Docker Desktop was stopped again.

**Decided.** D22 and D39 refined.

**Checked.** The image builds; `/`, a built asset, `/api/catalog` and Swagger UI answer from the container; it runs as the new user; eight end-to-end scenarios pass against the final image. `./gradlew build`; `format:check`, `lint`, `typecheck`, 165 Vitest tests, `build`.

**Commit.** `f51c3a3 chore: Docker image and compose file for a one-command start`

## Step 19.1. Turning a step off, beyond the brief (2026-10-25)

**Asked.** Step 19: the three candidates beyond the brief, each in commits of its own: the chain in the URL, example chains, and turning a step off. They are built in the order off, URL, examples, because a link has to carry a step that is off, and the examples are links.

**AI did.**

- A step has an `enabled` flag. `model/run` leaves the steps that are off out of the request, so the text passes through them unchanged, and the API and the library stay as they are (D48).
- Each step's header has a switch named "Run step 2". A step that is off keeps its values and its place. Its card says Off, has a dashed border and says that the text passes through it. An older result for its id is no longer shown.
- The live region counts the steps that are off: "1 of 2 steps ran; 1 is off."
- The switch comes from shadcn-vue 2.8.2 and was changed twice. Off, it was a light grey track at 1.26:1 against the card, and WCAG 1.4.11 asks 3:1 of a control, so it is now outlined in the muted text colour, 4.75:1. In a Windows contrast theme its thumb took the card's colour, because the theme repaints every background that is not a system colour; the thumb and the track that is on now use system colours. The first try still failed: Tailwind sorted the thumb's contrast rule before the rule for the off state, which then won. The order of the rules in the built CSS showed it, and an end-to-end test that compares the thumb's colour with the card's failed on that try and passes now.
- The keyboard journey of the integration tests now passes the switch on its way to "Remove step 1".

**Decided.** D48, in a new section J of the decisions, "Beyond the brief".

**Checked.** 175 Vitest tests, 10 of them new; 10 end-to-end scenarios, 2 of them new: a step that is off lets the text through, and its switch stays visible in a contrast theme. Screenshots of a step that is off on a desktop, at phone width and in a contrast theme, looked at and not kept. `format:check`, `lint`, `typecheck`, `build`; the Java side did not change.

**Commit.** `a5940ee feat(ui): turn a step off without removing it`

## Step 19.2. The chain in the URL, beyond the brief (2026-10-25)

**Asked.** The second candidate of step 19: the chain in the URL, so it can be shared.

**AI did.**

- The address's fragment holds the chain: `#chain=` and the chain's JSON in UTF-8 and URL-safe Base64. The JSON is a run request without step ids, and a step that is off says `"enabled": false` (D49). A fragment never reaches the server and does not reload the page when it changes; CyberChef, a similar tool, keeps its recipes in the fragment too.
- A link is input from outside, so reading one checks it: zod for its shape, the catalog for its transformations. An unknown transformation stops the link, and the editor says so in an alert; a value that no longer fits its field, as from an older version, gets the field's default, and values without a field are dropped.
- The editor opens the chain of a link once the catalog is there, and again when the fragment changes. After an edit it rewrites the fragment in place, 300 ms after the last change, so typing adds no history entries and stays under Safari's limit of 100 address changes in 10 seconds.
- VueUse's `watchDebounced` keeps a waiting call alive after the component is gone, which would let one test change the address of the next. The write now goes through `useDebounceFn`, whose `cancel` runs when the editor goes away, and the test setup returns to the plain address after every test.
- A Copy link button above the input copies a link built from the chain itself, so a copy right after an edit does not miss it. The clipboard stand-in of the output panel's tests moved to a helper that both buttons' tests use.

**Decided.** D49, with the rejected alternatives: the query string, compression, short links stored on the server.

**Checked.** 197 Vitest tests, 22 of them new, among them five integration tests that open, follow and rewrite links in jsdom; 12 end-to-end scenarios, 2 of them new, in a third feature: a copied link opens the same chain in a fresh page, with a step that is off, and a link that was cut off says so. Screenshots of the button and of a broken link, looked at and not kept. `format:check`, `lint`, `typecheck`, `build`; the Java side did not change.

**Commit.** `b78f934 feat(ui): keep the chain in the URL, so a link can share it`

## Step 19.3. Example chains, beyond the brief (2026-10-25)

**Asked.** The third candidate of step 19: example chains to start from.

**AI did.**

- The examples live in the library, next to the transformations, and the server sends them with the catalog (D50). Kept in the frontend, they would have named transformations and parameters there, which the frontend has avoided since step 11 (D19).
- An `Example` is an id, a name, an input and library steps. `BuiltIns` builds the transformations first and the examples from those very objects; `Catalog` checks that with an identity set, because Error Prone rejects `==` on objects and `equals` would hide that identity is meant.
- Five examples, one per kind of work: the brief's chain, a title to a URL slug, sorting file names, reformatting dates, finding e-mail addresses. `ExamplesTest` runs each through the real pipeline and pins its output.
- The server writes the values in the transformation's display order, so the catalog's JSON is the same at every start. `contract/catalog.json` was taken from a temporary server on port 8093, stopped afterwards; a script checked that the rest of the answer was exactly the file and added only the examples.
- The frontend checks the examples like the transformations: unique ids, and only transformations and parameters the catalog has. It fills in the defaults and shows each example as a plain link to its chain (D49), so following one adds a history entry and Back returns to the chain before.
- The first place for the examples, above the input, broke the integration test of the keyboard journey: five links came before the input in the order of the Tab key. They moved under the search that adds steps, and Copy link moved from above the input into the output's header for the same reason.
- A new end-to-end step, "the chain has no steps", first passed for the wrong reason: a script lost the backslash of `\d`, and a pattern that matches nothing always counts zero. It was fixed, and then shown to fail while the example's two steps were on the page.
- The screenshots in `docs/images` were taken again: they show the switch of each step, the examples and Copy link.

**Decided.** D50.

**Checked.** `./gradlew build`: 246 Java tests (library 220, 11 new; server 26), the server's catalog strictly equal to the contract. 203 Vitest tests, 6 new; 13 end-to-end scenarios in 4 features, 1 new: an example opens with one click, and Back returns to the chain before it. `format:check`, `lint`, `typecheck`, `build`, `npm audit`.

**Commit.** `92abc8a feat: example chains in the catalog, shown as links`

## Step 20. The final check (2026-10-25)

**Asked.** The last step: a fresh clone, every check, the README read through, and a zip of the clone with `.git` (D24).

**AI did.**

- Cloned the repository afresh and ran every check there, as a reviewer would: `./gradlew build`, `npm ci`, formatting, lint, types, Vitest, the production build, `npm audit` and the end-to-end features. Gradle's local build cache had answered most of that first Java build, compilation and tests included, so it ran again with `--no-build-cache`, as on a machine that has never built the project.
- Built the Docker image from scratch with `--no-cache`, ran it on port 8095 beside the developer's server on 8080, and ran the end-to-end features against it.
- Tested a promise of the README that nothing had tested yet: that any JDK 17 or newer can start the build. JDK 25 had been installed on this machine from the start. A Linux container with JDK 21 and an empty Gradle home built a fresh clone, and Gradle's toolchain downloaded JDK 25 for it.
- Set the author and committer address of every commit to the developer's private one. Names, dates, messages and files stayed the same; the journals now name the earlier commits by their new hashes. A script compared each of the 17 old commits with its new one before `main` moved, and the old history stays in a bundle outside the repository. The repository now has its own `user.email`.
- Read the README through as a reviewer and added what the delivery asks for (R4.2, R4.3): how the app is built, what is worth a look, how AI was used, and the known issues. In the design, the points to approve became the points the developer approved in step 8. The AI log no longer promises raw exports of sessions, which D25 had already ruled out.
- The delivery is a zip of a fresh clone of this commit, made right after it. Windows' own zip tools do not record Unix permissions, and `./gradlew` would then not run after unzipping on macOS or Linux, so a small script writes the zip with the modes that git records. The clone's remote, which points to the developer's folder, is removed before zipping.

**Decided.** Nothing new; D24 as planned.

**Checked.** On the fresh clone: 246 Java tests, again without the build cache; 203 Vitest tests; 13 end-to-end scenarios; format, lint, typecheck, build, and `npm audit` with 0 vulnerabilities. The image built from scratch in 2.5 minutes and passed the 13 scenarios. The Linux build with JDK 21 and a downloaded JDK 25 passed in about 7 minutes. The rewritten history: 17 pairs compared, one address left in it. Docs: Prettier, links, names.

**Commit.** `e3a29ec docs: README and AI log for the delivery`

## Step 21. Light, dark and system themes (2026-10-25)

**Asked.** After the delivery check, the developer asked whether the app lets people switch between a light and a dark theme, as a full app would, and whether it serves people with disabilities. It served them (step 16), but it had no themes: the plan had no step for them. They asked for this step, beyond the brief.

**AI did.**

- Added light, dark, or the system's theme to the header (D51). The switcher is Reka UI's radio group in the look of a segmented control: a single stop of the Tab key, where the arrow keys move the choice. VueUse's `useColorMode` keeps the choice in `localStorage` and puts `light` or `dark` on `<html>`. It already catches the error of blocked storage and checks that `matchMedia` exists, so the app needs no guards of its own.
- The dark palette is shadcn-vue's neutral one, with green-500 for an executed step. Computed from the tokens, text is at 5.8:1 to 19:1, the green at 8:1 and the outline of a switch that is off at 6.9:1; axe checks the rendered page in both themes.
- A small script in `index.html` applies the same rule before the first paint, so a dark page does not flash white while the app loads. A unit test runs that script in a Node sandbox for every case, and an end-to-end test blocks the app's own scripts and finds the page dark all the same.
- For people who ask their system for less motion, nothing moves any more: spinners stand still beside the words that say what is going on (D15).
- The tests caught several mistakes, mostly in the tests themselves:
  - The first check of the page's brightness read the computed colour as RGB, but Chromium gives it in OKLCH, as the tokens define it. The checks of the dark theme passed for the wrong reason until the one of the light theme failed. A canvas now converts the colour.
  - A walk of the Tab key that begins with a script focusing a button shows no focus there, because the browser remembers that the mouse came last. The walk now reaches the header with Shift+Tab from the input.
  - Every new check was broken on purpose once. The check that the chosen theme stands out in a contrast theme passed without the fix: a button's forced background differs from a transparent one, though both look like the page. It now requires the theme's own Highlight colour.
  - The new screenshot of the contrast theme then showed the label of the chosen theme hidden by a black box: the backplate that the theme draws behind text. The chosen option now opts out with `forced-color-adjust: none`, and the check covers that too.
  - user-event lets go of a key at once, while Reka UI checks a radio only if the arrow key is still down a moment later, as it is when a person presses it. The component test holds the key, and the end-to-end test presses it for 50 ms.
- D33 no longer says that running the frontend without a backend "is not built yet": the frontend always runs against a real API.
- The screenshots in `docs/images` were taken again, with a new one of the dark theme.

**Decided.** D51; D15 refined.

**Checked.** 215 Vitest tests, 12 of them new; 19 end-to-end scenarios, 6 of them new: the system's theme, a theme kept after a reload and shown before the app runs, the theme from the keyboard, axe in the dark theme, the chosen theme in a contrast theme, and no motion. `format:check`, `lint`, `typecheck`, `build`, `npm audit`; `./gradlew build`, unchanged.

**Commit.** `54acce3 feat(ui): light, dark and system themes`

## Step 22.1. Languages: the library's texts, beyond the brief (2026-10-25)

**Asked.** After the themes, the developer asked for the interface in English, German and Russian, with i18n. Asked how far it should go, they chose everything: the frontend and the backend. The step is built in three commits: the library, the server, the frontend.

**AI did.**

- Every text the library shows is now a message: a key and its values, such as `check.atLeast` and 0 (D52). The library returns messages as data and knows no language; whoever shows them renders them. `Messages.render` looks the key up in a ResourceBundle, one per language, and formats the text with `MessageFormat`, so a count is written 10,000 in English, 10.000 in German and 10 000 in Russian. A language the library does not speak gets English, whatever the server's own language is.
- Wrote the German and Russian texts, 147 each. Russian has three plural forms that `java.text` cannot choose between, so a Russian text puts a count after a colon, where it needs none: "Максимум символов: 10 000".
- Java's own messages are in English only. The regex errors people make while typing a pattern, such as an unclosed group, and the date-pattern errors, such as an unknown letter, have translations; a test pins each one to Java's exact wording, so a newer Java that words them differently fails a test instead of quietly showing English. Rarer ones stay as Java wrote them.
- The tests compare what people read: a helper renders each result in English first, so the existing tests kept their expectations and now check the English texts too. New tests check that every language has every text with the same values, that quotes are written the way `MessageFormat` needs them, and that every text of the catalog exists in every language.
- The server renders the messages in English for now, so the API does not change.
- An empty line had cut the table of section J in the decisions in two, leaving D50 and D51 outside it; it is one table again.

**Decided.** D52, with the rejected alternatives: translating the catalog in the frontend, ICU4J for its plural rules, month names in the reader's language.

**Checked.** 238 library tests, 18 of them new, and the 26 server tests; the catalog is still `contract/catalog.json` byte for byte. Each new check was broken on purpose once: a lone apostrophe in a German text, a missing Russian text, a Russian count without its number format.

**Commit.** `18af4db feat(library): texts as messages in English, German and Russian`

## Step 22.2. Languages: the server, beyond the brief (2026-10-25)

**Asked.** The second of the three commits of step 22: the server answers in the reader's language.

**AI did.**

- The server takes the language of each request from `Accept-Language`, the header a browser sends with the languages its user prefers. It answers in the first one it speaks: English, German or Russian, and a regional variant such as Austrian German counts as German. Any other language, or none, gets English. Spring Boot's own resolver would have taken any language a request names, and without the header the server's own; it is replaced by one that knows the three.
- The catalog is built once for each language at startup, as it was built once before. A run renders its step messages in the request's language.
- The server's own texts, the request errors and the generic 500, moved into Spring's message bundles, again in three languages. Spring fills the detail of an invalid request from them by itself; the other texts come from the same bundles.
- A response names its language in `Content-Language` and says with `Vary: Accept-Language` that it depends on that header, so a cache does not serve a German catalog to an English reader. Spring's own answers, such as a 404 for an unknown path, stay English and name no language.
- The OpenAPI document describes the header on both endpoints, and the contract's examples stay the English answers.

**Decided.** Nothing new: D52 as written in step 22.1.

**Checked.** 37 server tests, 11 of them new: the catalog in German for "fr, de-AT;q=0.8", English for French, a step message in Russian, request errors in German, malformed JSON in Russian, the 500 in Russian, the header in the OpenAPI document, and every server text in every language. Without the list of languages on the resolver, four of them fail. The 238 library tests are unchanged.

**Commit.** `213e1fb feat(server): answer in the language of Accept-Language`

## Step 22.3. Languages: the frontend, beyond the brief (2026-10-26)

**Asked.** The last of the three commits of step 22: the interface itself in English, German and Russian. Halfway through, the developer asked whether the step was done yet; it was not, and the assistant said so and went on.

**AI did.**

- Added vue-i18n 11, MIT-licensed and depending only on its own packages, and wrote the app's own texts in three languages (D52). English is the type of the other two, so a text missing from German or Russian does not compile; a unit test checks that each one takes the same values. A select in the header lists English, Deutsch and Русский, each language named in itself, so a reader finds theirs whatever the page is in. A first visit follows the browser's languages, a choice is kept for the next one, and `<html lang>` follows it, so a screen reader reads the page in the right voice.
- Every call to the API sends the chosen language, and the language is part of each query's key: choosing another one fetches the catalog and runs the chain again in it, while the editor keeps showing what it has until the answer arrives. The transformations, their fields and the server's messages then change language too.
- Russian has three plural forms. vue-i18n picks one through a rule that asks the browser's `Intl.PluralRules`, which knows them from Unicode's data: "не больше 21 шага", "не больше 50 шагов". Where any form could be needed, the Russian text puts the count after a colon, as on the server.
- Models that write sentences, such as the run summary for screen readers, take the translation function as an argument and stay plain functions, testable in any language.
- The end-to-end helpers now find buttons and fields by their names in any of the three languages, taken from the app's own texts. A new feature opens the editor in German, as a browser set to German would, and in Russian, where the server's message "Введите значение" appears at the field. Playwright now runs in English explicitly: it would otherwise take the computer's language, and on a computer set to German or Russian the English features would meet a German or Russian page.
- The tests found three things:
  - The new select is the first stop of the Tab key, so the keyboard scenarios that expected the theme there had to take one more step. The walk over every stop of the Tab key now starts at the select.
  - axe, run on the German page after the list of transformations had been opened and closed, reported the search field: Reka UI kept `aria-controls` and `aria-activedescendant` pointing at a list that had left the page. Keeping the list in the page instead put Reka UI's invisible focus guards into the Tab order, so the copied input now sets both only while the list shows, as WAI-ARIA asks; a component test fails without it.
  - The search's placeholder suggests "Regex", but no German or Russian name or description contained the word; the descriptions of the two regex transformations now do, and the German scenario searches for it.
- With vue-i18n the app's single bundle passed Vite's warning size of 500 kB, so the libraries now go into a file of their own, which browsers keep cached across the app's updates.
- The screenshots were taken again, since the header changed, with a new one of the editor in German.
- The first end-to-end run lost seven scenarios to timeouts while the machine was busy: the traces showed the catalog taking 5 to 40 seconds, and the same scenarios passed in seconds once it was quiet. A timing test of the library, which allows 2 seconds for a regex stopped after 0.1, took 2.8 seconds once in the same period and 0.1 in three runs after.

**Decided.** Nothing new: D52 as written in step 22.1.

**Checked.** 243 Vitest tests, 28 of them new; 22 end-to-end scenarios, 3 of them new; format, lint, typecheck, `npm audit` with 0 vulnerabilities, and a build without the size warning. `./gradlew build`: 238 and 37 tests. The Docker image built and passed the 22 scenarios on port 8095, with the catalog in German and a regex error in Russian; Docker Desktop was stopped afterwards. Ports 8091, 4191 and 8095 were free, and the developer's server on 8080 was not touched.

**Commit.** `3c9e5dd feat(ui): the interface in English, German and Russian`

## Step 23.1. A followed link is no longer undone (2026-10-26)

**Asked.** Notes on the UI from the developer: a fixed header and footer with only the cards scrolling, a favicon, a header that keeps its layout in every language, the input and the output across the whole width, the steps in two columns, drag and drop, and a sensible layout on every screen size. Step 23 builds them in three commits; this first one fixes a bug that turned up on the way.

**AI did.**

- While the layout was being built, one test of the chain in the address failed now and then, and only in the whole suite, never on its own. The cause was a race in the app itself (D49). After an edit the address is rewritten 300 ms later. If a link is followed, or Back pressed, just as that timer is due and the page is busy, the timer can run before the browser's notice of the new address is handled: it wrote the old chain into the new address, and the editor then opened the old chain again, as if the link had not been followed.
- The editor now remembers the address it last read or wrote, and a waiting write gives up once the address holds another one.
- A new test changes the address without its notice, waits past the pause, and checks that the address is untouched; without the fix it fails.
- The long keyboard test, 3 to 5 seconds on its own, once took more than 15 seconds while the whole suite shared a busy machine, so its time limit is now 30 seconds; it only guards against a test that hangs.

**Decided.** Nothing new.

**Checked.** The new test, with and without the fix; three runs of the whole suite in a row, 244 Vitest tests.

**Commit.** `982af80 fix(ui): keep a waiting address write from undoing a followed link`

## Step 23.2. The whole window, two columns of steps, a favicon (2026-10-26)

**Asked.** The developer's notes on the UI from step 23.1, apart from drag and drop, which comes next.

**AI did.**

- The page now uses the window's width, up to 1536 pixels. The input and the output span it, and the steps fill two columns from 1024 pixels up, row by row, so the chain still reads like text. A step's fields go into two columns only when its own card is wide enough, whatever the window.
- In a window at least 768 pixels wide and 576 high, the header stays at the top and the search with the examples at the bottom; only the chain between them scrolls. The bars are rows of a page as high as the window, not layers over it, so they never cover a field that has the focus. On a phone, held either way, the page scrolls as a whole: fixed bars would leave the chain a strip of the screen.
- The header no longer changes its layout with the language. Its settings keep a column of their own, and below 1024 pixels the theme options show only their icons; screen readers still hear their names. Measured in Chromium, the header is the same in all three languages from 700 pixels up. Before, the longer Russian names of the themes pushed the settings onto a row of their own.
- While measuring, the AI found the page itself scrolling by the height of the chain: two texts kept for screen readers, next to the output's buttons, were placed against the page and sat below the window. The part that scrolls now holds them.
- A favicon: three steps of a chain, the middle one in the green of an executed step, as an SVG with a PNG for browsers that do not show SVG icons.
- A new end-to-end feature checks the layout in windows of given sizes, and fails when either fix is undone. The screenshots were taken again in a window of 1280 × 800.

**Decided.** D53, the layout; D2 revised for the two columns.

**Checked.** 244 Vitest tests; 27 end-to-end scenarios, 5 of them new; format, lint, typecheck and build. The first full end-to-end run, before the new feature, timed out in 6 scenarios while the machine was busy, the first one of each worker, on a server that had just started; the next run passed.

**Commit.** `f2de558 feat(ui): a fixed header and footer, steps in two columns, a favicon`

## Step 23.3. Drag and drop (2026-10-26)

**Asked.** The last of the developer's notes from step 23.1: steps that can be dragged to another place.

**AI did.**

- Each step has a handle in its header, shown while the step can move. Dragging it moves the step anywhere in the chain, in one column or in two, and the chain runs in its new order.
- The library is SortableJS, mature, small, and with no dependencies of its own, inside a composable of the app's own. The AI first installed VueUse's wrapper and read its source: it moves the array it is given, while here only the store changes the chain, so it would have added little but a dependency, and it was removed again.
- SortableJS moves the element in the page itself, while Vue renders the list from the state. So at the drop the element goes back where it was, the store moves the step, and Vue moves the element. Where exactly it goes back matters: Vue marks the end of a list with an invisible node, and putting an element back by its position, as VueUse does, puts the last item behind that node, where a step added later would show up in the wrong place. A unit test plays SortableJS's part and fails with that way back.
- The up and down buttons stay: they move a step from the keyboard, and with a single tap, as WCAG asks of anything done by dragging. The handle is hidden from screen readers, and the dragged step gets the focus.
- An end-to-end scenario drags a step in Chromium and checks the new order and the new output. An axe scenario now has two steps, so it checks the handles too.

**Decided.** D54, drag and drop; D2 revised again.

**Checked.** 253 Vitest tests, 9 of them new; 28 end-to-end scenarios, 1 of them new; format, lint, typecheck, build (the libraries' chunk grew from 442 to 479 kB, still under Vite's warning), and `npm audit` with 0 vulnerabilities.

**Commit.** `b1d30cd feat(ui): drag a step by its handle to another place`

## Step 24.1. Notices at the bottom right (2026-10-26)

**Asked.** More notes on the UI, with a screenshot of a failed run in Russian: the alert should pop up at the bottom right, pile up when there are several, and go away by itself after a while; the "Add a step" section should move under the input, in the same card and style, and the output should become the footer, so that only the steps scroll. This step does the notices; step 24.2 does the layout.

**AI did.**

- First the screenshot: under a Russian interface it showed an English server message and English step names. The developer's own server answered in English and failed every run with Substring, while the current code answered both correctly. Their server had been running since before step 22, which rebuilt the code under it, so it needs a restart rather than a fix.
- A failed run and a link that cannot be opened now pop up at the bottom right and close after 8 seconds; the pointer or the focus on them pauses that. Several pile up with the newest in front, the older ones peeking out above it, and spread out under the pointer. F8 reaches them from the keyboard, and a screen reader hears each once.
- Each kind has one notice. Another message replaces it and starts its time again; the same message again changes nothing, so a server that stays down does not keep a notice on screen. A run that succeeds closes its notice.
- They are built on the toasts of Reka UI, the library under the UI kit, so there is no new dependency. The pile itself is a stylesheet rule that reads the places Reka UI gives each toast. A first version barely showed the older notice: shrinking it from the bottom lowered its top edge by almost as much as it was raised. The rule now makes up for that.
- axe, run with a notice on screen, found its red text too pale; the same pale red was in the in-page alert that the catalog's failure still uses. Both use the full red now.
- The libraries' file reached the size at which the build warns, so Vue itself moved to a file of its own.

**Decided.** D55, the notices.

**Checked.** 256 Vitest tests; 30 end-to-end scenarios, 2 of them new, one of which waits for a notice to go by itself; format, lint, typecheck and build.

**Commit.** `0eb6673 feat(ui): notices pop up at the bottom right and go away by themselves`

## Step 24.2. Only the steps scroll (2026-10-26)

**Asked.** The rest of the notes from step 24.1: "Add a step" under the input, in one frame and in the same style; the output as the footer; only the steps scrolling, everything else always in view.

**AI did.**

- Under the header, one card now holds the input and, under it, "Add a step" with the same kind of heading; the examples sit next to the search on a wide screen and under it on a narrow one. The output is the footer, and between them only the steps scroll.
- The parts that stay in view are white, like the header, and the steps scroll on the page's grey. A first version cut the steps off right under the card, which looked like a mistake; a white band with a border makes the edge clear.
- To leave the steps room, the input grows with its text up to five lines and then scrolls, and so does the output. In a window lower than 640 pixels, measured so that the steps keep at least one row of cards, the page scrolls as a whole instead, as on a phone.
- An empty chain shows a line that points at the search and the examples, instead of an empty grey area.
- With the search right after the input, a keyboard user reaches it with one press of Tab; from a step it takes a few presses of Shift+Tab, which the keyboard test now walks.
- The fix from step 23 against a page that scrolled by itself was no longer needed, since what caused it moved to the footer. It went; the test that guards against the problem stays.

**Decided.** D53 revised.

**Checked.** 256 Vitest tests and 30 end-to-end scenarios, with the layout's one rewritten; format, lint, typecheck and build; the screenshots taken again.

**Commit.** `833e12d feat(ui): only the steps scroll; input, search and output stay in view`

## Step 25.1. The README after the new layout (2026-10-26)

**Asked.** The developer asked for a video, recorded outside the repository, of how the project starts from a fresh clone: which commands in which terminals, ending with the app in a browser. Then: fix what the AI had noticed in the README on the way, in a commit of its own.

**AI did.**

- For the video, the commands of the README ran for real in a fresh clone in a folder of its own, in PowerShell 7. Two terminals replay their real output with the real time on a clock, long waits shortened and marked as such, and a browser ends on the app those commands started, where an example runs.
- Checking the README against that run turned up two things. Its sentence on using the app still put the search under the steps, as before step 24. And the path without Docker showed `./gradlew` only, which cmd and PowerShell spell `.\gradlew.bat`. Both are fixed.

**Decided.** Nothing new.

**Checked.** The README's format; the commands as the README now gives them ran in PowerShell 7 for the video.

**Commit.** `77cd9f5 docs: the search sits under the input; gradlew.bat in cmd and PowerShell`

## Step 26.1. The app installs and opens without the network (2026-10-26)

**Asked.** Whether it would take long to make the app work without the network, or on a very weak one, as a PWA. The AI answered that an app that installs and opens offline, with the catalog it saw last, is one step; running the transformations without the server would take a second implementation of them in TypeScript, or the Java library compiled to WebAssembly, and it advised against both. The developer asked for the basic PWA.

**AI did.**

- The app installs as an app of its own: a manifest, and icons rendered from the favicon.
- A service worker keeps the built app and opens it without the network. It answers only the app's own page: in Docker, Swagger UI and the API live at the same address, and a worker that answered every page would have shown the app in their place. With the server serving the built app as Docker does, Swagger UI was checked by hand, and a test checks that the API's address stays the server's.
- The catalog comes from the server when it answers within 3 seconds, else from the copy of the last time, in each language. Runs are never kept: they need the server.
- On a first visit the app loads the catalog before the worker exists, so the worker had no copy of it, and the app would not have opened offline after one visit. The app now loads the catalog once more when the worker takes over; a test fails without it.
- A new version takes over at once, not after a prompt, as the AI had first suggested: the page loads all its files at the start, so none can go missing, and with a prompt a plain reload would have kept the old version.
- The end-to-end tests block service workers, except in the scenarios about them: Playwright's stand-ins for the server do not see what a worker answers.
- Installing the plugin made npm warn that one of its dependencies, glob 11, is deprecated "with widely publicized security vulnerabilities"; an override gives it the current glob, which it calls the same way.

**Decided.** D56.

**Checked.** 259 Vitest tests and 32 end-to-end scenarios; three deliberate breaks of the offline setup each failed a scenario; the offline scenarios against the server serving the built app on a spare port; format, lint, typecheck and build.

**Commit.** `feat(pwa): the app installs and opens without the network`
