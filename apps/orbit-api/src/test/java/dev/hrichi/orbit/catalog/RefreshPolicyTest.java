package dev.hrichi.orbit.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class RefreshPolicyTest {

    private static final Instant NOW = Instant.parse("2026-10-27T12:00:00Z");
    private final RefreshPolicy policy = new RefreshPolicy(Duration.ofHours(6), Duration.ofHours(2));

    private static CatalogInfo celestrak(Duration age, Duration sinceAttempt) {
        return new CatalogInfo(CatalogInfo.CELESTRAK, NOW.minus(age), NOW.minus(sinceAttempt), "ok", 11_000);
    }

    @Test
    void downloadsOnFirstBoot() {
        assertThat(policy.shouldFetch(CatalogInfo.empty(), NOW)).isTrue();
    }

    @Test
    void keepsFreshDataAndDownloadsStaleData() {
        assertThat(policy.shouldFetch(celestrak(Duration.ofHours(5), Duration.ofHours(5)), NOW)).isFalse();
        assertThat(policy.shouldFetch(celestrak(Duration.ofHours(6), Duration.ofHours(6)), NOW)).isTrue();
    }

    @Test
    void neverAsksTwiceInsideTheWindowEvenAfterAFailure() {
        CatalogInfo refused = celestrak(Duration.ofHours(30), Duration.ofMinutes(119)).withAttempt(
                NOW.minus(Duration.ofMinutes(119)), "HTTP 403");

        assertThat(policy.shouldFetch(refused, NOW)).isFalse();
        assertThat(policy.shouldFetch(refused, NOW.plus(Duration.ofMinutes(1)))).isTrue();
    }

    @Test
    void replacesTheSnapshotOnceTheWindowHasPassed() {
        CatalogInfo snapshot = new CatalogInfo(
                CatalogInfo.SNAPSHOT, NOW, NOW.minus(Duration.ofHours(3)), "HTTP 403", 155);

        assertThat(policy.shouldFetch(snapshot, NOW)).isTrue();
    }
}
