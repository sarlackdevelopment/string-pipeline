package dev.stringpipeline.server.api;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/// A 400 with every problem [RunRequestReader] found, rendered by Spring as Problem Details with an `errors` list
/// (D41). Spring writes its detail in the request's language, from the server's text `problem.invalidRequest` (D52).
final class InvalidRequestException extends ErrorResponseException {

    private static final long serialVersionUID = 1L;

    InvalidRequestException(List<RequestError> errors) {
        super(HttpStatus.BAD_REQUEST, problem(errors), null, "problem.invalidRequest", null);
    }

    private static ProblemDetail problem(List<RequestError> errors) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setProperty("errors", List.copyOf(errors));
        return problem;
    }
}
