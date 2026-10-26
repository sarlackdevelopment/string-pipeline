# Agent log

Handoff for agents. Read "Current state" first; every step below uses the same fields. People should read [journal.md](journal.md).

## Current state

- Phase: the brief is done end to end, with the harder transformations of D10, a one-command start, six extras beyond the brief (turning a step off, the chain in the URL, example chains, themes, languages, a layout for the whole window) and the final check. The delivery is a zip of a fresh clone of the last commit (D24).
- Last commit: `feat(ui): a fixed header and footer, steps in two columns, a favicon`. Branch `main`, no remote. Commits use the repository's own `user.email`.
- Checks: `./gradlew build` green. In `frontend/`: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build` green; `npm run test:e2e` green (needs `npx playwright install --only-shell chromium` once). `docker compose up --build` serves the app on 8080, or on `PORT`; `E2E_BASE_URL=http://localhost:<port> npm run test:e2e` runs the features against it.
- Tests: Java 275 (library 238, server 37); frontend 244 in 31 files (unit 154, component 71, integration 19); end to end 27 scenarios in 7 features.
- Environment: Gradle needs `JAVA_HOME` pointing at a JDK 17+; the toolchain compiles with JDK 25. Node 24.15+. Docker Desktop with Compose for the image.
- Next step: S23.3, drag and drop of the steps, which the developer asked for with the layout. After them, a new zip of a fresh clone, made with the script that keeps Unix permissions (S20).
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
- Commit: `f51c3a3`.
- Open: none.
- Next: S19 (optional, beyond the brief) or S20, the final check.

### S19.1 Turning a step off (2026-10-25)

- Goal: D48, beyond the brief: a step can be off without being removed.
- Requirements: beyond the brief (requirements, last section).
- Decisions: D48, in the new section J of decisions.
- Read: Reka UI 2.11 `SwitchRoot` (button with role switch, `aria-checked`, `data-state`, `aria-label` taken from the attributes, Enter toggles); the custom variants in `src/index.css` (`data-checked` matches `data-state='checked'`).
- Changed: `model/chain.ts` (`enabled`, `setEnabled`), `model/run.ts` (leaves steps that are off out), the store (`setEnabled`), the editor's types, controller (no result and no errors for a step that is off), view and container; `StepCard.vue` (switch, Off, dashed border, note) and `StepCard/model/status.ts` (`offStatus`); `PipelineEditor/model/summary.ts` (counts steps that are off); `components/ui/switch/`, added with `npx shadcn-vue@2.8.2 add switch`, then outlined when off and given system colours for forced colours; unit, component and integration tests; the e2e features and steps (`runSwitch` helper, "I turn off step N", the contrast check); README (new section "Beyond the brief"), requirements, decisions, design (section 7), both journals.
- Verified: 175 Vitest tests (unit 107, component 57, integration 11); 10 e2e scenarios. The contrast scenario fails while the thumb's class is `forced-colors:bg-[CanvasText]`, which Tailwind sorts before `data-unchecked:bg-muted-foreground`; as `forced-colors:data-unchecked:bg-[CanvasText]` it sorts after, and passes. Screenshots taken with a temporary spec in `e2e/screenshots`, deleted afterwards; ports 8091 and 4191 free; the developer's server on 8080 untouched.
- Commit: `a5940ee`.
- Open: none.
- Next: S19.2, the chain in the URL.

### S19.2 The chain in the URL (2026-10-25)

- Goal: D49, beyond the brief: the chain in the URL, so it can be shared.
- Requirements: beyond the brief (requirements, last section).
- Decisions: D49, with the rejected alternatives under section J.
- Read: VueUse 14 `debounceFilter`: `watchDebounced` cannot cancel a waiting call, `useDebounceFn` returns a function with `cancel`, `flush` and `isPending`.
- Changed: `model/link.ts` (`toFragment`, `fromFragment`, `LinkStatus`); `model/chain.ts` (`ChainContent`, `withIds`); the store (`nextId`, `load`); `composables/useChainLink.ts`; the controller (`shareLink`, `linkProblem`), view (alert, toolbar) and container; `components/CopyLinkButton.vue`; `tests/helpers/clipboard.ts` (moved out of the output panel's test) and `tests/helpers/setup.ts` (plain address after every test); tests of the model, store, view, button and `tests/integration/ChainLink.test.ts`; `e2e/features/share-chain.feature` and `e2e/steps/link.ts`; README, requirements, decisions, design (section 7), both journals.
- Verified: 197 Vitest tests (unit 120, component 61, integration 16); 12 e2e scenarios in 3 features; the copied link read back from Chromium's clipboard (`context.grantPermissions`); screenshots taken with a temporary spec, deleted afterwards; ports 8091 and 4191 free; the developer's server on 8080 untouched.
- Commit: `b78f934`.
- Open: none.
- Next: S19.3, example chains.

### S19.3 Example chains (2026-10-25)

- Goal: D50, beyond the brief: example chains to start from.
- Requirements: beyond the brief (requirements, last section, now all built).
- Decisions: D50.
- Read: `Catalog`, `Step`, `ArgumentValue`, `BuiltIns`, `CatalogResponse`, `CatalogControllerTest` (`isStrictlyEqualTo` the contract).
- Changed: library `Example` (new), `Catalog` (`examples()`, identity check), `BuiltIns` (five examples), `ExamplesTest` (new), `CatalogTest`; server `CatalogResponse` (`examples`, values in display order), `CatalogController` (OpenAPI text); `contract/catalog.json` (examples added from a temporary server on port 8093), `contract/README.md`; frontend `model/catalog.ts` (`Example`), `api/contract.ts` (schema, checks, defaults), the editor's types (`ExampleLink`), controller, view (examples under the search) and container, `OutputPanel.vue` (Copy link moved here); tests of the contract, the view, the output panel, the R2.1 catalog fixture and the picker's groups (`examples: []`), `ChainLink.test.ts`; `e2e/features/examples.feature`, `e2e/steps/link.ts`; `docs/images` taken again; README, requirements, decisions, design (sections 2, 5, 6, 7), both journals.
- Verified: `./gradlew build` (library 220, server 26); 203 Vitest tests (unit 123, component 63, integration 17); 13 e2e scenarios; "the chain has no steps" fails with the example's 2 steps on the page; the temporary server on 8093 stopped and no process of it left; ports 8091 and 4191 free; the developer's server on 8080 untouched.
- Commit: `92abc8a`.
- Open: none.
- Next: S20, the final check.

### S20 The final check (2026-10-25)

- Goal: a fresh clone, every check, the README read through, a zip with `.git` (D24).
- Requirements: R4.1–R4.4.
- Decisions: none new.
- Read: `gradle.properties` (`org.gradle.caching=true`: a first build in a fresh clone takes compilation and tests from the local cache); the author and committer addresses of every commit; the README, design section 9 and the AI log's README as a reviewer.
- Changed: README (how it is built, worth a look, how AI was used, known issues), `docs/design.md` (section 9), `docs/ai-log/README.md` (no raw exports, D25), both journals. History: the author and committer address of all 17 commits set to the developer's private one, dates and content kept, the journals' hashes of earlier commits updated; checked pair by pair before `main` moved; a bundle of the old history kept outside the repository; a local `user.email` set.
- Verified: fresh clone with `./gradlew build` (again with `--no-build-cache`: 25 tasks executed, 246 tests), `npm ci`, `format:check`, `lint`, `typecheck`, 203 Vitest tests, `build`, `npm audit` (0), `npm run test:e2e` (13); `docker compose build --no-cache` (150 s), the container on 8095 (catalog with 11 transformations and 5 examples, Swagger UI, user `pipeline`), 13 e2e scenarios against it; `eclipse-temurin:21-jdk-noble` with an empty Gradle home built a fresh clone, the foojay resolver downloading JDK 25 (about 7 min). Docker Desktop stopped afterwards; ports 8091, 4191 and 8095 free; the developer's server on 8080 untouched.
- Commit: `e3a29ec`.
- Open: none.
- Next: none planned.

### S21 Themes (2026-10-25)

- Goal: D51, beyond the brief: light, dark, or the system's theme; and no motion for people who ask for less (D15).
- Requirements: beyond the brief (requirements, last section).
- Decisions: D51; D15 refined; the wording of D33 corrected.
- Read: VueUse 15 `useColorMode` (store `light`/`dark`/`auto`, class on `html`, `useStorage` catches storage errors, `useMediaQuery` checks `matchMedia`); Reka UI 2.11 `RadioGroupRoot`/`RadioGroupItem` (roles radiogroup and radio, `aria-checked`, `data-state`, roving focus, an arrow key checks the radio it focuses while the key is down).
- Changed: `frontend/index.html` (the script before the first paint), `src/index.css` (`.dark` tokens, `color-scheme`, the reduced-motion rule), `composables/useTheme.ts`, `components/ThemeSwitcher.vue`, `App.vue`; tests: `tests/component/ThemeSwitcher.test.ts`, `tests/unit/theme-script.test.ts` (runs the script with `node:vm`), `tests/helpers/setup.ts` (clears the stored theme and the class of `html`); `e2e/features/themes.feature`, `e2e/steps/theme.ts`, the accessibility feature and steps (axe in the dark theme, the chosen theme in forced colours, no motion, the Tab walk from the header), `e2e/support/editor.ts` (`themeOption`), the screenshots (`editor-dark.png` added); README, requirements, decisions, design (section 7), both journals.
- Verified: 215 Vitest tests (unit 130, component 68, integration 17); 19 e2e scenarios in 5 features. Broken on purpose once each, with the files restored afterwards: the storage key in `index.html` (the unit test and "before the app runs" fail), the reduced-motion rule ("no motion" fails), the forced-colours fill (passed at first; the check was made strict, then failed, then passed with the fix). Contrast of the tokens computed from OKLCH; the screenshots looked at. Ports 8091 and 4191 free; the developer's server on 8080 untouched.
- Commit: `54acce3`.
- Open: none.
- Next: none planned; a new zip of a fresh clone with the delivery script.

### S22.1 Languages: the library's texts (2026-10-25)

- Goal: D52, beyond the brief, part 1 of 3: the library returns its texts as messages, with English, German and Russian bundles. The server still renders English, so the API does not change.
- Requirements: beyond the brief (requirements, last section).
- Decisions: D52, with the rejected alternatives under section J. The table of section J mended: an empty line had cut D50 and D51 off from it.
- Read: `java.text.MessageFormat` (quotes, `{0,number,integer}`, `{0,number,#}`, choice formats); `ResourceBundle.Control.getNoFallbackControl` (no fallback to the default locale); with jshell, JDK 25's wording of `PatternSyntaxException.getDescription()` and of `DateTimeFormatter.ofPattern` errors for typical mistakes, and its Russian grouping separator, U+00A0.
- Changed: library `Message` (`Keyed`, `Verbatim`), `Messages` (`render`, `LANGUAGES`), `messages.properties`, `messages_de.properties`, `messages_ru.properties` (147 texts each); messages instead of strings in `Category`, `Parameter` and its four records, `ChoiceParameter.Option`, `TransformationInfo`, `Example`, `ParameterIssue`, `StepResult.Failed`, `ParameterChecks`; `Formats` removed; every transformation, `Encoding`, `Replacement`, `Regex` (`SYNTAX_ERRORS`), `ReformatDates` (`PATTERN_ERRORS`), `transformations/JdkMessage` (new). Tests: `English` (results read in English), `MessagesTest`, `JdkMessageTest`, `BuiltInsTest` (texts in every language), and the fakes and tests that build parameters or compare messages. Server: `ParameterSchemas`, `CatalogResponse`, `RunResponse` render in a given language; `CatalogController` and `RunController` pass English; `RunRequestReader` names the transformation in English. Decisions, both journals.
- Verified: `./gradlew build`: library 238 (18 new), server 26; the catalog is still `contract/catalog.json` byte for byte (`isStrictlyEqualTo`). Broken on purpose, then restored: a lone apostrophe in a German text, a missing Russian text, a Russian count without its number format; the message tests failed on each.
- Commit: `18af4db`.
- Open: none.
- Next: S22.2, the server.

### S22.2 Languages: the server (2026-10-25)

- Goal: D52, part 2 of 3: every response in the language of `Accept-Language` (en, de, ru, else English), named in `Content-Language`, with `Vary: Accept-Language`.
- Requirements: beyond the brief (requirements, last section).
- Decisions: D52 as written in S22.1.
- Read: Spring's `AcceptHeaderLocaleResolver` (supported locales, a language match for a regional tag, the default locale without the header); Spring Boot's `localeResolver` bean (replaced when one of that name exists) and `MessageSourceAutoConfiguration` (`spring.messages.*`, texts without values used as they are); `ResponseEntityExceptionHandler.handleExceptionInternal` (an `ErrorResponse` body updated from the `MessageSource` with the detail code); springdoc's `OperationCustomizer`; `ErrorResponseException`'s constructor with a detail message code.
- Changed: server `LanguageConfiguration` (new: the resolver, an interceptor that sets the two headers on the controllers' answers), `OpenApiConfiguration` (`Accept-Language` on every operation), `CatalogController` (one response per language, built at startup), `RunController` (`Locale` argument), `RunRequestReader` (errors written in the request's language through a `MessageSourceAccessor`), `InvalidRequestException` (detail from `problem.invalidRequest`), `ApiExceptionHandler` (texts from the `MessageSource`); `messages.properties`, `messages_de.properties`, `messages_ru.properties` (16 texts each); `application.properties` (`spring.messages.fallback-to-system-locale=false`). Tests: `CatalogControllerTest`, `RunControllerTest` (`Languages`), `ApiExceptionHandlerTest`, `ApplicationTest` (the header documented), `ServerTextsTest` (new). Docs: design (sections 2, 4, 5, 6, 8; section 5 now also covers S22.1), `contract/README.md`, both journals.
- Verified: `./gradlew build`: library 238, server 37 (11 new). The contract tests still pass in English. Without the supported locales on the resolver, four of the new tests fail (a 500 for the catalog in French, `Content-Language` "ru-RU" and "fr"); restored afterwards.
- Commit: `213e1fb`.
- Open: none.
- Next: S22.3, the frontend.

### S22.3 Languages: the frontend (2026-10-26)

- Goal: D52, part 3 of 3: the frontend in English, German and Russian with vue-i18n, and every call in the chosen language.
- Requirements: beyond the brief (requirements, last section); "UI translations" left the out-of-scope list.
- Decisions: D52 as written in S22.1.
- Read: vue-i18n 11.4.16 on npm (MIT, released 2026-10-18; depends only on its own `@intlify` packages) and the feature flags its bundler build reads; Reka UI 2.11 `ComboboxInput` and `ListboxFilter` (`aria-controls` from the content id, `aria-activedescendant` from the highlighted option, both kept after the list closes) and `ComboboxRoot`'s `unmountOnHide`; rolldown 1.2's `output.codeSplitting.groups`; Playwright's default `locale`, the system's.
- Changed: `package.json` (vue-i18n 11.4.16; `@vue/test-utils` 2.5.1, already installed through Testing Library, now a direct dev dependency), `vite.config.ts` (vue-i18n's flags, a `vendor` chunk), `src/i18n/` (index, en, de, ru), `main.ts`, `App.vue` (the language select, `<html lang>`), `components/LanguageSwitcher.vue`, `composables/useLanguage.ts`, `api/client.ts` (a language argument, Accept-Language), `queries/catalog.ts` and `queries/run.ts` (the language in the query key; the catalog keeps the previous data); the texts of every component; models that take `t` (status, summary, `messages` with `linkProblemMessage`), `model/link.ts` (`LinkProblem`), `useChainLink`, the controller; `components/ui/combobox/ComboboxInput.vue` (both ARIA references only while the list shows); the library's German and Russian regex descriptions, which now say Regex, as the search's placeholder promises. Tests: helpers (`setup.ts`: English for every component, a new instance per test; `i18n.ts`; `serveCatalog` returns the languages asked for), `unit/i18n.test.ts` (new), the tests of the client, summary, messages, status and link; `component/LanguageSwitcher.test.ts` (new), the picker's ARIA; `integration/App.test.ts`. End to end: `support/editor.ts` (names in all three languages), `steps/language.ts` (new), `features/languages.feature` (new); the themes and accessibility features walk the new stop of the Tab key; `playwright.config.ts` (`locale: 'en-US'`); the screenshots taken again, `editor-de.png` added. README, requirements, design (sections 7 and 8), both journals.
- Verified: 243 Vitest tests in 31 files (unit 154, component 71, integration 18); 22 end-to-end scenarios in 6 features; format, lint, typecheck, build without a size warning, `npm audit` (0); `./gradlew build` (238 and 37). The first end-to-end run failed 10 scenarios: 3 because the header's new select took the first stop of the Tab key, 7 by timeouts while the machine was busy (in the traces the catalog took 5 to 40 seconds). With the 3 fixed, 21 passed in 21 seconds; the last one was axe in German, after the list had closed. Keeping the list in the page (`unmountOnHide: false`) put Reka UI's focus guards into the Tab order and broke the keyboard journey, so the input drops the references instead; its new component test fails without that. `TrapsTest`'s time check once took 2.8 s while the machine was busy; three reruns took 0.1 s each. `docker compose build`, then the container on 8095: the catalog in German with `Content-Language: de` and `Vary: Accept-Language`, a regex error in Russian, and the 22 end-to-end scenarios against it; Docker Desktop stopped afterwards. Ports 8091, 4191 and 8095 free; the developer's server on 8080 untouched.
- Commit: `3c9e5dd`.
- Open: none.
- Next: none planned; a new zip of a fresh clone with the delivery script.

### S23.1 A waiting address write no longer undoes a followed link (2026-10-26)

- Goal: fix a race in D49 that the tests showed while the developer's notes on the UI were being built (step 23).
- Requirements: R1.3; D49.
- Decisions: D49 as written.
- Read: `useChainLink`: after an edit the address is rewritten 300 ms later (`useDebounceFn`), and a followed link is opened on `hashchange`, a task of its own. When the page is busy at the moment the address changes, the waiting timer can run before the hashchange is handled: it wrote the old chain into the new address, and the hashchange then opened the old chain again.
- Changed: `composables/useChainLink.ts` (`known`, the fragment that the editor last read or wrote; a waiting write is dropped once the address holds another one), `tests/integration/ChainLink.test.ts` (new: the address changes before its hashchange is handled, and stays as it is), `vite.config.ts` (`testTimeout` 30 s); both journals.
- Verified: "empties the editor when a followed address holds no chain" failed in 4 of 6 runs of the whole suite while the machine was busy, and always passed on its own. The new test fails without the fix, since the waiting write puts the typed chain back into the address, and passes with it. Then 3 runs of the whole suite in a row: 244 Vitest tests. The keyboard journey once took more than 15 s in a whole run, though 3 to 5 s on its own, hence the longer limit.
- Commit: `982af80`.
- Open: none.
- Next: S23.2, the layout.

### S23.2 The layout of the whole window, and a favicon (2026-10-26)

- Goal: the developer's notes on the UI: a fixed header and footer with only the chain scrolling, a favicon, a header that keeps its layout when the language changes, the input and the output across the window, the steps in two columns, a sensible layout at any size. Drag and drop follows in S23.3.
- Requirements: R1.3; D2, D15, D53.
- Decisions: D53 (new); D2 revised: two columns on a wide screen.
- Read: the developer's screenshots: the footer they meant is the search with the examples, and in Russian the header's settings wrapped onto a row of their own, in German not. Tailwind 4: `@custom-variant` with a media query on width and height, `theme()` inside a media query, container queries (`@container`, `@lg:`), `not-sr-only`. Chromium, probed: an absolutely positioned element whose containing block lies outside a scrolling box is placed against the page and adds to the page's own height. Playwright's `toBeInViewport`.
- Changed: `index.css` (the `shell` variant, the `page-width` utility), `App.vue` (a column as high as the window; the header a grid of two columns), `PipelineEditorView.vue` (the part that scrolls, relative, with `scrollbar-gutter: stable`; the steps in a grid of two columns from lg; the footer with the search and the examples, two columns from lg; the loading and failed states inside `page-width`), `ParameterForm.vue` (a container query instead of the `sm` breakpoint), `TransformationPicker.vue` (no box of its own in the footer), `ThemeSwitcher.vue` (names for screen readers only below lg; options 24 px high), `index.html`, `public/favicon.svg` and `favicon.png` (32 px, rendered from the SVG in Chromium). Tests: `integration/PipelineEditor.test.ts` (the keyboard journey passes the output's buttons before the search), `e2e/features/layout.feature` and `e2e/steps/layout.ts` (new), `e2e/screenshots/screenshots.spec.ts` (a 1280 × 800 window); the screenshots taken again. Decisions (D2, D53), requirements, design (section 7: the file map, Layout; section 8), README, both journals.
- Verified: a throwaway Playwright probe measured the header at nine widths in three languages. Before, its height changed with the language below 900 px (123 against 183 at 390 px, 101 against 121 at 640 px, 81 against 101 at 768 px); after, it is the same from 700 px up, and below that only the tagline's lines differ. At ten window sizes the probe found the page 1189 px high in a window of 1000: the two live regions next to the output's buttons stuck out below it. With the middle part relative, the page is as high as the window; with the old classes and without it, the probe found them again. The layout feature fails with the middle part not relative (the page scrolls by 713 px) and with the theme's names always shown (the header differs at 768 px). A first attempt at the first of these changed nothing: Prettier had put the `class` attribute on a line of its own, so the `sed` pattern did not match; `grep -c` now confirms each such change. 244 Vitest tests; 27 end-to-end scenarios in 7 features, 5 of them new; format, lint, typecheck, build. The first full end-to-end run, before the new feature, timed out in 6 scenarios, the first of each worker, while the machine was busy: in a trace the catalog took 14 s and the first run 80 s on the server that had just started. The next run passed 22 of 22 in 21 s.
- Commit: `feat(ui): a fixed header and footer, steps in two columns, a favicon`.
- Open: none.
- Next: S23.3, drag and drop.
