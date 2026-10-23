# Requirements

The brief does not number its requirements, so we did. Code, tests, commits and the other docs refer to these IDs. Quotes are from the brief.

## Functional

| ID   | Requirement                                                                                                                                                                                                                      |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1.1 | Several transformations; "replace" is the simplest one. Suggested: replace, append, prepend, substring, regex matching. Harder ones are welcome, for example "pattern matching, conversions between different types and formats" |
| R1.2 | Transformations chain: the output of one step is the input of the next, for example replace, then append ("concatenate multiple transformations together")                                                                       |
| R1.3 | Everything happens in the UI, without code: pick a transformation, set its parameters (Replace has `old` and `new`), enter text, see the output                                                                                  |

## Non-functional

| ID   | Requirement                                                                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2.1 | "Frontend configurations are based on backend-provided information": a new transformation needs only a backend implementation, not a new frontend component |

## Technical

| ID   | Requirement                                                                                                                                                                   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R3.1 | Frontend in TypeScript and Vue                                                                                                                                                |
| R3.2 | The string processing is a Java library API on the latest LTS, which is Java 25 as of October 2026. The brief calls this "the only mandatory requirement" of the architecture |
| R3.3 | A web API between the frontend and the library, in any language and framework. The web API and the library may be one service or two                                          |
| R3.4 | Git; the commit history is part of the delivery                                                                                                                               |

## Delivery

| ID   | Requirement                                                                            |
| ---- | -------------------------------------------------------------------------------------- |
| R4.1 | Setup instructions to build and run the solution locally                               |
| R4.2 | Notes on how the app was built, and anything special worth showcasing                  |
| R4.3 | If AI was used: the logs, and the technical decisions behind the solution              |
| R4.4 | A zip of the source with its `.git` folder, or access to a GitHub or GitLab repository |

The delivery is followed by an online presentation and a technical discussion with KNIME engineers.

## Out of scope

Not asked for and left out on purpose; the reasons are in [decisions](decisions.md).

- A node canvas or branching chains (D1).
- Typed values between steps: every step reads and writes text (D3).
- Drag and drop: steps move with buttons (D2).
- Saving chains on a server, user accounts, a database.
- UI translations, a mobile layout, highlighting matches inside the text.

## Beyond the brief

Candidates for after the brief is done, each in its own commit:

- the chain in the URL, so it can be shared;
- example chains to start from;
- disabling a step without removing it.
