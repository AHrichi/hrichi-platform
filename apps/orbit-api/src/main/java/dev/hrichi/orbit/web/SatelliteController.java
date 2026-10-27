package dev.hrichi.orbit.web;

import dev.hrichi.orbit.catalog.Catalog;
import dev.hrichi.orbit.catalog.OrbitShape;
import dev.hrichi.orbit.catalog.OrbitalElements;
import dev.hrichi.orbit.passes.Observer;
import dev.hrichi.orbit.passes.PassPredictor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/satellites")
public class SatelliteController {

    private final Catalog catalog;
    private final PassPredictor passes;
    private final Clock clock;

    public SatelliteController(Catalog catalog, PassPredictor passes, Clock clock) {
        this.catalog = catalog;
        this.passes = passes;
        this.clock = clock;
    }

    @Operation(
            summary = "The catalog, or one group of it",
            description = "Mean elements for every active satellite (about 11,000), refreshed from CelesTrak at"
                    + " most every 6 hours. Pre-serialised and pre-gzipped; send If-None-Match to get 304.")
    @ApiResponse(
            responseCode = "200",
            content = @Content(
                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                    schema = @Schema(implementation = Catalog.CatalogResponse.class)))
    @ApiResponse(responseCode = "304", description = "Not modified since the ETag in If-None-Match", content = @Content)
    @ApiResponse(responseCode = "400", description = "Unknown group", content = @Content(
            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ProblemDetail.class)))
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> list(
            @Parameter(description = "all, stations, starlink, gnss, weather or other")
                    @RequestParam(defaultValue = "all")
                    @Pattern(regexp = "all|stations|starlink|gnss|weather|other")
                    String group,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch,
            @RequestHeader(value = HttpHeaders.ACCEPT_ENCODING, required = false) String acceptEncoding) {
        Catalog.Payload payload = catalog.payload(group).orElseThrow(CatalogLoadingException::new);
        var response = ResponseEntity.ok()
                .eTag(payload.etag())
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .varyBy(HttpHeaders.ACCEPT_ENCODING);
        if (payload.etag().equals(ifNoneMatch)) {
            return ResponseEntity.status(304)
                    .eTag(payload.etag())
                    .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                    .build();
        }
        if (acceptEncoding != null && acceptEncoding.contains("gzip")) {
            return response.header(HttpHeaders.CONTENT_ENCODING, "gzip").body(payload.gzip());
        }
        return response.body(Catalog.json(payload));
    }

    @Operation(summary = "One satellite, with its orbit's size and period")
    @ApiResponse(responseCode = "200", useReturnTypeSchema = true)
    @ApiResponse(responseCode = "404", description = "No active satellite has this number", content = @Content(
            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ProblemDetail.class)))
    @GetMapping(value = "/{noradId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public SatelliteDetails details(@PathVariable @Min(1) int noradId) {
        OrbitalElements elements = find(noradId);
        return SatelliteDetails.of(elements, catalog.groupOf(noradId), OrbitShape.of(elements));
    }

    @Operation(
            summary = "Upcoming passes over a place",
            description = "Rise, highest point and set, computed with Orekit (SGP4). A pass is visible to the naked"
                    + " eye when the satellite is sunlit while the observer's sky is dark.")
    @ApiResponse(responseCode = "200", useReturnTypeSchema = true)
    @ApiResponse(responseCode = "400", description = "Invalid parameters, each listed in errors", content = @Content(
            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "No active satellite has this number", content = @Content(
            mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ProblemDetail.class)))
    @GetMapping(value = "/{noradId}/passes", produces = MediaType.APPLICATION_JSON_VALUE)
    public PassesResponse passes(
            @PathVariable @Min(1) int noradId,
            @Parameter(description = "Degrees, north positive") @RequestParam @DecimalMin("-90") @DecimalMax("90")
                    double lat,
            @Parameter(description = "Degrees, east positive") @RequestParam @DecimalMin("-180") @DecimalMax("180")
                    double lon,
            @Parameter(description = "Metres above the WGS-84 ellipsoid")
                    @RequestParam(defaultValue = "0")
                    @DecimalMin("-500")
                    @DecimalMax("9000")
                    double altM,
            @RequestParam(defaultValue = "3") @Min(1) @Max(7) int days,
            @Parameter(description = "Ignore passes lower than this, in degrees")
                    @RequestParam(defaultValue = "10")
                    @DecimalMin("0")
                    @DecimalMax("60")
                    double minElevation) {
        OrbitalElements elements = find(noradId);
        Observer observer = new Observer(lat, lon, altM);
        Instant from = clock.instant().truncatedTo(ChronoUnit.SECONDS);
        Duration span = Duration.ofDays(days);
        return new PassesResponse(
                noradId,
                elements.objectName(),
                observer,
                from,
                from.plus(span),
                minElevation,
                passes.predict(elements, observer, from, span, minElevation));
    }

    private OrbitalElements find(int noradId) {
        if (!catalog.indexed()) {
            throw new CatalogLoadingException();
        }
        return catalog.find(noradId).orElseThrow(() -> new SatelliteNotFoundException(noradId));
    }
}
