package dev.hrichi.orbit.passes;

import dev.hrichi.orbit.catalog.OrbitalElements;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.hipparchus.util.FastMath;
import org.orekit.bodies.AnalyticalSolarPositionProvider;
import org.orekit.bodies.GeodeticPoint;
import org.orekit.bodies.OneAxisEllipsoid;
import org.orekit.frames.Frame;
import org.orekit.frames.FramesFactory;
import org.orekit.frames.TopocentricFrame;
import org.orekit.propagation.SpacecraftState;
import org.orekit.propagation.analytical.tle.TLE;
import org.orekit.propagation.analytical.tle.TLEPropagator;
import org.orekit.propagation.events.ElevationDetector;
import org.orekit.propagation.events.ElevationExtremumDetector;
import org.orekit.propagation.events.EventsLogger;
import org.orekit.propagation.events.handlers.ContinueOnEvent;
import org.orekit.time.AbsoluteDate;
import org.orekit.time.TimeScale;
import org.orekit.time.TimeScalesFactory;
import org.orekit.utils.Constants;
import org.springframework.stereotype.Component;

/**
 * Predicts when a satellite rises and sets over an observer, with Orekit's
 * SGP4 propagator and elevation event detectors (ADR-0013).
 *
 * <p>The Earth frame is GTOD without Earth-orientation corrections, so no
 * EOP files are needed; polar motion and UT1 − UTC move a pass by well under
 * a second, far below what a TLE can promise.
 */
@Component
public class PassPredictor {

    /** Event search step: shorter than the shortest pass worth reporting. */
    private static final double MAX_CHECK_S = 30;
    private static final double THRESHOLD_S = 1e-3;
    /** Sampling step for the visibility check. */
    private static final double VISIBILITY_STEP_S = 15;
    /** Civil twilight: the sky is dark enough to see a sunlit satellite. */
    private static final double DARK_SKY_SUN_ELEVATION = FastMath.toRadians(-6);

    static {
        TimeScalesFactory.clearUTCTAIOffsetsLoaders();
        TimeScalesFactory.addUTCTAIOffsetsLoader(new LeapSeconds());
    }

    private final TimeScale utc = TimeScalesFactory.getUTC();
    private final Frame earthFrame = FramesFactory.getGTOD(false);
    private final OneAxisEllipsoid earth = new OneAxisEllipsoid(
            Constants.WGS84_EARTH_EQUATORIAL_RADIUS, Constants.WGS84_EARTH_FLATTENING, earthFrame);
    private final AnalyticalSolarPositionProvider sun = new AnalyticalSolarPositionProvider();

    public List<Pass> predict(
            OrbitalElements elements, Observer observer, Instant from, Duration span, double minElevationDeg) {
        TLE tle = OmmToTle.convert(elements, utc);
        TopocentricFrame topo = new TopocentricFrame(
                earth,
                new GeodeticPoint(
                        FastMath.toRadians(observer.latitude()),
                        FastMath.toRadians(observer.longitude()),
                        observer.altitudeM()),
                "observer");
        double minElevation = FastMath.toRadians(minElevationDeg);

        EventsLogger logger = new EventsLogger();
        ElevationDetector horizon = new ElevationDetector(MAX_CHECK_S, THRESHOLD_S, topo)
                .withConstantElevation(minElevation)
                .withHandler(new ContinueOnEvent());
        ElevationExtremumDetector peak =
                new ElevationExtremumDetector(MAX_CHECK_S, THRESHOLD_S, topo).withHandler(new ContinueOnEvent());
        TLEPropagator propagator = TLEPropagator.selectExtrapolator(tle);
        propagator.addEventDetector(logger.monitorDetector(horizon));
        propagator.addEventDetector(logger.monitorDetector(peak));

        AbsoluteDate start = new AbsoluteDate(Date.from(from), utc);
        propagator.propagate(start, start.shiftedBy((double) span.toSeconds()));

        // Without event handling, for sampling the visibility of each pass.
        TLEPropagator sampler = TLEPropagator.selectExtrapolator(tle);
        List<Pass> passes = new ArrayList<>();
        Pass.Point rise = null;
        Pass.Point culmination = null;
        List<EventsLogger.LoggedEvent> events = new ArrayList<>(logger.getLoggedEvents());
        events.sort(Comparator.comparing(EventsLogger.LoggedEvent::getDate));
        for (EventsLogger.LoggedEvent event : events) {
            SpacecraftState state = event.getState();
            if (event.getEventDetector() == horizon) {
                if (event.isIncreasing()) {
                    rise = point(topo, state);
                    culmination = null;
                } else if (rise != null) {
                    // A pass that started before `from` has no rise; it is skipped.
                    Pass.Point set = point(topo, state);
                    Pass.Point top = culmination != null ? culmination : rise;
                    passes.add(new Pass(
                            rise,
                            top,
                            set,
                            Duration.between(rise.time(), set.time()).toSeconds(),
                            visible(sampler, topo, rise.time(), set.time())));
                    rise = null;
                }
            } else if (rise != null && !event.isIncreasing()) {
                Pass.Point candidate = point(topo, state);
                if (culmination == null || candidate.elevationDeg() > culmination.elevationDeg()) {
                    culmination = candidate;
                }
            }
        }
        return passes;
    }

    private Pass.Point point(TopocentricFrame topo, SpacecraftState state) {
        Vector3D position = state.getPosition();
        Frame frame = state.getFrame();
        AbsoluteDate date = state.getDate();
        double azimuth = FastMath.toDegrees(topo.getAzimuth(position, frame, date));
        double elevation = FastMath.toDegrees(topo.getElevation(position, frame, date));
        return new Pass.Point(date.toDate(utc).toInstant(), round(azimuth), round(elevation));
    }

    /** Sunlit satellite and a dark sky at any moment of the pass. */
    private boolean visible(TLEPropagator sampler, TopocentricFrame topo, Instant rise, Instant set) {
        AbsoluteDate end = new AbsoluteDate(Date.from(set), utc);
        for (AbsoluteDate date = new AbsoluteDate(Date.from(rise), utc);
                date.compareTo(end) <= 0;
                date = date.shiftedBy(VISIBILITY_STEP_S)) {
            SpacecraftState state = sampler.propagate(date);
            Frame frame = state.getFrame();
            Vector3D sunPosition = sun.getPosition(date, frame);
            boolean darkSky = topo.getElevation(sunPosition, frame, date) < DARK_SKY_SUN_ELEVATION;
            if (darkSky && sunlit(state.getPosition(), sunPosition)) {
                return true;
            }
        }
        return false;
    }

    /** Cylindrical Earth shadow: good enough to say whether a satellite shines. */
    static boolean sunlit(Vector3D satellite, Vector3D sun) {
        Vector3D towardSun = sun.normalize();
        double along = Vector3D.dotProduct(satellite, towardSun);
        if (along >= 0) {
            return true;
        }
        Vector3D offAxis = satellite.subtract(towardSun.scalarMultiply(along));
        return offAxis.getNorm() > Constants.WGS84_EARTH_EQUATORIAL_RADIUS;
    }

    private static double round(double degrees) {
        return Math.round(degrees * 10) / 10.0;
    }
}
