# Agent log

Handoff for agents. Read "Current state" first; every step below uses the same fields. People should read [journal.md](journal.md).

## Current state

- Phase: design approved. Next: step 9, the library.
- Last commit: `docs(design): API contract, transformations, library and frontend design`. Branch `main`, no remote; delivery is a zip of a fresh clone (D24).
- Checks: `./gradlew build` green. In `frontend/`: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build` green.
- Tests: Java 1 (the server context starts), frontend 1 (the app heading renders).
- Environment: Gradle needs `JAVA_HOME` pointing at a JDK 17+; the toolchain compiles with JDK 25. Node 24.15+.
- Next step: the library as in `docs/design.md` sections 4 and 5: parameters, values, results, pipeline, catalog, limits, and the six transformations; tests per transformation and per trap, and the run examples of `contract/` reproduced through the Java API.
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
- Commit: `docs(design): API contract, transformations, library and frontend design`.
- Open: none.
- Next: S9, the library.
