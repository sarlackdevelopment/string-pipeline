plugins {
    // Downloads JDK 25 when no matching JDK is installed (toolchain in buildSrc/java-conventions).
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

rootProject.name = "string-pipeline"

dependencyResolutionManagement {
    repositoriesMode = RepositoriesMode.FAIL_ON_PROJECT_REPOS
    repositories {
        mavenCentral()
    }
}

include("library", "server")
