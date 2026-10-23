# String Pipeline

A no-code web app for chaining string transformations: pick transformations, configure each one in a form, see the result of every step. Built as a take-home assignment for the Full-Stack Software Engineer position at KNIME.

## Documentation

- [Requirements](docs/requirements.md): the brief as numbered requirements, R1.1–R4.4
- [Decisions](docs/decisions.md): how we read the brief and why we chose what we chose, D1–D39
- [AI usage log](docs/ai-log/README.md): every step taken with the AI assistant, for people and for agents

## Repository layout

| Path        | What                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| `library/`  | Java 25 library with the transformations and the pipeline that chains them. No frameworks |
| `server/`   | Spring Boot web API on top of the library                                                 |
| `buildSrc/` | Build conventions shared by the Java modules: JDK 25, compiler checks, formatting, JUnit  |
| `frontend/` | Vue 3 + TypeScript single-page app, built with Vite                                       |

## Prerequisites

- Any JDK 17+ to start Gradle. The modules compile with JDK 25: Gradle uses an installed JDK 25 or downloads one.
- Node.js 24.15+ with npm 11 for the frontend.

## Commands

### Backend

From the repository root (`gradlew.bat` instead of `./gradlew` in cmd or PowerShell):

| Command                     | What it does                                                              |
| --------------------------- | ------------------------------------------------------------------------- |
| `./gradlew build`           | Compiles with Error Prone and NullAway, checks formatting, runs all tests |
| `./gradlew :server:bootRun` | Starts the API on http://localhost:8080                                   |
| `./gradlew spotlessApply`   | Formats the Java sources                                                  |

### Frontend

From `frontend/`, after `npm ci`:

| Command             | What it does                                                                            |
| ------------------- | --------------------------------------------------------------------------------------- |
| `npm run dev`       | Starts the dev server on http://localhost:5173                                          |
| `npm run build`     | Type-checks and builds the production bundle into `frontend/dist`                       |
| `npm test`          | Runs the Vitest suites; `npm run test:coverage` adds a V8 coverage report               |
| `npm run lint`      | Runs oxlint, then ESLint for Vue templates, template accessibility and type-aware rules |
| `npm run typecheck` | Type-checks the app, the tests and the config files with `vue-tsc`                      |
| `npm run format`    | Formats with Prettier; `npm run format:check` only checks                               |

### Before every commit

```sh
./gradlew build
cd frontend && npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

## Known issues

- `npm audit` reports [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) (`braces`, denial of service through deeply nested glob patterns) via `@vue/eslint-config-typescript`. The package runs only at lint time and reads globs from our own config, and no fixed `braces` release exists. `npm audit --omit=dev` is clean.
