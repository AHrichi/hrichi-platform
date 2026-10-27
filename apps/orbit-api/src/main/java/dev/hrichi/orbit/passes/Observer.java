package dev.hrichi.orbit.passes;

import io.swagger.v3.oas.annotations.media.Schema;

/** A place on the ground, WGS-84. */
public record Observer(
        @Schema(description = "Degrees, north positive") double latitude,
        @Schema(description = "Degrees, east positive") double longitude,
        @Schema(description = "Metres above the ellipsoid") double altitudeM) {}
