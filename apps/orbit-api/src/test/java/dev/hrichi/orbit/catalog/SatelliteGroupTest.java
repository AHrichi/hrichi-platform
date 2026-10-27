package dev.hrichi.orbit.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import dev.hrichi.orbit.TestData;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class SatelliteGroupTest {

    @ParameterizedTest
    @CsvSource({
        "ISS (ZARYA),        15.49, STATIONS",
        "CSS (TIANHE),       15.60, STATIONS",
        "STARLINK-1007,      15.06, STARLINK",
        "GPS BIIF-1  (PRN 25), 2.0056, GNSS",
        "GSAT0101 (GALILEO-PFM), 1.7047, GNSS",
        "COSMOS 2425 (716),  2.1308, GNSS",
        "COSMOS 2551,       15.30, OTHER",
        "NOAA 19,           14.13, WEATHER",
        "METOP-C,           14.21, WEATHER",
        "HUBBLE SPACE TELESCOPE, 15.29, OTHER",
    })
    void groupsSatellitesByNameAndOrbit(String name, double meanMotion, SatelliteGroup expected) {
        OrbitalElements elements = TestData.elements(name, "2000-001A", meanMotion, 0.001, 55, 1);

        assertThat(SatelliteGroup.classify(elements, OrbitShape.of(elements).orbitClass()))
                .isEqualTo(expected);
    }
}
