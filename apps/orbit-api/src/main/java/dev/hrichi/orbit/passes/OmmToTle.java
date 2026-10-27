package dev.hrichi.orbit.passes;

import dev.hrichi.orbit.catalog.OrbitalElements;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.hipparchus.util.FastMath;
import org.orekit.propagation.analytical.tle.TLE;
import org.orekit.time.AbsoluteDate;
import org.orekit.time.TimeScale;

/**
 * Builds Orekit's TLE from OMM elements without formatting TLE text lines,
 * which can't hold catalog numbers above 99,999.
 */
final class OmmToTle {

    private static final Pattern OBJECT_ID = Pattern.compile("^(\\d{4})-(\\d{3})(\\w*)$");
    private static final double SECONDS_PER_DAY = 86_400;

    private OmmToTle() {}

    static TLE convert(OrbitalElements e, TimeScale utc) {
        int launchYear = 2000;
        int launchNumber = 1;
        String launchPiece = "A";
        Matcher id = OBJECT_ID.matcher(e.objectId() == null ? "" : e.objectId());
        if (id.matches()) {
            launchYear = Integer.parseInt(id.group(1));
            launchNumber = Integer.parseInt(id.group(2));
            launchPiece = id.group(3).isEmpty() ? "A" : id.group(3);
        }
        char classification = e.classificationType() == null || e.classificationType().isEmpty()
                ? 'U'
                : e.classificationType().charAt(0);
        return new TLE(
                e.noradCatId(),
                classification,
                launchYear,
                launchNumber,
                launchPiece,
                e.ephemerisType(),
                e.elementSetNo(),
                new AbsoluteDate(e.epoch(), utc),
                // rev/day → rad/s
                e.meanMotion() * 2 * FastMath.PI / SECONDS_PER_DAY,
                // OMM, like the TLE, stores ṅ/2 in rev/day² and n̈/6 in rev/day³.
                e.meanMotionDot() * 4 * FastMath.PI / (SECONDS_PER_DAY * SECONDS_PER_DAY),
                e.meanMotionDdot() * 12 * FastMath.PI / (SECONDS_PER_DAY * SECONDS_PER_DAY * SECONDS_PER_DAY),
                e.eccentricity(),
                FastMath.toRadians(e.inclination()),
                FastMath.toRadians(e.argOfPericenter()),
                FastMath.toRadians(e.raOfAscNode()),
                FastMath.toRadians(e.meanAnomaly()),
                e.revAtEpoch(),
                e.bstar(),
                utc);
    }
}
