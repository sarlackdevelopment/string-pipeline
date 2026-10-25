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

**Commit.** `feat(a11y): focus after edits, run announcements and contrast themes`
