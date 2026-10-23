package dev.stringpipeline.server;

import dev.stringpipeline.library.Catalog;
import dev.stringpipeline.library.Limits;
import dev.stringpipeline.library.Pipeline;
import dev.stringpipeline.library.transformations.BuiltIns;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/// The library as beans: the built-in catalog, the production limits and a pipeline that uses them (D16, D44).
@Configuration(proxyBeanMethods = false)
public class LibraryConfiguration {

    @Bean
    Catalog catalog() {
        return BuiltIns.catalog();
    }

    @Bean
    Limits limits() {
        return Limits.DEFAULT;
    }

    @Bean
    Pipeline pipeline(Limits limits) {
        return new Pipeline(limits);
    }
}
