package dev.hrichi.orbit.night;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * One night at one place, from local noon to the next: when the Sun goes
 * down and how far, when the Moon is up, and how much true darkness is left.
 * A time is null when the event doesn't happen that night (a polar summer, a
 * Moon that stays up).
 */
public record Night(
        @Schema(description = "Local date of the evening") LocalDate date,
        @Schema(types = {"string", "null"}, format = "date-time") Instant sunset,
        @Schema(types = {"string", "null"}, format = "date-time", description = "Sun 6° below the horizon")
                Instant civilDusk,
        @Schema(types = {"string", "null"}, format = "date-time", description = "Sun 12° below the horizon")
                Instant nauticalDusk,
        @Schema(types = {"string", "null"}, format = "date-time", description = "Sun 18° below: truly dark")
                Instant astronomicalDusk,
        @Schema(types = {"string", "null"}, format = "date-time") Instant astronomicalDawn,
        @Schema(types = {"string", "null"}, format = "date-time") Instant nauticalDawn,
        @Schema(types = {"string", "null"}, format = "date-time") Instant civilDawn,
        @Schema(types = {"string", "null"}, format = "date-time") Instant sunrise,
        @Schema(types = {"string", "null"}, format = "date-time") Instant moonrise,
        @Schema(types = {"string", "null"}, format = "date-time") Instant moonset,
        @Schema(description = "Lit fraction of the Moon at local midnight, 0–1") double moonIllumination,
        @Schema(description = "Astronomical darkness with the Moon below the horizon") List<DarkWindow> darkWindows,
        @Schema(description = "Total minutes in darkWindows") long darkMinutes,
        @Schema(description = "Meteor showers active at local midnight, busiest first") List<ActiveShower> showers,
        @Schema(description = "0–100: hours of moonless darkness, up to six, plus a little for meteors") int score) {

    public record DarkWindow(Instant start, Instant end) {}

    /** A shower's rate under an ideal sky (zenithal hourly rate). */
    public record ActiveShower(String id, String name, double rate) {}
}
