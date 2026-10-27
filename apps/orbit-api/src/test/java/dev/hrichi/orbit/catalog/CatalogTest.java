package dev.hrichi.orbit.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import dev.hrichi.orbit.TestData;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class CatalogTest {

    private static final CatalogInfo INFO =
            new CatalogInfo(CatalogInfo.CELESTRAK, Instant.parse("2026-10-27T06:00:00Z"), null, "ok", 2);

    private final JsonMapper json = JsonMapper.builder().build();

    private byte[] storedResponse() {
        Catalog downloaded = new Catalog(json);
        downloaded.replace(List.of(TestData.ISS, TestData.GPS), INFO);
        return downloaded.payload("all").orElseThrow().gzip();
    }

    @Test
    void servesARestoredResponseBeforeIndexingIt() {
        Catalog catalog = new Catalog(json);
        byte[] stored = storedResponse();

        catalog.restore(INFO, stored);

        assertThat(catalog.isEmpty()).isFalse();
        assertThat(catalog.indexed()).isFalse();
        assertThat(catalog.payload("all")).hasValueSatisfying(p -> assertThat(p.gzip()).isSameAs(stored));
        assertThat(catalog.find(25544)).isEmpty();
        assertThat(catalog.payload("stations")).isEmpty();

        catalog.index();

        assertThat(catalog.indexed()).isTrue();
        assertThat(catalog.find(25544)).contains(TestData.ISS);
        assertThat(catalog.groupOf(25544)).isEqualTo(SatelliteGroup.STATIONS);
        assertThat(new String(Catalog.json(catalog.payload("gnss").orElseThrow())))
                .contains("\"count\":1")
                .contains("GPS BIIF-1");
    }

    @Test
    void aDownloadDuringIndexingWins() {
        Catalog catalog = new Catalog(json);
        catalog.restore(INFO, storedResponse());

        CatalogInfo fresh = new CatalogInfo(CatalogInfo.CELESTRAK, Instant.parse("2026-10-27T12:00:00Z"), null, "ok", 1);
        catalog.replace(List.of(TestData.GEO), fresh);
        catalog.index();

        assertThat(catalog.info()).isEqualTo(fresh);
        assertThat(catalog.find(25544)).isEmpty();
        assertThat(catalog.find(TestData.GEO.noradCatId())).isPresent();
    }

    @Test
    void theEtagFollowsTheContent() {
        Catalog a = new Catalog(json);
        Catalog b = new Catalog(json);
        a.replace(List.of(TestData.ISS), INFO);
        b.restore(INFO, a.payload("all").orElseThrow().gzip());

        assertThat(b.payload("all").orElseThrow().etag()).isEqualTo(a.payload("all").orElseThrow().etag());
    }
}
