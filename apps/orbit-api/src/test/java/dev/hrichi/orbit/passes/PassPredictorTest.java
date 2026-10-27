package dev.hrichi.orbit.passes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import dev.hrichi.orbit.TestData;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.junit.jupiter.api.Test;

class PassPredictorTest {

    private static final Observer TUNIS = new Observer(36.8065, 10.1815, 10);
    private static final Instant FROM = Instant.parse("2026-10-26T15:18:00Z");

    /**
     * Independent reference: the same elements and observer propagated with
     * satellite.js 7.1 (Vallado's SGP4 in JavaScript), stepping one second at
     * a time. Rise, culmination time and elevation, set.
     */
    private static final String[][] SATELLITE_JS = {
        {"2026-10-26T23:45:04Z", "2026-10-26T23:48:25Z", "79.39", "2026-10-26T23:51:48Z"},
        {"2026-10-27T01:23:27Z", "2026-10-27T01:25:35Z", "15.60", "2026-10-27T01:27:44Z"},
        {"2026-10-27T06:16:17Z", "2026-10-27T06:19:28Z", "36.46", "2026-10-27T06:22:39Z"},
        {"2026-10-27T07:53:31Z", "2026-10-27T07:56:05Z", "20.23", "2026-10-27T07:58:40Z"},
        {"2026-10-27T22:57:48Z", "2026-10-27T23:00:57Z", "40.93", "2026-10-27T23:04:10Z"},
        {"2026-10-28T00:35:11Z", "2026-10-28T00:37:53Z", "21.79", "2026-10-28T00:40:36Z"},
        {"2026-10-28T05:29:00Z", "2026-10-28T05:31:50Z", "23.75", "2026-10-28T05:34:39Z"},
        {"2026-10-28T07:05:33Z", "2026-10-28T07:08:42Z", "36.17", "2026-10-28T07:11:51Z"},
        {"2026-10-28T22:10:53Z", "2026-10-28T22:13:33Z", "22.47", "2026-10-28T22:16:16Z"},
        {"2026-10-28T23:47:09Z", "2026-10-28T23:50:13Z", "32.77", "2026-10-28T23:53:20Z"},
        {"2026-10-29T04:41:50Z", "2026-10-29T04:44:07Z", "16.77", "2026-10-29T04:46:26Z"},
        {"2026-10-29T06:17:52Z", "2026-10-29T06:21:14Z", "69.57", "2026-10-29T06:24:37Z"},
    };

    private final PassPredictor predictor = new PassPredictor();

    @Test
    void agreesWithSatelliteJsOnEveryIssPassOverTunis() {
        List<Pass> passes = predictor.predict(TestData.ISS, TUNIS, FROM, Duration.ofDays(3), 10);

        assertThat(passes).hasSize(SATELLITE_JS.length);
        for (int i = 0; i < passes.size(); i++) {
            Pass pass = passes.get(i);
            String[] expected = SATELLITE_JS[i];
            assertSeconds(pass.rise().time(), expected[0], 5);
            assertSeconds(pass.culmination().time(), expected[1], 15);
            assertThat(pass.culmination().elevationDeg()).isCloseTo(Double.parseDouble(expected[2]), within(0.3));
            assertSeconds(pass.set().time(), expected[3], 5);
            assertThat(pass.rise().elevationDeg()).isCloseTo(10, within(0.1));
        }
    }

    @Test
    void flagsOnlyPassesInADarkSkyAsVisible() {
        List<Pass> passes = predictor.predict(TestData.ISS, TUNIS, FROM, Duration.ofDays(3), 10);

        // 07:53 UTC is mid-morning in Tunis: the sky is bright.
        assertThat(passes.get(3).visible()).isFalse();
        // 04:41 UTC on the 29th is before dawn, with the ISS already in sunlight.
        assertThat(passes.get(10).visible()).isTrue();
    }

    @Test
    void skipsAPassAlreadyUnderwayAndHonoursTheMinimumElevation() {
        Instant duringFirstPass = Instant.parse("2026-10-26T23:48:00Z");

        List<Pass> passes = predictor.predict(TestData.ISS, TUNIS, duringFirstPass, Duration.ofDays(1), 30);

        assertThat(passes).allSatisfy(pass -> {
            assertThat(pass.rise().time()).isAfter(duringFirstPass);
            assertThat(pass.culmination().elevationDeg()).isGreaterThanOrEqualTo(30);
        });
    }

    @Test
    void aSatelliteBehindTheEarthIsInShadow() {
        Vector3D sun = new Vector3D(1.5e11, 0, 0);

        assertThat(PassPredictor.sunlit(new Vector3D(7e6, 0, 0), sun)).isTrue();
        assertThat(PassPredictor.sunlit(new Vector3D(-7e6, 0, 0), sun)).isFalse();
        assertThat(PassPredictor.sunlit(new Vector3D(-7e6, 7e6, 0), sun)).isTrue();
    }

    private static void assertSeconds(Instant actual, String expected, long toleranceSeconds) {
        long difference = Math.abs(Duration.between(Instant.parse(expected), actual).toSeconds());
        assertThat(difference)
                .as("%s vs satellite.js %s", actual, expected)
                .isLessThanOrEqualTo(toleranceSeconds);
    }
}
