package dev.hrichi.orbit.night;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.offset;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class MeteorShowersTest {

    private final MeteorShowers showers = new MeteorShowers();

    private MeteorShowers.Shower shower(String id) {
        return showers.all().stream().filter(s -> s.id().equals(id)).findFirst().orElseThrow();
    }

    /** The API's copy and the Sky lab's table must be the same file. */
    @Test
    void matchesTheSkyLabTable() throws IOException {
        String lab = Files.readString(Path.of("../../libs/labs/sky/domain/src/lib/meteor-showers.json"));
        try (InputStream api = MeteorShowers.class.getResourceAsStream("/meteor-showers.json")) {
            assertThat(api).isNotNull();
            assertThat(new String(api.readAllBytes(), StandardCharsets.UTF_8)).isEqualTo(lab);
        }
    }

    @Test
    void peaksOnThePeakNightAndIsZeroOutOfSeason() {
        MeteorShowers.Shower perseids = shower("PER");
        assertThat(MeteorShowers.rate(perseids, Instant.parse("2026-08-12T12:00:00Z")))
                .isCloseTo(100, offset(0.5));
        assertThat(MeteorShowers.rate(perseids, Instant.parse("2026-03-01T00:00:00Z")))
                .isZero();
    }

    @Test
    void handlesAShowerThatSpansNewYear() {
        MeteorShowers.Shower quadrantids = shower("QUA");
        assertThat(MeteorShowers.rate(quadrantids, Instant.parse("2027-01-04T00:00:00Z")))
                .isGreaterThan(50);
        assertThat(MeteorShowers.rate(quadrantids, Instant.parse("2026-12-30T00:00:00Z")))
                .isPositive();
        assertThat(showers.active(Instant.parse("2026-12-14T00:00:00Z")).getFirst().name())
                .isEqualTo("Geminids");
    }
}
