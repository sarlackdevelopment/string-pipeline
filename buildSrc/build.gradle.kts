plugins {
    `kotlin-dsl`
}

repositories {
    gradlePluginPortal()
}

dependencies {
    implementation(libs.errorprone.gradle.plugin)
    implementation(libs.spotless.gradle.plugin)
}
