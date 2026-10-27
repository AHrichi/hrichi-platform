package dev.hrichi.orbit.catalog;

import java.time.Clock;
import java.time.Duration;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * {@code /actuator/health} → {@code components.catalog} (named after the
 * bean, minus "HealthIndicator"): where the data came
 * from and how old it is. Always UP while there is data to serve; staleness
 * is reported, not treated as an outage.
 */
@Component
public class CatalogHealthIndicator implements HealthIndicator {

    private final Catalog catalog;
    private final Clock clock;

    public CatalogHealthIndicator(Catalog catalog, Clock clock) {
        this.catalog = catalog;
        this.clock = clock;
    }

    @Override
    public Health health() {
        CatalogInfo info = catalog.info();
        Health.Builder health = catalog.isEmpty() ? Health.down() : Health.up();
        health.withDetail("source", info.source())
                .withDetail("satellites", info.count())
                .withDetail("indexed", catalog.indexed());
        if (info.fetchedAt() != null) {
            Duration age = Duration.between(info.fetchedAt(), clock.instant());
            health.withDetail("fetchedAt", info.fetchedAt().toString())
                    .withDetail("ageHours", Math.round(age.toMinutes() / 6.0) / 10.0)
                    .withDetail("fresh", CatalogInfo.CELESTRAK.equals(info.source()) && age.toHours() < 24);
        }
        if (info.lastAttemptAt() != null) {
            health.withDetail("lastAttemptAt", info.lastAttemptAt().toString())
                    .withDetail("lastOutcome", info.lastOutcome());
        }
        return health.build();
    }
}
