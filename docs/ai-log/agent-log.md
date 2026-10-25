# Agent log

Handoff for agents. Read "Current state" first; every step below uses the same fields. People should read [journal.md](journal.md).

## Current state

- Phase: backend done; frontend model done; UI kit checked. Next: step 13, the UI.
- Last commit: `chore(ui): shadcn-vue kit on Reka UI, checked by probe tests`. Branch `main`, no remote; delivery is a zip of a fresh clone (D24).
- Checks: `./gradlew build` green. In `frontend/`: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build` green.
- Tests: Java 161 in 19 classes (library 135, server 26); frontend 45 in 7 files.
- Environment: Gradle needs `JAVA_HOME` pointing at a JDK 17+; the toolchain compiles with JDK 25. Node 24.15+.
- Next step: step 13, the UI of design section 7, on `src/model/` and `src/api/`: the Pinia store (D29), TanStack Query for the catalog and runs (D11, D29), the editor's controller, view and container (D26), the schema form with its field registry (D27), the transformation picker on the checked combobox (search includes descriptions; Enter adds the first match), the output panel (D32), and a Vite proxy from `/api` to the server. Add shadcn-vue components only when a component uses them (`npx shadcn-vue@2.8.2 add …`, then lint the copies). Do not let the CLI overwrite `input`, `textarea` or `input-group`: they carry our fixes. After each `add`, review the diff of `src/index.css` and `package.json`. Give every `<Input>` a `type`, or the label rule skips it.
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
- Commit: `chore(ui): shadcn-vue kit on Reka UI, checked by probe tests`.
- Open: the Turkish i trap (step 17).
- Next: S13, the UI.
