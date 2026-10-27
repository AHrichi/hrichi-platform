package dev.hrichi.orbit.passes;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/** One pass of a satellite over an observer, above the minimum elevation. */
public record Pass(
        Point rise,
        @Schema(description = "Highest point of the pass") Point culmination,
        Point set,
        long durationSeconds,
        @Schema(description = "The satellite is sunlit while the observer is in darkness (sun 6° or more below the horizon)")
                boolean visible) {

    public record Point(
            Instant time,
            @Schema(description = "Degrees from north, clockwise") double azimuthDeg,
            @Schema(description = "Degrees above the horizon") double elevationDeg) {}
}
