package dev.hrichi.orbit;

import dev.hrichi.orbit.catalog.OrbitalElements;

/** Fixed elements, so tests never depend on today's catalog. */
public final class TestData {

    /** CelesTrak's ISS (ZARYA) elements of 2026-10-26 14:18 UTC. */
    public static final OrbitalElements ISS = new OrbitalElements(
            "ISS (ZARYA)",
            "1998-067A",
            "2026-10-26T14:18:26.812224",
            15.49065369,
            0.00069323,
            51.6336,
            9.8132,
            312.5452,
            47.4951,
            0,
            "U",
            25544,
            999,
            59212,
            0.00011932835,
            0.00006146,
            0);

    /** A geostationary satellite. */
    public static final OrbitalElements GEO = elements("EUTELSAT 7C", "2019-034B", 1.00271, 0.0002, 0.05, 44333);

    /** A GPS satellite: two revolutions a day. */
    public static final OrbitalElements GPS = elements("GPS BIIF-1  (PRN 25)", "2010-022A", 2.00562, 0.011, 54.9, 36585);

    /** A Molniya orbit: twelve hours, very eccentric. */
    public static final OrbitalElements MOLNIYA = elements("MOLNIYA 1-93", "2004-005A", 2.0068, 0.72, 62.8, 28163);

    public static OrbitalElements elements(
            String name, String objectId, double meanMotion, double eccentricity, double inclination, int noradId) {
        return new OrbitalElements(
                name,
                objectId,
                "2026-10-26T12:00:00.000000",
                meanMotion,
                eccentricity,
                inclination,
                0,
                0,
                0,
                0,
                "U",
                noradId,
                999,
                1000,
                0,
                0,
                0);
    }

    private TestData() {}
}
