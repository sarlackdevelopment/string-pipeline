# Agent log

Handoff for agents. Read "Current state" first; every step below uses the same fields. People should read [journal.md](journal.md).

## Current state

- Phase: the brief is done end to end, with the harder transformations of D10 and a one-command start. Next: step 19 (optional, beyond the brief) or step 20, the final check.
- Last commit: `chore: Docker image and compose file for a one-command start`. Branch `main`, no remote; delivery is a zip of a fresh clone (D24).
- Checks: `./gradlew build` green. In `frontend/`: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build` green; `npm run test:e2e` green (needs `npx playwright install --only-shell chromium` once). `docker compose up --build` serves the app on 8080, or on `PORT`; `E2E_BASE_URL=http://localhost:<port> npm run test:e2e` runs the features against it.
- Tests: Java 235 (library 209, server 26); frontend 165 in 24 files (unit 101, component 54, integration 10); end to end 8 scenarios in 2 features.
- Environment: Gradle needs `JAVA_HOME` pointing at a JDK 17+; the toolchain compiles with JDK 25. Node 24.15+. Docker Desktop with Compose for the image.
- Next step: the developer chooses. Step 19 is optional and beyond the brief, in commits of their own, marked as such: the chain in the URL, example chains, turning a step off. Step 20 is the final check: a fresh clone, every check including `docker compose up --build` and the end-to-end features against the container (`E2E_BASE_URL`), the README read through, and a zip of the clone with `.git` (D24). Docker Desktop is installed but stopped: `docker desktop start` starts it, `docker desktop stop` stops it again afterwards.
- Open questions: none.
- Working rules: requirement IDs live in `docs/requirements.md`, decisions in `docs/decisions.md`, the design in `docs/design.md`, the API examples in `contract/`. Every step appends to both journals in the same commit as the code. Conventional Commits with a body (what, why, IDs, test counts) and the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. The developer reviews every step before the next one starts. The work continues in the planning session (D25).

## Steps

### S1 Understand the brief (2026-10-22)

- Goal: the requirements, with IDs.
- Requirements: R1.1–R4.4 defined.
- Decisions: none.
- Read: the brief (PDF), its cover email, npm registry metadata of `@knime/jsonforms`.
- Changed: nothing; no repository yet.
- Verified: R2.1 matches how KNIME renders node dialogs (JSON Forms).
- Commit: none; content committed in S7.
- Open: none.
- Next: S2.

### S2 Ambiguities and decisions (2026-10-22)

- Goal: one decision per ambiguity.
- Requirements: all.
- Decisions: D1–D25 proposed and accepted; D17 is Spring Boot (developer's choice). Rejected: a deliberately simplified Vue style.
- Read: nothing new.
- Changed: nothing.
- Verified: nothing to run.
- Commit: none; content committed in S7.
- Open: none.
- Next: S3.

### S3 Frontend and Java architecture (2026-10-22)

- Goal: senior-level but explainable conventions.
- Requirements: R2.1, R3.1, R3.2.
- Decisions: D26–D31; D28 and D29 reopened in S4.
- Read: nothing new.
- Changed: nothing.
- Verified: nothing to run.
- Commit: none; content committed in S7.
- Open: none.
- Next: S4.

### S4 Libraries (2026-10-23)

- Goal: decide where libraries pay off.
- Requirements: R3.1.
- Decisions: D28 and D29 revised; D32 and D33 added.
- Read: npm registry metadata (versions, licenses) for pinia, @tanstack/vue-query, @pinia/colada, reka-ui, shadcn-vue, @vueuse/core, msw, @knime/components, primevue.
- Changed: nothing.
- Verified: licenses; `@knime/components` is GPL-3 and was rejected.
- Commit: none; content committed in S7.
- Open: none.
- Next: S5.

### S5 Backend scaffold (2026-10-23)

- Goal: buildable Java modules with strict checks.
- Requirements: R3.2, R3.3, R3.4.
- Decisions: D16, D17, D34, D35, D39.
- Read: Spring Initializr metadata and a generated reference project; services.gradle.org checksums; Maven Central metadata; the `spring-boot-dependencies` 4.1.2 POM.
- Changed: root build files, `buildSrc/`, `library/`, `server/`, README.
- Verified: `./gradlew build` green. Probes, deleted: NullAway rejects a null return; `-Xlint:all -Werror` rejects a raw type; Error Prone rejects a missing `@Override`; `StringSplitter` is off by default.
- Commit: `8b41a2a`.
- Open: Spring Boot tests print a JVM class-data-sharing warning about the bootstrap classpath; not investigated yet.
- Next: S6.

### S6 Frontend scaffold (2026-10-23)

- Goal: buildable frontend with strict checks.
- Requirements: R3.1.
- Decisions: D36, D37, D38, D39.
- Read: a reference project from create-vue 3.24.0; npm registry metadata; `npm audit`.
- Changed: `frontend/`, README (commands, Known issues).
- Verified: format:check, lint, typecheck, 1 test, build green. Probes, deleted: ESLint rejects `any`, `!`, a floating promise, the Options API, `img` without `alt`; `vue-tsc` rejects `enum` and an unchecked index; oxlint runs (silent when clean).
- Commit: `03aa8b0`.
- Open: `vue-tsc --build` is not incremental with `noEmit`, same as create-vue's template.
- Next: S7.

### S7 Requirements, decisions and the AI log (2026-10-23)

- Goal: the planning results in the repository.
- Requirements: R4.3.
- Decisions: D25 and D31 revised; D34–D39 added.
- Read: the planning transcript (decision tables), the brief.
- Changed: `docs/requirements.md`, `docs/decisions.md`, `docs/ai-log/`, README.
- Verified: Prettier over all Markdown; relative links resolve.
- Commit: `7db207e`.
- Open: none.
- Next: S8.

### S8 Design (2026-10-23)

- Goal: an approved design before any feature code.
- Requirements: R1.1, R1.2, R2.1, R3.2, R3.3.
- Decisions: D40–D46 added; D12 and D25 refined. The developer approved `GET /api/catalog`, checking all steps, and the size caps.
- Read: Java 25 behaviour through jshell probes: grapheme boundaries, `Pattern.namedGroups()`, replacement errors with and without a match.
- Changed: `docs/design.md`, `contract/`, `docs/decisions.md`, README, both journals.
- Verified: every contract file parses; example outputs recomputed in Java; Prettier; relative links.
- Commit: `5561057`.
- Open: none.
- Next: S9, the library.

### S9 The library (2026-10-23)

- Goal: the library of design sections 4 and 5, fully tested.
- Requirements: R1.1, R1.2, R3.2.
- Decisions: D5–D9, D30, D42–D45 implemented; D21, D31 and D45 refined (Java 25 regex finding, `BuiltIns` as the one way in, a cap per run).
- Read: Java 25 regex behaviour on known catastrophic patterns, through jshell probes.
- Changed: `library/src/main`, `library/src/test`, `buildSrc` (UTF-8 sources), `docs/design.md`, `docs/decisions.md`, README, both journals.
- Verified: `./gradlew build` green: 135 library tests in 13 classes and the server's 1; Spotless, Error Prone and NullAway clean.
- Commit: `dcd495d`.
- Open: the Turkish i trap waits for the case transformation (step 17); the JVM class-data-sharing warning in server tests is still open.
- Next: S10, the web API.

### S10 The web API (2026-10-23)

- Goal: the web API of design sections 2 and 6, tested against `contract/`.
- Requirements: R2.1, R3.3.
- Decisions: D17, D18, D40, D41, D43, D46 implemented; D31 enforced by ArchUnit; D23 and D41 refined.
- Read: Maven Central metadata (springdoc 3.1.1, ArchUnit 1.5.1); class names in the Spring Boot 4.1 and Jackson 3.1 jars.
- Changed: `server/` (build file, `LibraryConfiguration`, `OpenApiConfiguration`, package `api`, tests), `gradle/libs.versions.toml`, `contract/examples/unknown-transformation.response.json` (no `type`), `docs/design.md`, `docs/decisions.md`, README, both journals.
- Verified: `./gradlew build` green with 161 tests; the running server answered the contract examples through curl; Swagger UI and the OpenAPI document load.
- Commit: `aacb5a6`.
- Open: the Turkish i trap (step 17). The class-data-sharing warning is fixed.
- Next: S11, the frontend model.

### S11 The frontend model (2026-10-25)

- Goal: the frontend's domain and API layer of design section 7, tested on `contract/`.
- Requirements: R1.2, R2.1.
- Decisions: D20, D33, D38, D40–D43, D46 implemented; D26 refined (domain in `src/model/`); D39 notes the withdrawn advisory.
- Read: npm registry (zod 4.6.7, MSW 3.0.3); MSW 3's type definitions; GitHub's advisory API (GHSA-vfj7-8cjw-p6xm withdrawn 2026-10-23).
- Changed: `frontend/src/model/`, `frontend/src/api/`, `frontend/src/tests/` (helpers and unit tests), `frontend/package.json` and lockfile, `docs/design.md`, `docs/decisions.md`, README, both journals.
- Verified: format:check, lint, typecheck, 45 tests, build; a deleted probe confirmed that an unprepared request never leaves the test process.
- Commit: `6f199f3`.
- Open: the Turkish i trap (step 17).
- Next: S12, the UI primitive.

### S12 The UI primitive (2026-10-25)

- Goal: a checked UI kit before the UI is built on it (D28).
- Requirements: R1.3, R3.1.
- Decisions: D28 confirmed and refined; D47 added.
- Read: npm registry (shadcn-vue 2.8.2, reka-ui 2.11.0, cn 0.5.0, @lucide/vue); the diff of `shadcn-vue init`; the sources of Reka UI's combobox, listbox and `useFilter`; shadcn-vue's `tailwind.css`.
- Changed: `frontend/components.json`, `frontend/src/components/ui/` (combobox, button, input, textarea, input-group), `frontend/src/lib/utils.ts`, `frontend/src/index.css`, `frontend/tsconfig.json`, `frontend/eslint.config.ts`, `frontend/src/tests/helpers/setup.ts`, package files, `docs/design.md`, `docs/decisions.md`, README, both journals.
- Verified: probes, deleted: seven tests on the combobox in jsdom; the combobox without a `ResizeObserver`; the label rule on the kit's controls. Format:check, lint, typecheck, 45 tests, build; npm audit clean.
- Commit: `5fe6adf`.
- Open: the Turkish i trap (step 17).
- Next: S13, the UI.

### S13 The UI (2026-10-25)

- Goal: the UI of design section 7 on `src/model/` and `src/api/`.
- Requirements: R1.1, R1.2, R1.3, R2.1.
- Decisions: D2, D11, D13, D26, D27, D29, D32 implemented; D29 refined, D32 revised (`watchDebounced` instead of `refDebounced`), D39 extended (`allowScripts`).
- Read: npm registry (pinia 4.1.0 and its new dependency `nostics`, @tanstack/vue-query 5.104.5, playwright-core, axe-core); the shadcn-vue registry entries of field, native-select, checkbox, alert, badge, spinner, label; Reka UI's `ComboboxInput` (how the search term resets after a pick) and `ComboboxRoot` (`onOpenChange`); VueUse's `refDebounced`; eslint-plugin-vuejs-accessibility's `label-has-for`.
- Changed: `frontend/src/` (`main.ts`, `App.vue`, `queries/`, `stores/`, `components/` apart from `ui/`, and `ui/` checkbox, native-select, alert), `frontend/src/index.css` (`--success`), `frontend/vite.config.ts` (proxy), `frontend/eslint.config.ts`, package files, tests (`helpers/render.ts`, `integration/App.test.ts`, unit tests of the store, the queries and the component models), README, `docs/design.md`, `docs/decisions.md`, both journals.
- Verified: format:check, lint, typecheck, 73 tests in 13 files, build; npm audit clean. A throwaway Playwright script in the scratchpad (headless Chrome, dev server on port 5199 proxying to the API on 8080) built the brief's chain and an invalid pattern and took screenshots at 1280 and 390 px; axe-core found no violations except `region` while the picker's portalled list is open.
- Commit: `34be9ca`.
- Open: the Turkish i trap (step 17); the picker's list outside the landmarks, focus after add, remove and move, and the live region (step 16).
- Next: S14, the behaviour tests.

### S14 The behaviour tests (2026-10-25)

- Goal: behaviour tests of design section 8 for the UI of S13.
- Requirements: R1.2, R1.3, R2.1.
- Decisions: D11, D15, D19, D23, D26, D33, D41, D42 tested; D33 refined.
- Read: VueUse's `useClipboard` and `usePermission` (API path only with `clipboard-write` granted, otherwise `document.execCommand`); user-event's clipboard stub and its `ClipboardItem` stand-in.
- Changed: `frontend/src/tests/helpers/` (`api.ts` stand-in API with a gate, `composable.ts`, `contract.ts` with `contractCatalog` and `contractTransformation`), `frontend/src/tests/component/` (six view tests), `frontend/src/tests/unit/` (run query, controller; groups test on the contract helper), `frontend/src/tests/integration/` (editor; App with the error boundary), `frontend/eslint.config.ts` (`app/tests`), README, `docs/design.md`, `docs/decisions.md`, both journals.
- Verified: format:check, lint, typecheck, 141 tests in 22 files (8.8 s), build; three runs in a row and one shuffled run green; V8 coverage 94.5 % of statements.
- Commit: `2f18d97`.
- Open: the Turkish i trap (step 17); the picker's list outside the landmarks, focus after add, remove and move, and the live region (step 16).
- Next: S15, the end-to-end smoke test.

### S15 The end-to-end smoke test (2026-10-25)

- Goal: one `@smoke` journey against the real backend (D23).
- Requirements: R1.1, R1.2, R1.3, R2.1.
- Decisions: D23 refined; D7, D9, D12, D42 checked end to end.
- Read: npm registry (@playwright/test 1.64.1, playwright-bdd 9.2.1); `npx playwright install --dry-run chromium` (build 1248; the cached 1243 is older).
- Changed: `frontend/playwright.config.ts`, `frontend/e2e/` (feature and steps), `frontend/tsconfig.e2e.json`, `frontend/tsconfig.json`, `frontend/tsconfig.node.json`, `frontend/vite.config.ts` (`API_PROXY_TARGET`), `frontend/eslint.config.ts` (ignores), `frontend/.gitignore`, package files (`test:e2e`), README, `docs/design.md`, `docs/decisions.md`, both journals.
- Verified: `npm run test:e2e` green twice (3 scenarios, about 25 s); a throwaway wrong-output scenario failed as it should; ports 8091 and 4191 free afterwards, the developer's API on 8080 untouched; format:check, lint, typecheck, 141 Vitest tests, build; npm audit clean.
- Commit: `47fc393`.
- Open: the Turkish i trap (step 17); the picker's list outside the landmarks, focus after add, remove and move, and the live region (step 16).
- Next: S16, accessibility.

### S16 Accessibility (2026-10-25)

- Goal: D15 in full: focus, live region, errors at fields, forced colours, screenshots.
- Requirements: R1.3.
- Decisions: D15 refined.
- Read: Reka UI's `ComboboxPortal` (`disabled`) and popper (`positionStrategy: 'fixed'`); Testing Library's `render` (`unwrapNode` moves the nodes after mounting); npm registry (@axe-core/playwright 4.14.0, MPL-2.0).
- Changed: `frontend/src/composables/useFocusRequest.ts`; `components/PipelineEditor/` (`model/focus.ts`, `model/summary.ts`, types, controller, view, container); `components/StepCard/` (`types.ts`, focus parts, `tabindex="-1"`); `components/TransformationPicker` (focus request, inline list); `components/OutputPanel.vue` (live regions); `components/ui/combobox/` (`ComboboxList` `portal` prop, `ComboboxInput` focus ring, `outline-none`); `src/index.css` (forced colours); tests in all three Vitest layers; `e2e/` (`support/editor.ts`, accessibility feature and steps, screenshots spec); `playwright.config.ts` (projects `e2e` and `screenshots`), `tsconfig.e2e.json` (DOM lib), package files (`screenshots`); `docs/images/`; README, `docs/design.md`, `docs/decisions.md`, both journals.
- Verified: format:check, lint, typecheck, 165 Vitest tests in 24 files (unit 101, component 54, integration 10), build; `npm run test:e2e` 7 scenarios; probes: the Tab walk failed with the old search field, the contrast scenario failed without the forced-colours rule; npm audit clean.
- Commit: `aa13999`.
- Open: the Turkish i trap (step 17).
- Next: S17, the harder transformations.

### S17 The harder transformations (2026-10-25)

- Goal: the harder transformations of D10, without frontend code (R2.1, D19).
- Requirements: R1.1, R2.1.
- Decisions: D10 refined; traps table extended (dates, sorting, URL encoding, Base64).
- Read: Java 25 behaviour through jshell probes (`toUpperCase` and `toLowerCase` with `Locale.ROOT` and Turkish; strict and smart `DateTimeFormatter` resolving, `parseDefaulting(ERA, 1)`, `parseBest`, error causes; `Collator` of `Locale.ROOT` at tertiary and secondary strength; `Base64` decoder errors).
- Changed: `library/` (`Category` with LINES and CONVERSIONS; `transformations/` `ChangeCase`, `LineOperations`, `NaturalOrder`, `Lines`, `Encoding`, `Encode`, `Decode`, `ReformatDates`, `BuiltIns`; tests for each, `TrapsTest`, `BuiltInsTest`, `Texts` built from code points); `contract/catalog.json` and its README; `frontend/` (tests that count the catalog, `testTimeout` and `asyncUtilTimeout`, an end-to-end scenario and a step that chooses an option); README (transformations, text rules); `docs/design.md`; `docs/decisions.md`; both journals.
- Verified: `./gradlew build` with 235 tests; a server on port 8093 gave the new catalog and was stopped; format:check, lint, typecheck, 165 Vitest tests, build; 8 end-to-end scenarios.
- Commit: `40ac254`.
- Open: none.
- Next: S18, one-command start.

### S18 One-command start (2026-10-25)

- Goal: `docker compose up` starts the app (D22, R4.1).
- Requirements: R4.1.
- Decisions: D22 and D39 refined.
- Read: Docker Hub tags (node 24.22.1-slim, eclipse-temurin 25.0.4.1_1 jdk and jre on noble); the lockfile's Linux native packages (x64 and arm64, gnu and musl, all present); `docker buildx imagetools inspect` shows linux/arm64/v8 for all three base images. An ARM64 build was not tried.
- Changed: `Dockerfile`, `compose.yaml`, `.dockerignore`; `frontend/playwright.config.ts` (`E2E_BASE_URL` skips the web servers); README (prerequisites and running, with and without Docker, moved up to right after the screenshots; e2e against a running app); `docs/design.md` (section 6, packaging); `docs/decisions.md`; both journals, where three references to a plan outside the repository became plain words.
- Verified: `docker compose build` (2.5 min cold, 4 s warm); the container on port 8095 served `/`, an asset, `/api/catalog` and Swagger UI and ran as `pipeline` (uid 999, no other groups); `E2E_BASE_URL=http://localhost:8095 npm run test:e2e` passed 8 of 8; the build context, exported with `docker build --output type=local` from `FROM scratch` + `COPY . /`, equals `git ls-files` of the included paths (227 files) once `frontend/.eslintcache` is ignored; the full e2e suite passed again against the final image. Container and throwaway images removed; Docker Desktop, started for this step, stopped again with `docker desktop stop`.
- Commit: `chore: Docker image and compose file for a one-command start`.
- Open: none.
- Next: S19 (optional, beyond the brief) or S20, the final check.
