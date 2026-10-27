package dev.hrichi.orbit.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import java.time.Instant;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.data.mongodb.core.MongoTemplate;

/** Runs against a real MongoDB: CI's service, or Docker locally. */
@EnabledIfEnvironmentVariable(named = "MONGODB_TEST_URI", matches = ".+")
class MongoCatalogStoreTest {

    private static final CatalogInfo DOWNLOADED = new CatalogInfo(
            CatalogInfo.CELESTRAK,
            Instant.parse("2026-10-27T06:00:00Z"),
            Instant.parse("2026-10-27T06:00:00Z"),
            "ok",
            16_821);

    private MongoClient client;
    private MongoTemplate mongo;
    private MongoCatalogStore store;

    @BeforeEach
    void connect() {
        client = MongoClients.create(System.getenv("MONGODB_TEST_URI"));
        mongo = new MongoTemplate(client, "orbit_test_" + System.nanoTime());
        store = new MongoCatalogStore(mongo);
    }

    @AfterEach
    void drop() {
        mongo.getDb().drop();
        client.close();
    }

    @Test
    void storesTheCatalogAsOneDocument() {
        byte[] gzip = {31, -117, 8, 0, 1, 2, 3};

        store.saveCatalog(DOWNLOADED, gzip);

        CatalogStore.Stored stored = store.load().orElseThrow();
        assertThat(stored.info()).isEqualTo(DOWNLOADED);
        assertThat(stored.gzip()).isEqualTo(gzip);
        assertThat(mongo.getCollection("catalog").countDocuments()).isEqualTo(1);
    }

    @Test
    void recordsAnAttemptWithoutTouchingTheCatalog() {
        byte[] gzip = {31, -117, 8, 0, 4, 5};
        store.saveCatalog(DOWNLOADED, gzip);

        CatalogInfo refused = DOWNLOADED.withAttempt(Instant.parse("2026-10-27T12:00:00Z"), "HTTP 403");
        store.saveInfo(refused);

        CatalogStore.Stored stored = store.load().orElseThrow();
        assertThat(stored.info()).isEqualTo(refused);
        assertThat(stored.gzip()).isEqualTo(gzip);
    }

    @Test
    void remembersAnAttemptBeforeAnyDownload() {
        assertThat(store.load()).isEmpty();
        CatalogInfo refused = CatalogInfo.empty().withAttempt(Instant.parse("2026-10-27T12:00:00Z"), "HTTP 403");

        store.saveInfo(refused);

        assertThat(store.load()).hasValueSatisfying(stored -> {
            assertThat(stored.info().lastOutcome()).isEqualTo("HTTP 403");
            assertThat(stored.gzip()).isNull();
        });
    }
}
