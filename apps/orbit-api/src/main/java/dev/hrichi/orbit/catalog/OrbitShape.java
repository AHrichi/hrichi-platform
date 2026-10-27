package dev.hrichi.orbit.catalog;

/**
 * Size and period of an orbit, derived from its mean motion and
 * eccentricity alone (two-body approximation, good to a few kilometres).
 */
public record OrbitShape(
        double semiMajorAxisKm, double apogeeKm, double perigeeKm, double periodMinutes, OrbitClass orbitClass) {

    /** WGS-84 equatorial radius. */
    static final double EARTH_RADIUS_KM = 6378.137;
    /** Earth's gravitational parameter, km³/s². */
    static final double MU_KM3_S2 = 398600.4418;

    public static OrbitShape of(OrbitalElements elements) {
        double radiansPerSecond = elements.meanMotion() * 2 * Math.PI / 86_400;
        double a = Math.cbrt(MU_KM3_S2 / (radiansPerSecond * radiansPerSecond));
        double e = elements.eccentricity();
        double apogee = a * (1 + e) - EARTH_RADIUS_KM;
        double perigee = a * (1 - e) - EARTH_RADIUS_KM;
        double period = 1440 / elements.meanMotion();
        return new OrbitShape(a, apogee, perigee, period, classify(e, apogee, period));
    }

    private static OrbitClass classify(double eccentricity, double apogeeKm, double periodMinutes) {
        if (eccentricity > 0.25) {
            return OrbitClass.HEO;
        }
        if (apogeeKm < 2_000) {
            return OrbitClass.LEO;
        }
        // Geosynchronous: one sidereal day, give or take a drifting satellite.
        if (periodMinutes > 1_380 && periodMinutes < 1_500) {
            return OrbitClass.GEO;
        }
        return OrbitClass.MEO;
    }
}
