# String Pipeline

A no-code web app for chaining string transformations: pick transformations, configure each one in a form, see the result of every step. Built as a take-home assignment for the Full-Stack Software Engineer position at KNIME.

## Documentation

- [Requirements](docs/requirements.md): the brief as numbered requirements, R1.1–R4.4
- [Decisions](docs/decisions.md): how we read the brief and why we chose what we chose, D1–D39
- [Design](docs/design.md): the API, the transformations, the library, the server and the frontend
- [API contract](contract/README.md): example requests and responses that the Java and TypeScript tests share
- [AI usage log](docs/ai-log/README.md): every step taken with the AI assistant, for people and for agents

## Repository layout

| Path        | What                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| `library/`  | Java 25 library with the transformations and the pipeline that chains them. No frameworks |
| `server/`   | Spring Boot web API on top of the library                                                 |
| `buildSrc/` | Build conventions shared by the Java modules: JDK 25, compiler checks, formatting, JUnit  |
| `frontend/` | Vue 3 + TypeScript single-page app, built with Vite                                       |

## Using the library

The library is plain Java 25 and runs without the web API ([design](docs/design.md), section 5):

```java
Catalog catalog = BuiltIns.catalog();
Step replace = new Step(
        catalog.find("replace").orElseThrow(),
        Map.of("old", ArgumentValue.text("Fake"), "new", ArgumentValue.text("Real")));
Step append = new Step(catalog.find("append").orElseThrow(), Map.of("text", ArgumentValue.text("!")));

PipelineResult result = new Pipeline(Limits.DEFAULT).run("Fake Python", List.of(replace, append));
result.output(); // Optional[Real Python!]
```

Every step's result is `Executed`, `NotConfigured`, `InvalidParameters`, `Failed` or `NotRun`: problems come back as data, never as exceptions.

## Web API

| Endpoint           | What it does                                                                   |
| ------------------ | ------------------------------------------------------------------------------ |
| `GET /api/catalog` | Limits, categories and every transformation with its parameters as JSON Schema |
| `POST /api/runs`   | Runs a chain and returns a result for every step                               |

With the server running (`./gradlew :server:bootRun`), Swagger UI at http://localhost:8080/swagger-ui.html lets you try both endpoints. From the command line:

```sh
curl -H 'Content-Type: application/json' \
  --data-binary @contract/examples/brief-chain.request.json http://localhost:8080/api/runs
```

A problem inside a step comes back as that step's `status` with HTTP 200; a malformed request is a 400 with Problem Details (RFC 9457) and JSON pointers. Every example request and response is in [contract/](contract/README.md).

## Prerequisites

- Any JDK 17+ to start Gradle. The modules compile with JDK 25: Gradle uses an installed JDK 25 or downloads one.
- Node.js 24.15+ with npm 11 for the frontend.

## Commands

### Backend

From the repository root (`gradlew.bat` instead of `./gradlew` in cmd or PowerShell):

| Command                     | What it does                                                                   |
| --------------------------- | ------------------------------------------------------------------------------ |
| `./gradlew build`           | Compiles with Error Prone and NullAway, checks formatting, runs all tests      |
| `./gradlew :server:bootRun` | Starts the API on http://localhost:8080, with Swagger UI at `/swagger-ui.html` |
| `./gradlew spotlessApply`   | Formats the Java sources                                                       |

### Frontend

From `frontend/`, after `npm ci`:

| Command                           | What it does                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`                     | Starts the dev server on http://localhost:5173                                           |
| `npm run build`                   | Type-checks and builds the production bundle into `frontend/dist`                        |
| `npm test`                        | Runs the Vitest suites; `npm run test:coverage` adds a V8 coverage report                |
| `npm run test:unit`               | Runs only the unit tests: the model, the API client and the contract parsing             |
| `npm run lint`                    | Runs oxlint, then ESLint for Vue templates, template accessibility and type-aware rules  |
| `npm run typecheck`               | Type-checks the app, the tests and the config files with `vue-tsc`                       |
| `npm run format`                  | Formats with Prettier; `npm run format:check` only checks                                |
| `npx shadcn-vue@2.8.2 add <name>` | Copies a shadcn-vue component into `src/components/ui/`, where it becomes our code (D28) |

### Before every commit

```sh
./gradlew build
cd frontend && npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```
