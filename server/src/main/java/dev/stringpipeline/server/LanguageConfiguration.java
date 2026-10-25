package dev.stringpipeline.server;

import dev.stringpipeline.library.Messages;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;
import org.springframework.web.servlet.support.RequestContextUtils;

/// The language of each API response (D52): the first language of the request's `Accept-Language` that the library
/// speaks, else English.
@Configuration(proxyBeanMethods = false)
class LanguageConfiguration implements WebMvcConfigurer {

    /// Replaces Spring Boot's resolver, which takes any language a request names and, without the header, the server's
    /// own. This one gives only the library's languages, so a controller can rely on them.
    @Bean
    LocaleResolver localeResolver() {
        var resolver = new AcceptHeaderLocaleResolver();
        resolver.setSupportedLocales(Messages.LANGUAGES);
        resolver.setDefaultLocale(Messages.ENGLISH);
        return resolver;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LanguageHeaders()).addPathPatterns("/api/**");
    }

    /// Names the language of a controller's response in `Content-Language`, and says with `Vary` that it follows
    /// `Accept-Language`, so a cache keeps one copy per language. Spring's own answers, such as a 404, are English
    /// and name no language.
    private static final class LanguageHeaders implements HandlerInterceptor {

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            if (handler instanceof HandlerMethod) {
                response.setHeader(
                        HttpHeaders.CONTENT_LANGUAGE,
                        RequestContextUtils.getLocale(request).toLanguageTag());
                response.addHeader(HttpHeaders.VARY, HttpHeaders.ACCEPT_LANGUAGE);
            }
            return true;
        }
    }
}
