package dev.hrichi.orbit.catalog;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/**
 * The few hundred brightest satellites, committed with the code
 * (tools/scripts/orbit-snapshot.mjs). Used only when the database is empty
 * and CelesTrak can't be asked yet, so the API always has something to serve.
 */
@Component
public class BundledSnapshot {

    public record File(Instant fetchedAt, String source, List<OrbitalElements> satellites) {}

    private final JsonMapper json;

    public BundledSnapshot(JsonMapper json) {
        this.json = json;
    }

    public File load() {
        try (InputStream in = new ClassPathResource("catalog-snapshot.json").getInputStream()) {
            return json.readValue(in, File.class);
        } catch (IOException e) {
            throw new UncheckedIOException("catalog-snapshot.json is missing from the classpath", e);
        }
    }
}
