package dev.hrichi.orbit.web;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * 503 with Retry-After while a restored catalog is being indexed: the full
 * list is already served, lookups follow a few seconds later.
 */
public class CatalogLoadingException extends ErrorResponseException {

    public CatalogLoadingException() {
        super(HttpStatus.SERVICE_UNAVAILABLE, problem(), null);
        getHeaders().set(HttpHeaders.RETRY_AFTER, "5");
    }

    private static ProblemDetail problem() {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.SERVICE_UNAVAILABLE, "The catalog is still loading after a restart. Try again shortly.");
        problem.setTitle("Catalog loading");
        return problem;
    }
}
