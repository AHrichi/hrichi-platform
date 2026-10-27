package dev.hrichi.orbit.catalog;

import dev.hrichi.orbit.config.OrbitProperties;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.Executor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Keeps the catalog current without ever hammering CelesTrak (ADR-0013).
 * On boot it serves what the database has, or the bundled snapshot when the
 * database is empty, and checks in the background whether a download is due
 * (a download and save takes tens of seconds); then it checks every 30 minutes.
 */
@Service
public class CatalogRefresher implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CatalogRefresher.class);

    private final Catalog catalog;
    private final CatalogStore store;
    private final OrbitDataSource source;
    private final BundledSnapshot snapshot;
    private final RefreshPolicy policy;
    private final OrbitProperties properties;
    private final Clock clock;
    private final Executor background;

    @Autowired
    public CatalogRefresher(
            Catalog catalog,
            CatalogStore store,
            OrbitDataSource source,
            BundledSnapshot snapshot,
            OrbitProperties properties,
            Clock clock) {
        this(catalog, store, source, snapshot, properties, clock,
                task -> Thread.ofVirtual().name("catalog-refresh").start(task));
    }

    /** Tests pass {@code Runnable::run} to refresh synchronously. */
    CatalogRefresher(
            Catalog catalog,
            CatalogStore store,
            OrbitDataSource source,
            BundledSnapshot snapshot,
            OrbitProperties properties,
            Clock clock,
            Executor background) {
        this.background = background;
        this.catalog = catalog;
        this.store = store;
        this.source = source;
        this.snapshot = snapshot;
        this.properties = properties;
        this.policy = new RefreshPolicy(properties.refreshAfter(), properties.minAttemptGap());
        this.clock = clock;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (properties.loadOnStartup()) {
            start();
        }
    }

    void start() {
        try {
            store.load().ifPresent(stored -> {
                if (stored.gzip() == null) {
                    catalog.updateInfo(stored.info());
                } else {
                    catalog.restore(stored.info(), stored.gzip());
                    log.info("Serving {} stored satellites ({})", stored.info().count(), stored.info().source());
                }
            });
        } catch (DataAccessException e) {
            log.warn("Database unavailable, starting without stored data: {}", e.getMessage());
        }
        if (catalog.isEmpty()) {
            BundledSnapshot.File file = snapshot.load();
            CatalogInfo info = catalog.info();
            catalog.replace(
                    file.satellites(),
                    new CatalogInfo(
                            CatalogInfo.SNAPSHOT,
                            file.fetchedAt(),
                            info.lastAttemptAt(),
                            info.lastOutcome(),
                            file.satellites().size()));
            log.info("Serving the bundled snapshot of {} satellites", file.satellites().size());
        }
        background.execute(() -> {
            catalog.index();
            refreshIfDue();
        });
    }

    @Scheduled(fixedDelayString = "PT30M", initialDelayString = "PT30M")
    public synchronized void refreshIfDue() {
        CatalogInfo info = catalog.info();
        Instant now = clock.instant();
        if (!policy.shouldFetch(info, now)) {
            return;
        }
        OrbitDataSource.Result result = source.fetch();
        CatalogInfo next = switch (result) {
            case OrbitDataSource.Fetched fetched -> {
                List<OrbitalElements> satellites = fetched.satellites();
                CatalogInfo fresh = new CatalogInfo(CatalogInfo.CELESTRAK, now, now, "ok", satellites.size());
                catalog.replace(satellites, fresh);
                byte[] gzip = catalog.payload("all").orElseThrow().gzip();
                persist(() -> store.saveCatalog(fresh, gzip));
                log.info("Downloaded {} satellites from CelesTrak", satellites.size());
                yield fresh;
            }
            case OrbitDataSource.Refused refused -> {
                log.warn("CelesTrak answered HTTP {}; next attempt in {}", refused.status(), policy.minAttemptGap());
                yield info.withAttempt(now, "HTTP " + refused.status());
            }
            case OrbitDataSource.Failed failed -> {
                log.warn("CelesTrak download failed ({}); next attempt in {}", failed.reason(), policy.minAttemptGap());
                yield info.withAttempt(now, failed.reason());
            }
        };
        catalog.updateInfo(next);
        if (!(result instanceof OrbitDataSource.Fetched)) {
            // Recorded even on failure, so a restart can't retry early.
            persist(() -> store.saveInfo(next));
        }
    }

    private void persist(Runnable write) {
        try {
            write.run();
        } catch (DataAccessException e) {
            log.warn("Could not save to the database: {}", e.getMessage());
        }
    }
}
