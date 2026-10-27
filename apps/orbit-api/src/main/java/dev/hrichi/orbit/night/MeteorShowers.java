package dev.hrichi.orbit.night;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/**
 * The major annual meteor showers, from the International Meteor
 * Organization's calendar. {@code meteor-showers.json} is a copy of the Sky
 * lab's table (libs/labs/sky/domain); a test fails if the two differ, and the
 * rate formula matches the browser's {@code showerRate()}.
 */
@Component
public class MeteorShowers {

    /** One shower: dates as month-day, radiant in J2000 degrees, rates as ZHR. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Shower(
            String id,
            String name,
            String start,
            String peak,
            String end,
            double ra,
            double dec,
            double zhr,
            double speed,
            String parent) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record File(List<Shower> showers) {}

    private static final long DAY_MS = Duration.ofDays(1).toMillis();

    private final List<Shower> showers;

    public MeteorShowers() {
        try (InputStream in = MeteorShowers.class.getResourceAsStream("/meteor-showers.json")) {
            if (in == null) {
                throw new IllegalStateException("meteor-showers.json is missing from the classpath");
            }
            showers = JsonMapper.builder().build().readValue(in, File.class).showers();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public List<Shower> all() {
        return showers;
    }

    /**
     * The shower's rate at {@code at}, ZHR: the peak rate falling tenfold every
     * five days either side, and zero outside its activity window.
     */
    public static double rate(Shower shower, Instant at) {
        long time = at.toEpochMilli();
        long peak = nearest(shower.peak(), time);
        long start = nearest(shower.start(), peak);
        long end = nearest(shower.end(), peak);
        if (time < Math.min(start, peak) || time > Math.max(end, peak) + DAY_MS) {
            return 0;
        }
        double days = Math.abs(time - (peak + DAY_MS / 2.0)) / DAY_MS;
        return shower.zhr() * Math.pow(10, -days / 5);
    }

    /** Showers active at {@code at}, busiest first. */
    public List<Night.ActiveShower> active(Instant at) {
        return showers.stream()
                .map(shower -> new Night.ActiveShower(shower.id(), shower.name(), round(rate(shower, at))))
                .filter(shower -> shower.rate() >= 1)
                .sorted(Comparator.comparingDouble(Night.ActiveShower::rate).reversed())
                .toList();
    }

    /** The UTC midnight of {@code monthDay} closest to {@code time}. */
    private static long nearest(String monthDay, long time) {
        int month = Integer.parseInt(monthDay.substring(0, 2));
        int day = Integer.parseInt(monthDay.substring(3, 5));
        int year = Instant.ofEpochMilli(time).atZone(ZoneOffset.UTC).getYear();
        return Stream.of(year - 1, year, year + 1)
                .map(y -> LocalDate.of(y, month, day).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli())
                .min(Comparator.comparingLong(candidate -> Math.abs(candidate - time)))
                .orElseThrow();
    }

    private static double round(double rate) {
        return Math.round(rate * 10) / 10.0;
    }
}
