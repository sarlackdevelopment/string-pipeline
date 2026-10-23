// The web API (R3.3): Spring Boot on top of the library.
plugins {
    id("java-conventions")
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":library"))
    implementation(libs.spring.boot.starter.webmvc)
    implementation(libs.springdoc.openapi.starter.webmvc.ui)
    testImplementation(libs.spring.boot.starter.webmvc.test)
    testImplementation(libs.archunit)
}

sourceSets {
    test {
        // The API examples that the frontend tests read too (D20, D46).
        resources.srcDir("../contract")
    }
}

configurations.testRuntimeClasspath {
    // The server tests run the real library and mock nothing. Without Mockito on the classpath, Spring's test support
    // does not attach Mockito's agent at runtime, which the JVM warns about.
    exclude(group = "org.mockito")
}
