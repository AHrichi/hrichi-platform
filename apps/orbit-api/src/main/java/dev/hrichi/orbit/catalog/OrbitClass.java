package dev.hrichi.orbit.catalog;

/** Where an orbit sits, by altitude, period and eccentricity. */
public enum OrbitClass {
    /** Low Earth orbit: apogee below 2,000 km (the ISS, Starlink). */
    LEO,
    /** Medium Earth orbit (GPS, Galileo). */
    MEO,
    /** Geosynchronous: period of about one sidereal day. */
    GEO,
    /** Highly elliptical: eccentricity above 0.25 (Molniya). */
    HEO
}
