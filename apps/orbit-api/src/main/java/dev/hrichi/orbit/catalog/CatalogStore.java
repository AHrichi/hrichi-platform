package dev.hrichi.orbit.catalog;

import java.util.Optional;

/** Where the catalog survives restarts (MongoDB Atlas in production). */
public interface CatalogStore {

    /**
     * The last download, as the gzipped response body the API serves, so a
     * restart can serve it again without encoding 17,000 satellites.
     */
    record Stored(CatalogInfo info, byte[] gzip) {}

    Optional<Stored> load();

    void saveCatalog(CatalogInfo info, byte[] gzip);

    /** Records an attempt (or its failure) without rewriting the catalog. */
    void saveInfo(CatalogInfo info);
}
