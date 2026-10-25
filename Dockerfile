# syntax=docker/dockerfile:1

# One image with the web API and the built frontend (D22): Node builds the frontend, the JDK builds the server, and
# the JRE runs it. `docker compose up --build` builds the image and starts it on http://localhost:8080.

FROM node:24.22.1-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:25.0.4.1_1-jdk-noble AS server
WORKDIR /build
COPY gradlew settings.gradle.kts gradle.properties ./
COPY gradle/ gradle/
COPY buildSrc/ buildSrc/
COPY library/ library/
COPY server/ server/
# The Gradle distribution and the dependencies stay in a cache between builds; the JDK of this image is the toolchain.
RUN --mount=type=cache,target=/root/.gradle sh gradlew --no-daemon --quiet :server:bootJar

FROM eclipse-temurin:25.0.4.1_1-jre-noble
# A user of its own, without a shell and without the groups of the image's ubuntu user, such as sudo: the server needs
# no more.
RUN useradd --system --no-create-home --shell /usr/sbin/nologin pipeline
WORKDIR /app
COPY --from=server /build/server/build/libs/server.jar server.jar
COPY --from=frontend /build/frontend/dist static/
# Spring Boot serves the frontend from this folder, with index.html at /. The app calls /api on the same origin.
ENV SPRING_WEB_RESOURCES_STATIC_LOCATIONS=file:/app/static/
USER pipeline
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/server.jar"]
