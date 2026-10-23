package dev.stringpipeline.server;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideOutsideOfPackage;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.type;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import dev.stringpipeline.library.transformations.BuiltIns;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/// The module boundaries, checked on the compiled classes rather than agreed on (D16, D31, D44).
class ArchitectureTest {

    private static final JavaClasses CLASSES = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("dev.stringpipeline");

    @Test
    @DisplayName("the server uses only the library's API package and BuiltIns")
    void serverUsesOnlyTheLibraryApi() {
        classes()
                .that()
                .resideInAPackage("dev.stringpipeline.server..")
                .should()
                .onlyDependOnClassesThat(resideOutsideOfPackage("dev.stringpipeline.library..")
                        .or(resideInAPackage("dev.stringpipeline.library"))
                        .or(type(BuiltIns.class)))
                .check(CLASSES);
    }

    @Test
    @DisplayName("the library depends on nothing but the JDK and JSpecify")
    void libraryDependsOnNothingElse() {
        classes()
                .that()
                .resideInAPackage("dev.stringpipeline.library..")
                .should()
                .onlyDependOnClassesThat()
                .resideInAnyPackage("dev.stringpipeline.library..", "java..", "org.jspecify..")
                .check(CLASSES);
    }
}
