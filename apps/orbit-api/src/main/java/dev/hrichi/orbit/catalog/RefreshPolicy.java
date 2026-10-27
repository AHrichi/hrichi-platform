package dev.hrichi.orbit.catalog;

import java.time.Duration;
import java.time.Instant;

/**
 * When to ask CelesTrak for new data. CelesTrak allows one download per
 * data update (about every two hours), answers a repeat with 403, and
 * firewalls an address after 50 errors in two hours. Render's free outbound
 * addresses are shared, so the API waits a full window after any attempt,
 * successful or not, and never retries inside it.
 *
 * @param refreshAfter  how old CelesTrak data may get before a new download
 * @param minAttemptGap the minimum time between two attempts
 */
public record RefreshPolicy(Duration refreshAfter, Duration minAttemptGap) {

    public boolean shouldFetch(CatalogInfo info, Instant now) {
        if (info.lastAttemptAt() != null
                && Duration.between(info.lastAttemptAt(), now).compareTo(minAttemptGap) < 0) {
            return false;
        }
        return !CatalogInfo.CELESTRAK.equals(info.source())
                || info.fetchedAt() == null
                || Duration.between(info.fetchedAt(), now).compareTo(refreshAfter) >= 0;
    }
}
