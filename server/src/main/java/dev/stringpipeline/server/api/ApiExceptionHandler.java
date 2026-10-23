package dev.stringpipeline.server.api;

import java.util.List;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import tools.jackson.core.JacksonException;

/// Every error of the API is Problem Details (RFC 9457, D17, D41).
///
/// Spring's base class already renders its own exceptions and [InvalidRequestException] that way. This class adds a
/// clearer message for unreadable JSON, and a generic 500 that never shows internals to the client.
@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @Override
    protected @Nullable ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "The request body is not valid JSON or does not have the expected shape.");
        // Jackson knows where in the document it failed; its message names Java types, so it stays on the server.
        if (ex.getMostSpecificCause() instanceof JacksonException jackson
                && !jackson.getPath().isEmpty()) {
            problem.setProperty(
                    "errors", List.of(new RequestError(pointer(jackson.getPath()), "This value has the wrong type.")));
        }
        return handleExceptionInternal(ex, problem, headers, status, request);
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception exception) {
        log.error("Unexpected error while handling a request", exception);
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong on the server.");
    }

    private static String pointer(List<JacksonException.Reference> path) {
        Object[] segments = path.stream()
                .map(reference -> {
                    String property = reference.getPropertyName();
                    return property != null ? property : (Object) reference.getIndex();
                })
                .toArray();
        return RequestError.pointer(segments);
    }
}
