package dev.hrichi.orbit.night;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.offset;
import static org.assertj.core.api.Assertions.within;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.function.Function;
import org.junit.jupiter.api.Test;

class NightPlannerTest {

    private static final Duration TOLERANCE = Duration.ofMinutes(2);

    private final NightPlanner planner = new NightPlanner(new MeteorShowers());

    private Night plan(Fixtures.Place place) {
        return planner
                .plan(place.lat(), place.lon(), LocalDate.parse(place.date()), 1, ZoneId.of(place.zone()))
                .getFirst();
    }

    private record Check(String name, Function<Night, Instant> actual, String expected) {}

    @Test
    void timesEveryEventLikeAstronomyEngine() {
        for (Fixtures.Place place : Fixtures.load().nights()) {
            Night night = plan(place);
            List<Check> checks = List.of(
                    new Check("sunset", Night::sunset, place.sunset()),
                    new Check("civil dusk", Night::civilDusk, place.civilDusk()),
                    new Check("nautical dusk", Night::nauticalDusk, place.nauticalDusk()),
                    new Check("astronomical dusk", Night::astronomicalDusk, place.astronomicalDusk()),
                    new Check("astronomical dawn", Night::astronomicalDawn, place.astronomicalDawn()),
                    new Check("nautical dawn", Night::nauticalDawn, place.nauticalDawn()),
                    new Check("civil dawn", Night::civilDawn, place.civilDawn()),
                    new Check("sunrise", Night::sunrise, place.sunrise()),
                    new Check("moonrise", Night::moonrise, place.moonrise()),
                    new Check("moonset", Night::moonset, place.moonset()));
            for (Check check : checks) {
                Instant ours = check.actual().apply(night);
                String description = place.name() + " " + check.name();
                if (check.expected() == null) {
                    assertThat(ours).as(description).isNull();
                } else {
                    assertThat(ours).as(description).isNotNull();
                    Duration error = Duration.between(Instant.parse(check.expected()), ours).abs();
                    assertThat(error).as(description).isLessThan(TOLERANCE);
                }
            }
            assertThat(night.moonIllumination())
                    .as(place.name() + " Moon")
                    .isCloseTo(place.moonIllumination(), offset(0.01));
        }
    }

    @Test
    void findsAMoonlessPerseidsNightInTunis() {
        Night night = plan(Fixtures.load().nights().getFirst());

        // New Moon, set with the Sun: dark from astronomical dusk to dawn.
        assertThat(night.darkWindows()).hasSize(1);
        assertThat(Duration.between(night.astronomicalDusk(), night.astronomicalDawn()).toMinutes())
                .isCloseTo(night.darkMinutes(), within(1L));
        assertThat(night.showers().getFirst().name()).isEqualTo("Perseids");
        assertThat(night.score()).isEqualTo(100);
    }

    @Test
    void hasNoDarkWindowInAReykjavikJune() {
        Night night = plan(Fixtures.load().nights().get(2));

        assertThat(night.darkWindows()).isEmpty();
        assertThat(night.score()).isZero();
    }

    @Test
    void plansConsecutiveNights() {
        List<Night> nights = planner.plan(36.8, 10.2, LocalDate.parse("2026-08-10"), 5, ZoneId.of("Africa/Tunis"));

        assertThat(nights)
                .extracting(Night::date)
                .containsExactly(
                        LocalDate.parse("2026-08-10"),
                        LocalDate.parse("2026-08-11"),
                        LocalDate.parse("2026-08-12"),
                        LocalDate.parse("2026-08-13"),
                        LocalDate.parse("2026-08-14"));
        for (Night night : nights) {
            for (Night.DarkWindow window : night.darkWindows()) {
                assertThat(window.start()).isBefore(window.end());
                assertThat(window.start()).isAfterOrEqualTo(night.astronomicalDusk());
            }
        }
    }
}
