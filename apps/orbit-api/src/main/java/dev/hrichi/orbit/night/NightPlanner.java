package dev.hrichi.orbit.night;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.hipparchus.util.FastMath;
import org.orekit.bodies.AnalyticalSolarPositionProvider;
import org.orekit.bodies.GeodeticPoint;
import org.orekit.bodies.OneAxisEllipsoid;
import org.orekit.frames.Frame;
import org.orekit.frames.FramesFactory;
import org.orekit.frames.TopocentricFrame;
import org.orekit.orbits.KeplerianOrbit;
import org.orekit.orbits.PositionAngleType;
import org.orekit.propagation.analytical.KeplerianPropagator;
import org.orekit.propagation.events.EventsLogger;
import org.orekit.time.AbsoluteDate;
import org.orekit.time.TimeScale;
import org.orekit.time.TimeScalesFactory;
import org.orekit.utils.Constants;
import org.orekit.utils.IERSConventions;
import org.springframework.stereotype.Component;

/**
 * Plans stargazing nights (ADR-0017): for a place and the coming nights, when
 * the Sun sets and how deep it goes, when the Moon is up, and the windows of
 * true, moonless darkness. One propagation covers every night; Orekit's event
 * detectors time each crossing to the millisecond.
 */
@Component
public class NightPlanner {

    /** The Sun's or Moon's centre at rise or set: refraction plus the half-disc. */
    private static final double HORIZON = FastMath.toRadians(-0.833);
    private static final double CIVIL = FastMath.toRadians(-6);
    private static final double NAUTICAL = FastMath.toRadians(-12);
    private static final double ASTRONOMICAL = FastMath.toRadians(-18);
    /** Six hours of moonless darkness earns full marks. */
    private static final double FULL_MARKS_MINUTES = 360;
    private static final int CACHE_SIZE = 256;

    static {
        TimeScalesFactory.clearUTCTAIOffsetsLoaders();
        TimeScalesFactory.addUTCTAIOffsetsLoader(new LeapSeconds());
    }

    private final TimeScale utc = TimeScalesFactory.getUTC();
    private final Frame earthFrame = FramesFactory.getGTOD(false);
    private final OneAxisEllipsoid earth = new OneAxisEllipsoid(
            Constants.WGS84_EARTH_EQUATORIAL_RADIUS, Constants.WGS84_EARTH_FLATTENING, earthFrame);
    private final AnalyticalSolarPositionProvider sun = new AnalyticalSolarPositionProvider();
    private final AnalyticalMoon moon = new AnalyticalMoon(FramesFactory.getMOD(IERSConventions.IERS_2010));
    private final MeteorShowers showers;

    /** The same campsite on the same dates gives the same answer. */
    private final Map<String, List<Night>> cache = Collections.synchronizedMap(
            new LinkedHashMap<>(16, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, List<Night>> eldest) {
                    return size() > CACHE_SIZE;
                }
            });

    public NightPlanner(MeteorShowers showers) {
        this.showers = showers;
    }

    /** {@code nights} nights from the evening of {@code first}, local noon to local noon in {@code zone}. */
    public List<Night> plan(double latitude, double longitude, LocalDate first, int nights, ZoneId zone) {
        String key = latitude + "," + longitude + "," + first + "," + nights + "," + zone;
        return cache.computeIfAbsent(key, k -> compute(latitude, longitude, first, nights, zone));
    }

    private List<Night> compute(double latitude, double longitude, LocalDate first, int nights, ZoneId zone) {
        TopocentricFrame observer = new TopocentricFrame(
                earth,
                new GeodeticPoint(FastMath.toRadians(latitude), FastMath.toRadians(longitude), 0),
                "observer");
        Instant start = noon(first, zone);
        Instant end = noon(first.plusDays(nights), zone);

        BodyElevationDetector sunset = new BodyElevationDetector(observer, sun::getPosition, HORIZON);
        BodyElevationDetector civil = new BodyElevationDetector(observer, sun::getPosition, CIVIL);
        BodyElevationDetector nautical = new BodyElevationDetector(observer, sun::getPosition, NAUTICAL);
        BodyElevationDetector astronomical = new BodyElevationDetector(observer, sun::getPosition, ASTRONOMICAL);
        BodyElevationDetector moonrise = new BodyElevationDetector(observer, moon::position, HORIZON);

        // Any propagator will do: the detectors only read the date.
        AbsoluteDate from = date(start);
        KeplerianPropagator clock = new KeplerianPropagator(new KeplerianOrbit(
                7_000_000, 0, 0, 0, 0, 0, PositionAngleType.MEAN, FramesFactory.getEME2000(), from, Constants.WGS84_EARTH_MU));
        EventsLogger logger = new EventsLogger();
        for (BodyElevationDetector detector : List.of(sunset, civil, nautical, astronomical, moonrise)) {
            clock.addEventDetector(logger.monitorDetector(detector));
        }
        clock.propagate(from, date(end));

        List<Crossing> crossings = logger.getLoggedEvents().stream()
                .map(event -> new Crossing(
                        event.getEventDetector(), event.isIncreasing(), instant(event.getState().getDate())))
                .sorted((a, b) -> a.time().compareTo(b.time()))
                .toList();

        List<Night> result = new ArrayList<>(nights);
        for (int i = 0; i < nights; i++) {
            LocalDate evening = first.plusDays(i);
            Instant noon = noon(evening, zone);
            Instant nextNoon = noon(evening.plusDays(1), zone);
            List<Crossing> tonight = crossings.stream()
                    .filter(c -> !c.time().isBefore(noon) && c.time().isBefore(nextNoon))
                    .toList();

            List<Night.DarkWindow> dark = darkWindows(observer, noon, nextNoon, tonight, astronomical, moonrise);
            long darkMinutes = dark.stream()
                    .mapToLong(w -> Duration.between(w.start(), w.end()).toMinutes())
                    .sum();
            Instant midnight = noon.plus(Duration.between(noon, nextNoon).dividedBy(2));
            List<Night.ActiveShower> active = showers.active(midnight);
            double busiest = active.isEmpty() ? 0 : active.getFirst().rate();
            int score = (int) Math.round(
                    100 * Math.min(1, darkMinutes / FULL_MARKS_MINUTES + Math.min(0.2, busiest / 500)));

            result.add(new Night(
                    evening,
                    first(tonight, sunset, false),
                    first(tonight, civil, false),
                    first(tonight, nautical, false),
                    first(tonight, astronomical, false),
                    first(tonight, astronomical, true),
                    first(tonight, nautical, true),
                    first(tonight, civil, true),
                    first(tonight, sunset, true),
                    first(tonight, moonrise, true),
                    first(tonight, moonrise, false),
                    round(illumination(date(midnight))),
                    dark,
                    darkMinutes,
                    active,
                    score));
        }
        return result;
    }

    private record Crossing(Object detector, boolean rising, Instant time) {}

    /** The first crossing by {@code detector} in the given direction, or null. */
    private static Instant first(List<Crossing> crossings, Object detector, boolean rising) {
        return crossings.stream()
                .filter(c -> c.detector() == detector && c.rising() == rising)
                .map(Crossing::time)
                .findFirst()
                .orElse(null);
    }

    /**
     * Walks the night from noon, tracking whether the Sun is below −18° and
     * the Moon below the horizon, and keeps the stretches where both hold.
     */
    private List<Night.DarkWindow> darkWindows(
            TopocentricFrame observer,
            Instant noon,
            Instant nextNoon,
            List<Crossing> tonight,
            Object astronomical,
            Object moonrise) {
        AbsoluteDate start = date(noon);
        Frame frame = observer.getParentShape().getBodyFrame();
        boolean sunDown = observer.getElevation(sun.getPosition(start, frame), frame, start) < ASTRONOMICAL;
        boolean moonDown = observer.getElevation(moon.position(start, frame), frame, start) < HORIZON;

        List<Night.DarkWindow> windows = new ArrayList<>();
        Instant openedAt = sunDown && moonDown ? noon : null;
        for (Crossing crossing : tonight) {
            if (crossing.detector() == astronomical) {
                sunDown = !crossing.rising();
            } else if (crossing.detector() == moonrise) {
                moonDown = !crossing.rising();
            } else {
                continue;
            }
            boolean dark = sunDown && moonDown;
            if (dark && openedAt == null) {
                openedAt = crossing.time();
            } else if (!dark && openedAt != null) {
                windows.add(new Night.DarkWindow(openedAt, crossing.time()));
                openedAt = null;
            }
        }
        if (openedAt != null) {
            windows.add(new Night.DarkWindow(openedAt, nextNoon));
        }
        return windows;
    }

    /** Lit fraction of the Moon, from the angle Sun–Moon–Earth. */
    double illumination(AbsoluteDate date) {
        Frame frame = FramesFactory.getEME2000();
        Vector3D toMoon = moon.position(date, frame);
        Vector3D toSun = sun.getPosition(date, frame);
        double phaseAngle = Vector3D.angle(toMoon.negate(), toSun.subtract(toMoon));
        return (1 + FastMath.cos(phaseAngle)) / 2;
    }

    private static Instant noon(LocalDate date, ZoneId zone) {
        return date.atTime(LocalTime.NOON).atZone(zone).toInstant();
    }

    private AbsoluteDate date(Instant instant) {
        return new AbsoluteDate(Date.from(instant), utc);
    }

    private Instant instant(AbsoluteDate date) {
        return date.toDate(utc).toInstant();
    }

    private static double round(double value) {
        return Math.round(value * 1000) / 1000.0;
    }
}
