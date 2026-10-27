package dev.hrichi.orbit.catalog;

import java.time.Instant;

/**
 * Where the current catalog came from, and when the API last tried
 * CelesTrak. Persisted, so a restart never causes an early download.
 *
 * @param source        {@code celestrak} or {@code snapshot}
 * @param fetchedAt     when the data in use was downloaded
 * @param lastAttemptAt when CelesTrak was last asked, successfully or not
 * @param lastOutcome   {@code ok}, an HTTP status or a network error
 */
public record CatalogInfo(String source, Instant fetchedAt, Instant lastAttemptAt, String lastOutcome, int count) {

    public static final String CELESTRAK = "celestrak";
    public static final String SNAPSHOT = "snapshot";

    public static CatalogInfo empty() {
        return new CatalogInfo(SNAPSHOT, null, null, null, 0);
    }

    public CatalogInfo withAttempt(Instant at, String outcome) {
        return new CatalogInfo(source, fetchedAt, at, outcome, count);
    }
}
