package dev.hrichi.orbit.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/** Rendered as an RFC 9457 problem with status 404. */
public class SatelliteNotFoundException extends ErrorResponseException {

    public SatelliteNotFoundException(int noradId) {
        super(HttpStatus.NOT_FOUND, problem(noradId), null);
    }

    private static ProblemDetail problem(int noradId) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, "No active satellite has NORAD catalog number " + noradId + ".");
        problem.setTitle("Satellite not found");
        problem.setProperty("noradId", noradId);
        return problem;
    }
}
