package dev.hrichi.orbit.web;

import static org.assertj.core.api.Assertions.assertThat;

import dev.hrichi.orbit.config.OrbitConfig;
import dev.hrichi.orbit.night.MeteorShowers;
import dev.hrichi.orbit.night.NightPlanner;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@WebMvcTest(controllers = NightController.class, properties = "orbit.cors-origins=https://portfolio.example")
@Import({OrbitConfig.class, NightPlanner.class, MeteorShowers.class, NightControllerTest.FixedClock.class})
class NightControllerTest {

    @TestConfiguration
    static class FixedClock {
        /** An August evening in Tunis, instead of the system clock. */
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(Instant.parse("2026-08-12T18:00:00Z"), ZoneOffset.UTC);
        }
    }

    @Autowired
    MockMvcTester mvc;

    @Test
    void plansTheComingNightsAtRoundedCoordinates() {
        var result = mvc.get().uri("/nights?lat=36.8065&lon=10.1815&days=2&zone=Africa/Tunis");

        assertThat(result).hasStatusOk().hasHeader(HttpHeaders.CACHE_CONTROL, "max-age=3600, public");
        assertThat(result).bodyJson().extractingPath("$.latitude").isEqualTo(36.8);
        assertThat(result).bodyJson().extractingPath("$.longitude").isEqualTo(10.2);
        assertThat(result).bodyJson().extractingPath("$.nights[0].date").isEqualTo("2026-08-12");
        assertThat(result).bodyJson().extractingPath("$.nights.length()").isEqualTo(2);
        assertThat(result).bodyJson().extractingPath("$.nights[0].showers[0].name").isEqualTo("Perseids");
    }

    @Test
    void rejectsALatitudeOutOfRangeAsAProblem() {
        assertThat(mvc.get().uri("/nights?lat=95&lon=10"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson()
                .extractingPath("$.errors[0].parameter")
                .isEqualTo("lat");
    }

    @Test
    void rejectsAnUnknownTimeZone() {
        assertThat(mvc.get().uri("/nights?lat=36.8&lon=10.2&zone=Mars/Olympus"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.errors[0].parameter")
                .isEqualTo("zone");
    }

    @Test
    void allowsTheConfiguredOriginOnly() {
        assertThat(mvc.get()
                        .uri("/nights?lat=36.8&lon=10.2&days=1")
                        .header(HttpHeaders.ORIGIN, "https://portfolio.example"))
                .hasHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://portfolio.example");
        assertThat(mvc.get()
                        .uri("/nights?lat=36.8&lon=10.2&days=1")
                        .header(HttpHeaders.ORIGIN, "https://elsewhere.example"))
                .hasStatus(HttpStatus.FORBIDDEN);
    }
}
