# String Pipeline

A no-code web app for chaining string transformations: pick transformations, configure each one in a form, see the result of every step. Built as a take-home assignment for the Full-Stack Software Engineer position at KNIME.

## Repository layout

| Path        | What                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| `library/`  | Java 25 library with the transformations and the pipeline that chains them. No frameworks |
| `server/`   | Spring Boot web API on top of the library                                                 |
| `buildSrc/` | Build conventions shared by the Java modules: JDK 25, compiler checks, formatting, JUnit  |

## Prerequisites

- Any JDK 17+ to start Gradle. The modules compile with JDK 25: Gradle uses an installed JDK 25 or downloads one.

## Commands

From the repository root (`gradlew.bat` instead of `./gradlew` in cmd or PowerShell):

| Command                     | What it does                                                              |
| --------------------------- | ------------------------------------------------------------------------- |
| `./gradlew build`           | Compiles with Error Prone and NullAway, checks formatting, runs all tests |
| `./gradlew :server:bootRun` | Starts the API on http://localhost:8080                                   |
| `./gradlew spotlessApply`   | Formats the Java sources                                                  |
