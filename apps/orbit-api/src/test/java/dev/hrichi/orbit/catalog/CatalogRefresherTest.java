package dev.hrichi.orbit.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import dev.hrichi.orbit.TestData;
import dev.hrichi.orbit.config.OrbitProperties;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class CatalogRefresherTest {

    private static final Instant T0 = Instant.parse("2026-10-27T08:00:00Z");

    /** A clock the test moves by hand. */
    static final class TestClock extends Clock {
        Instant now = T0;

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }
    }

    static final class MemoryStore implements CatalogStore {
        CatalogInfo info;
        byte[] gzip;

        @Override
        public Optional<Stored> load() {
            return Optional.ofNullable(info).map(i -> new Stored(i, gzip));
        }

        @Override
        public void saveCatalog(CatalogInfo info, byte[] gzip) {
            this.info = info;
            this.gzip = gzip;
        }

        @Override
        public void saveInfo(CatalogInfo info) {
            this.info = info;
        }
    }

    /** Answers from a script and counts requests, like CelesTrak would see them. */
    static final class ScriptedSource implements OrbitDataSource {
        final Deque<Result> answers = new ArrayDeque<>();
        int requests;

        @Override
        public Result fetch() {
            requests++;
            return answers.isEmpty() ? new Failed("no answer scripted") : answers.pop();
        }
    }

    private final TestClock clock = new TestClock();
    private final MemoryStore store = new MemoryStore();
    private final ScriptedSource celestrak = new ScriptedSource();
    private final JsonMapper json = JsonMapper.builder().build();
    private final Catalog catalog = new Catalog(json);
    private final CatalogRefresher refresher = new CatalogRefresher(
            catalog,
            store,
            celestrak,
            new BundledSnapshot(json),
            new OrbitProperties(URI.create("https://example.test"), Duration.ofHours(6), Duration.ofHours(2), true, List.of()),
            clock,
            Runnable::run);

    @Test
    void downloadsOnFirstBootAndPersistsTheCatalog() {
        celestrak.answers.add(new OrbitDataSource.Fetched(List.of(TestData.ISS, TestData.GPS)));

        refresher.start();

        assertThat(catalog.find(25544)).isPresent();
        assertThat(catalog.info().source()).isEqualTo(CatalogInfo.CELESTRAK);
        assertThat(store.gzip).isNotEmpty();
        assertThat(store.info.fetchedAt()).isEqualTo(T0);
        assertThat(store.info.count()).isEqualTo(2);
    }

    @Test
    void restoresTheStoredResponseAfterARestartWithoutAskingAgain() {
        celestrak.answers.add(new OrbitDataSource.Fetched(List.of(TestData.ISS, TestData.GPS)));
        refresher.start();
        String etag = catalog.payload("all").orElseThrow().etag();

        clock.now = T0.plus(Duration.ofHours(1));
        Catalog restored = new Catalog(json);
        new CatalogRefresher(
                        restored,
                        store,
                        celestrak,
                        new BundledSnapshot(json),
                        new OrbitProperties(
                                URI.create("https://example.test"), Duration.ofHours(6), Duration.ofHours(2), true, List.of()),
                        clock,
                        Runnable::run)
                .start();

        assertThat(celestrak.requests).isEqualTo(1);
        assertThat(restored.find(TestData.GPS.noradCatId())).contains(TestData.GPS);
        assertThat(restored.info().source()).isEqualTo(CatalogInfo.CELESTRAK);
        assertThat(restored.payload("all").orElseThrow().etag()).isEqualTo(etag);
        assertThat(restored.payload("stations").orElseThrow().gzip()).isNotEmpty();
    }

    @Test
    void servesTheBundledSnapshotWhenCelestrakRefusesAnEmptyDatabase() {
        celestrak.answers.add(new OrbitDataSource.Refused(403));

        refresher.start();

        assertThat(catalog.info().source()).isEqualTo(CatalogInfo.SNAPSHOT);
        assertThat(catalog.find(25544)).as("the snapshot has the ISS").isPresent();
        assertThat(store.info.lastOutcome()).isEqualTo("HTTP 403");
    }

    @Test
    void neverRetriesInsideTheWindowAcrossRestarts() {
        celestrak.answers.add(new OrbitDataSource.Refused(403));
        refresher.start();

        // A restart an hour later (Render wakes the instance) must not ask again.
        clock.now = T0.plus(Duration.ofHours(1));
        CatalogRefresher restarted = new CatalogRefresher(
                new Catalog(json),
                store,
                celestrak,
                new BundledSnapshot(json),
                new OrbitProperties(
                        URI.create("https://example.test"), Duration.ofHours(6), Duration.ofHours(2), true, List.of()),
                clock,
                Runnable::run);
        restarted.start();
        restarted.refreshIfDue();

        assertThat(celestrak.requests).isEqualTo(1);

        clock.now = T0.plus(Duration.ofHours(2));
        restarted.refreshIfDue();
        assertThat(celestrak.requests).isEqualTo(2);
    }

    @Test
    void keepsServingTheLastGoodCatalogWhenARefreshFails() {
        celestrak.answers.add(new OrbitDataSource.Fetched(List.of(TestData.ISS)));
        refresher.start();

        clock.now = T0.plus(Duration.ofHours(7));
        celestrak.answers.add(new OrbitDataSource.Failed("timeout"));
        refresher.refreshIfDue();

        assertThat(catalog.find(25544)).isPresent();
        assertThat(catalog.info().fetchedAt()).isEqualTo(T0);
        assertThat(catalog.info().lastOutcome()).isEqualTo("timeout");
    }
}
