package dev.hrichi.orbit.catalog;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * One satellite's mean elements in CCSDS OMM form, exactly as CelesTrak
 * publishes them. The browser hands these objects straight to satellite.js
 * (`json2satrec`), so the property names stay in OMM's upper case.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@Schema(description = "Mean orbital elements (CCSDS OMM keys, as published by CelesTrak)")
public record OrbitalElements(
        @JsonProperty("OBJECT_NAME") String objectName,
        @JsonProperty("OBJECT_ID") String objectId,
        @Schema(description = "UTC, ISO-8601 without zone") @JsonProperty("EPOCH") String epoch,
        @Schema(description = "Revolutions per day") @JsonProperty("MEAN_MOTION") double meanMotion,
        @JsonProperty("ECCENTRICITY") double eccentricity,
        @Schema(description = "Degrees") @JsonProperty("INCLINATION") double inclination,
        @Schema(description = "Degrees") @JsonProperty("RA_OF_ASC_NODE") double raOfAscNode,
        @Schema(description = "Degrees") @JsonProperty("ARG_OF_PERICENTER") double argOfPericenter,
        @Schema(description = "Degrees") @JsonProperty("MEAN_ANOMALY") double meanAnomaly,
        @JsonProperty("EPHEMERIS_TYPE") int ephemerisType,
        @JsonProperty("CLASSIFICATION_TYPE") String classificationType,
        @JsonProperty("NORAD_CAT_ID") int noradCatId,
        @JsonProperty("ELEMENT_SET_NO") int elementSetNo,
        @JsonProperty("REV_AT_EPOCH") int revAtEpoch,
        @JsonProperty("BSTAR") double bstar,
        @Schema(description = "Revolutions per day², as in the TLE (half the derivative)")
                @JsonProperty("MEAN_MOTION_DOT")
                double meanMotionDot,
        @Schema(description = "Revolutions per day³, as in the TLE (a sixth of the derivative)")
                @JsonProperty("MEAN_MOTION_DDOT")
                double meanMotionDdot) {}
