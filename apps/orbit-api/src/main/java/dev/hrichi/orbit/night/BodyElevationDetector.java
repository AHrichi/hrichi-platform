package dev.hrichi.orbit.night;

import java.util.function.BiFunction;
import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.orekit.frames.Frame;
import org.orekit.frames.TopocentricFrame;
import org.orekit.propagation.SpacecraftState;
import org.orekit.propagation.events.AbstractDetector;
import org.orekit.propagation.events.EventDetectionSettings;
import org.orekit.propagation.events.handlers.ContinueOnEvent;
import org.orekit.propagation.events.handlers.EventHandler;
import org.orekit.time.AbsoluteDate;

/**
 * Fires when a celestial body crosses an elevation over an observer: the
 * Sun at sunset or the end of twilight, the Moon as it rises.
 *
 * <p>Orekit's detectors watch a propagated spacecraft; this one only reads
 * the state's date, so any propagator can drive it and Orekit's own root
 * finding times the crossing.
 */
public final class BodyElevationDetector extends AbstractDetector<BodyElevationDetector> {

    /** Ten minutes between checks: the Sun and Moon move slowly. */
    private static final EventDetectionSettings SETTINGS = new EventDetectionSettings(600, 1e-3, 100);

    private final TopocentricFrame observer;
    private final BiFunction<AbsoluteDate, Frame, Vector3D> body;
    private final double elevation;

    /**
     * @param observer  the place on the ground
     * @param body      the body's position at a date, in a frame
     * @param elevation the crossing to detect, radians
     */
    public BodyElevationDetector(
            TopocentricFrame observer, BiFunction<AbsoluteDate, Frame, Vector3D> body, double elevation) {
        this(SETTINGS, new ContinueOnEvent(), observer, body, elevation);
    }

    private BodyElevationDetector(
            EventDetectionSettings settings,
            EventHandler handler,
            TopocentricFrame observer,
            BiFunction<AbsoluteDate, Frame, Vector3D> body,
            double elevation) {
        super(settings, handler);
        this.observer = observer;
        this.body = body;
        this.elevation = elevation;
    }

    /** Elevation of the body above the threshold: positive above, negative below. */
    @Override
    public double g(SpacecraftState state) {
        AbsoluteDate date = state.getDate();
        Frame frame = observer.getParentShape().getBodyFrame();
        return observer.getElevation(body.apply(date, frame), frame, date) - elevation;
    }

    @Override
    protected BodyElevationDetector create(EventDetectionSettings settings, EventHandler handler) {
        return new BodyElevationDetector(settings, handler, observer, body, elevation);
    }
}
