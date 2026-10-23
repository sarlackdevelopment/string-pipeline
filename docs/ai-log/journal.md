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

**Commit.** `feat(server): catalog and run endpoints with Problem Details and OpenAPI`
