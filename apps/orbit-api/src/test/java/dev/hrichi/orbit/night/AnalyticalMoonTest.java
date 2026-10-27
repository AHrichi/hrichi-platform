package dev.hrichi.orbit.night;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Date;
import org.hipparchus.geometry.euclidean.threed.Vector3D;
import org.hipparchus.util.FastMath;
import org.junit.jupiter.api.Test;
import org.orekit.frames.FramesFactory;
import org.orekit.time.AbsoluteDate;
import org.orekit.time.TimeScalesFactory;
import org.orekit.utils.IERSConventions;

class AnalyticalMoonTest {

    static {
        TimeScalesFactory.clearUTCTAIOffsetsLoaders();
        TimeScalesFactory.addUTCTAIOffsetsLoader(new LeapSeconds());
    }

    private final AnalyticalMoon moon = new AnalyticalMoon(FramesFactory.getMOD(IERSConventions.IERS_2010));

    @Test
    void agreesWithAstronomyEngineThroughoutTheYear() {
        double worstAngle = 0;
        double worstDistance = 0;
        for (Fixtures.MoonPosition expected : Fixtures.load().moon()) {
            AbsoluteDate date =
                    new AbsoluteDate(Date.from(Instant.parse(expected.time())), TimeScalesFactory.getUTC());
            Vector3D ours = moon.position(date, FramesFactory.getEME2000());
            Vector3D theirs = new Vector3D(expected.x(), expected.y(), expected.z()).scalarMultiply(1000);

            worstAngle = Math.max(worstAngle, FastMath.toDegrees(Vector3D.angle(ours, theirs)));
            worstDistance = Math.max(worstDistance, Math.abs(ours.getNorm() / theirs.getNorm() - 1));
        }
        assertThat(worstAngle).isLessThan(0.1);
        assertThat(worstDistance).isLessThan(0.005);
    }
}
