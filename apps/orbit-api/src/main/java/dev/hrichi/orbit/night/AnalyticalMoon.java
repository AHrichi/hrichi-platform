package dev.hrichi.orbit.night;

import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.hipparchus.util.FastMath;
import org.orekit.frames.Frame;
import org.orekit.time.AbsoluteDate;
import org.orekit.utils.Constants;

/**
 * The Moon's position, analytically (ADR-0017).
 *
 * <p>Direction from Montenbruck and Pfleger's MiniMoon series (<i>Astronomy on
 * the Personal Computer</i>), good to about an arcminute; distance from the
 * main terms of Meeus' ELP-2000/82 series (<i>Astronomical Algorithms</i>, ch.
 * 47), so the parallax, nearly a degree for someone on the ground, comes out
 * right. Orekit 13 has no analytical Moon (14.0 adds one) and JPL ephemerides
 * are tens of megabytes; this is enough for moonrise and moonset to the minute.
 */
public final class AnalyticalMoon {

    private static final double ARCSECONDS = 3600 * 180 / FastMath.PI;
    private static final double OBLIQUITY = FastMath.toRadians(23.43929111);

    /** Mean equator and equinox of date, the frame the series is referred to. */
    private final Frame meanOfDate;

    public AnalyticalMoon(Frame meanOfDate) {
        this.meanOfDate = meanOfDate;
    }

    /** Geocentric position, metres, in {@code frame}. */
    public Vector3D position(AbsoluteDate date, Frame frame) {
        return meanOfDate.getStaticTransformTo(frame, date).transformPosition(meanOfDatePosition(date));
    }

    static Vector3D meanOfDatePosition(AbsoluteDate date) {
        double t = date.durationFrom(AbsoluteDate.J2000_EPOCH) / Constants.JULIAN_CENTURY;

        double meanLongitude = frac(0.606433 + 1336.855225 * t);
        double l = 2 * FastMath.PI * frac(0.374897 + 1325.552410 * t); // Moon's mean anomaly
        double ls = 2 * FastMath.PI * frac(0.993133 + 99.997361 * t); // Sun's mean anomaly
        double d = 2 * FastMath.PI * frac(0.827361 + 1236.853086 * t); // elongation from the Sun
        double f = 2 * FastMath.PI * frac(0.259086 + 1342.227825 * t); // from the ascending node

        double dl = 22640 * FastMath.sin(l)
                - 4586 * FastMath.sin(l - 2 * d)
                + 2370 * FastMath.sin(2 * d)
                + 769 * FastMath.sin(2 * l)
                - 668 * FastMath.sin(ls)
                - 412 * FastMath.sin(2 * f)
                - 212 * FastMath.sin(2 * l - 2 * d)
                - 206 * FastMath.sin(l + ls - 2 * d)
                + 192 * FastMath.sin(l + 2 * d)
                - 165 * FastMath.sin(ls - 2 * d)
                - 125 * FastMath.sin(d)
                - 110 * FastMath.sin(l + ls)
                + 148 * FastMath.sin(l - ls)
                - 55 * FastMath.sin(2 * f - 2 * d);
        double s = f + (dl + 412 * FastMath.sin(2 * f) + 541 * FastMath.sin(ls)) / ARCSECONDS;
        double h = f - 2 * d;
        double n = -526 * FastMath.sin(h)
                + 44 * FastMath.sin(l + h)
                - 31 * FastMath.sin(-l + h)
                - 23 * FastMath.sin(ls + h)
                + 11 * FastMath.sin(-ls + h)
                - 25 * FastMath.sin(-2 * l + f)
                + 21 * FastMath.sin(-l + f);

        double longitude = 2 * FastMath.PI * frac(meanLongitude + dl / 1_296_000);
        double latitude = (18520 * FastMath.sin(s) + n) / ARCSECONDS;
        double distanceKm = 385_000.56
                - 20_905.355 * FastMath.cos(l)
                - 3_699.111 * FastMath.cos(2 * d - l)
                - 2_955.968 * FastMath.cos(2 * d)
                - 569.925 * FastMath.cos(2 * l)
                + 246.158 * FastMath.cos(2 * d - 2 * l)
                - 204.586 * FastMath.cos(2 * d - ls)
                - 170.733 * FastMath.cos(2 * d + l)
                - 152.138 * FastMath.cos(2 * d - ls - l);

        double r = distanceKm * 1000;
        double x = r * FastMath.cos(latitude) * FastMath.cos(longitude);
        double y = r * FastMath.cos(latitude) * FastMath.sin(longitude);
        double z = r * FastMath.sin(latitude);
        // Ecliptic to equatorial: a rotation by the obliquity about the x axis.
        return new Vector3D(
                x,
                y * FastMath.cos(OBLIQUITY) - z * FastMath.sin(OBLIQUITY),
                y * FastMath.sin(OBLIQUITY) + z * FastMath.cos(OBLIQUITY));
    }

    private static double frac(double x) {
        return x - FastMath.floor(x);
    }
}
