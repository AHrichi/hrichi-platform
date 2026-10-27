package dev.hrichi.orbit.web;

import dev.hrichi.orbit.catalog.OrbitClass;
import dev.hrichi.orbit.catalog.OrbitShape;
import dev.hrichi.orbit.catalog.OrbitalElements;
import dev.hrichi.orbit.catalog.SatelliteGroup;

public record SatelliteDetails(
        int noradId,
        String name,
        String objectId,
        SatelliteGroup group,
        OrbitClass orbitClass,
        String epoch,
        double inclinationDeg,
        double eccentricity,
        double periodMinutes,
        double apogeeKm,
        double perigeeKm,
        OrbitalElements elements) {

    static SatelliteDetails of(OrbitalElements e, SatelliteGroup group, OrbitShape shape) {
        return new SatelliteDetails(
                e.noradCatId(),
                e.objectName(),
                e.objectId(),
                group,
                shape.orbitClass(),
                e.epoch(),
                e.inclination(),
                e.eccentricity(),
                round(shape.periodMinutes()),
                round(shape.apogeeKm()),
                round(shape.perigeeKm()),
                e);
    }

    private static double round(double value) {
        return Math.round(value * 10) / 10.0;
    }
}
