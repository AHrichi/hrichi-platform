package dev.hrichi.orbit.web;

import dev.hrichi.orbit.night.Night;
import dev.hrichi.orbit.night.NightPlanner;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.Clock;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/nights")
public class NightController {

    private final NightPlanner planner;
    private final Clock clock;

    public NightController(NightPlanner planner, Clock clock) {
        this.planner = planner;
        this.clock = clock;
    }

    /** The coming nights at a campsite. */
    public record NightsResponse(
            @Schema(description = "Degrees, rounded to 0.1° (about 11 km)") double latitude,
            @Schema(description = "Degrees, rounded to 0.1°") double longitude,
            @Schema(description = "IANA time zone of the dates") String zone,
            List<Night> nights) {}

    @Operation(
            summary = "The coming nights at a place, for stargazing",
            description = "Sunset, twilight, sunrise, moonrise and moonset, the Moon's phase, windows of"
                    + " moonless astronomical darkness and active meteor showers, computed with Orekit. Nights"
                    + " run from local noon; in the morning, the first is the night just ending.")
    @ApiResponse(responseCode = "200", useReturnTypeSchema = true)
    @ApiResponse(responseCode = "400", description = "Invalid parameters, each listed in errors", content = @Content(
            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ProblemDetail.class)))
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<NightsResponse> nights(
            @Parameter(description = "Degrees, north positive") @RequestParam @DecimalMin("-90") @DecimalMax("90")
                    double lat,
            @Parameter(description = "Degrees, east positive") @RequestParam @DecimalMin("-180") @DecimalMax("180")
                    double lon,
            @Parameter(description = "How many nights") @RequestParam(defaultValue = "14") @Min(1) @Max(30)
                    int days,
            @Parameter(description = "IANA time zone for the dates, e.g. Africa/Tunis")
                    @RequestParam(defaultValue = "UTC")
                    String zone) {
        ZoneId zoneId;
        try {
            zoneId = ZoneId.of(zone);
        } catch (DateTimeException e) {
            throw new UnknownZoneException(zone);
        }
        double latitude = roundTenth(lat);
        double longitude = roundTenth(lon);
        ZonedDateTime now = ZonedDateTime.now(clock.withZone(zoneId));
        LocalDate first = now.getHour() < 12 ? now.toLocalDate().minusDays(1) : now.toLocalDate();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .body(new NightsResponse(
                        latitude, longitude, zoneId.getId(), planner.plan(latitude, longitude, first, days, zoneId)));
    }

    private static double roundTenth(double degrees) {
        return Math.round(degrees * 10) / 10.0;
    }
}
