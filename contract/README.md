# API contract

Example requests and responses of the web API ([design](../docs/design.md), section 2). They are the contract between backend and frontend (D20, D46):

- the server tests compare `GET /api/catalog` with `catalog.json`, send every `examples/*.request.json` to `POST /api/runs` and compare the answer with the matching `*.response.json`;
- the frontend tests parse every response here through the same zod schemas the app uses.

A change to the API starts with a change here.

| File                                | Shows                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `catalog.json`                      | limits, the four categories and all eleven transformations                                       |
| `examples/brief-chain.*`            | the brief's example, extended: replace → append → substring                                      |
| `examples/step-statuses.*`          | `executed`, `notConfigured`, `invalidParameters` and `notRun` in one run, with the "$5 off" trap |
| `examples/unknown-transformation.*` | a request error as Problem Details (HTTP 400)                                                    |

A `failed` step has no example here: its usual cause is a regex that runs for 2 seconds, which does not belong in a fixture. The server has a dedicated test for it.
