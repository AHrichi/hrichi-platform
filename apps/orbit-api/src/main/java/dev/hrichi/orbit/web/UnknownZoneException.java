package dev.hrichi.orbit.web;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/** A time zone Java doesn't know, reported like any other invalid parameter. */
class UnknownZoneException extends ErrorResponseException {

    UnknownZoneException(String zone) {
        super(HttpStatus.BAD_REQUEST, problem(zone), null);
    }

    private static ProblemDetail problem(String zone) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Some parameters are invalid.");
        problem.setTitle("Invalid request");
        problem.setProperty(
                "errors",
                List.of(Map.of("parameter", "zone", "message", "is not an IANA time zone: " + zone)));
        return problem;
    }
}
