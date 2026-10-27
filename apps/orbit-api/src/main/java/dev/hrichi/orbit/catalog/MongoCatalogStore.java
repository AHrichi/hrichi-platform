package dev.hrichi.orbit.catalog;

import java.time.Instant;
import java.util.Optional;
import org.bson.types.Binary;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

/**
 * One document holds the whole catalog: its metadata and the gzipped
 * response body (about 1.1 MB, well under MongoDB's 16 MB limit). Reading
 * one binary field is far cheaper on a tenth of a CPU than mapping 17,000
 * documents and encoding them again.
 */
@Repository
public class MongoCatalogStore implements CatalogStore {

    @Document("catalog")
    record CatalogDocument(
            @Id String id,
            String source,
            Instant fetchedAt,
            Instant lastAttemptAt,
            String lastOutcome,
            int count,
            Binary gzip) {}

    private static final String ID = "catalog";

    private final MongoTemplate mongo;

    public MongoCatalogStore(MongoTemplate mongo) {
        this.mongo = mongo;
    }

    @Override
    public Optional<Stored> load() {
        return Optional.ofNullable(mongo.findById(ID, CatalogDocument.class))
                .map(doc -> new Stored(
                        new CatalogInfo(
                                doc.source(), doc.fetchedAt(), doc.lastAttemptAt(), doc.lastOutcome(), doc.count()),
                        doc.gzip() == null ? null : doc.gzip().getData()));
    }

    @Override
    public void saveCatalog(CatalogInfo info, byte[] gzip) {
        mongo.save(new CatalogDocument(
                ID,
                info.source(),
                info.fetchedAt(),
                info.lastAttemptAt(),
                info.lastOutcome(),
                info.count(),
                new Binary(gzip)));
    }

    @Override
    public void saveInfo(CatalogInfo info) {
        mongo.upsert(
                Query.query(Criteria.where("_id").is(ID)),
                new Update()
                        .set("source", info.source())
                        .set("fetchedAt", info.fetchedAt())
                        .set("lastAttemptAt", info.lastAttemptAt())
                        .set("lastOutcome", info.lastOutcome())
                        .set("count", info.count()),
                CatalogDocument.class);
    }
}
