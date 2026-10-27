package dev.hrichi.orbit.night;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;
import tools.jackson.databind.json.JsonMapper;

/** Reference values from Astronomy Engine (tools/scripts/sky-fixtures.mjs). */
public record Fixtures(List<Place> nights, List<MoonPosition> moon) {

    public record Place(
            String name,
            double lat,
            double lon,
            String zone,
            String date,
            String noon,
            String sunset,
            String civilDusk,
            String nauticalDusk,
            String astronomicalDusk,
            String astronomicalDawn,
            String nauticalDawn,
            String civilDawn,
            String sunrise,
            String moonrise,
            String moonset,
            double moonIllumination) {}

    /** Geocentric, J2000 equator, km. */
    public record MoonPosition(String time, double x, double y, double z) {}

    public static Fixtures load() {
        try (InputStream in = Fixtures.class.getResourceAsStream("/night-fixtures.json")) {
            return JsonMapper.builder().build().readValue(in, Fixtures.class);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
