package dev.hrichi.orbit.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import dev.hrichi.orbit.TestData;
import org.junit.jupiter.api.Test;

class OrbitShapeTest {

    @Test
    void theIssIsInLowEarthOrbitAboutFourHundredKilometresUp() {
        OrbitShape shape = OrbitShape.of(TestData.ISS);

        assertThat(shape.orbitClass()).isEqualTo(OrbitClass.LEO);
        assertThat(shape.periodMinutes()).isCloseTo(92.96, within(0.01));
        assertThat(shape.perigeeKm()).isBetween(400.0, 420.0);
        assertThat(shape.apogeeKm()).isBetween(410.0, 430.0);
        assertThat(shape.apogeeKm()).isGreaterThan(shape.perigeeKm());
    }

    @Test
    void classifiesGeostationaryNavigationAndMolniyaOrbits() {
        assertThat(OrbitShape.of(TestData.GEO).orbitClass()).isEqualTo(OrbitClass.GEO);
        assertThat(OrbitShape.of(TestData.GEO).semiMajorAxisKm()).isCloseTo(42_164, within(5.0));
        assertThat(OrbitShape.of(TestData.GPS).orbitClass()).isEqualTo(OrbitClass.MEO);
        assertThat(OrbitShape.of(TestData.MOLNIYA).orbitClass()).isEqualTo(OrbitClass.HEO);
    }
}
