package dev.hrichi.orbit.catalog;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/**
 * The catalog in memory. A free instance has a tenth of a CPU, and encoding
 * or decoding 17,000 satellites takes it tens of seconds, so:
 * <ul>
 *   <li>each response is gzipped once per download, not per request (a group
 *       on its first request);
 *   <li>after a restart, the stored gzip is served as it is straight away,
 *       and decoded for lookups ({@link #index()}) in the background.
 * </ul>
 */
@Component
public class Catalog {

    /** A ready-to-send, gzipped response body. */
    public record Payload(byte[] gzip, String etag) {}

    /** The response shape; also documents the endpoint in OpenAPI. */
    public record CatalogResponse(
            String group, String source, Instant fetchedAt, int count, List<OrbitalElements> satellites) {}

    /**
     * @param indexed whether {@code byId}, {@code groups} and {@code members}
     *                reflect the data; false between a restore and its index
     */
    private record State(
            CatalogInfo info,
            boolean indexed,
            Map<Integer, OrbitalElements> byId,
            Map<Integer, SatelliteGroup> groups,
            Map<String, List<OrbitalElements>> members,
            Map<String, Payload> payloads) {}

    private final JsonMapper json;
    private volatile State state;

    public Catalog(JsonMapper json) {
        this.json = json;
        this.state = new State(CatalogInfo.empty(), true, Map.of(), Map.of(), Map.of(), new ConcurrentHashMap<>());
    }

    /** Installs a fresh download and prepares its response. */
    public synchronized void replace(List<OrbitalElements> satellites, CatalogInfo info) {
        byte[] body = json.writeValueAsBytes(
                new CatalogResponse("all", info.source(), info.fetchedAt(), satellites.size(), satellites));
        byte[] zipped = gzip(body);
        state = indexedState(info, satellites, new Payload(zipped, etag(zipped)));
    }

    /** Serves a stored response as it is; call {@link #index()} to enable lookups. */
    public synchronized void restore(CatalogInfo info, byte[] storedGzip) {
        Map<String, Payload> payloads = new ConcurrentHashMap<>();
        payloads.put("all", new Payload(storedGzip, etag(storedGzip)));
        state = new State(info, false, Map.of(), Map.of(), Map.of(), payloads);
    }

    /** Decodes a restored response for lookups by id and group. */
    public void index() {
        State restored = state;
        if (restored.indexed()) {
            return;
        }
        Payload all = restored.payloads().get("all");
        CatalogResponse response = json.readValue(gunzip(all.gzip()), CatalogResponse.class);
        State indexed = indexedState(restored.info(), response.satellites(), all);
        synchronized (this) {
            // A download may have replaced the restored data meanwhile; it wins.
            if (state == restored) {
                state = indexed;
            } else if (state.payloads().get("all") == all) {
                state = new State(state.info(), true, indexed.byId(), indexed.groups(), indexed.members(), indexed.payloads());
            }
        }
    }

    private static State indexedState(CatalogInfo info, List<OrbitalElements> satellites, Payload all) {
        Map<Integer, OrbitalElements> byId = new LinkedHashMap<>();
        Map<Integer, SatelliteGroup> groups = new LinkedHashMap<>();
        Map<String, List<OrbitalElements>> members = new LinkedHashMap<>();
        for (SatelliteGroup group : SatelliteGroup.values()) {
            members.put(key(group), new ArrayList<>());
        }
        for (OrbitalElements elements : satellites) {
            SatelliteGroup group = SatelliteGroup.classify(elements, OrbitShape.of(elements).orbitClass());
            byId.put(elements.noradCatId(), elements);
            groups.put(elements.noradCatId(), group);
            members.get(key(group)).add(elements);
        }
        members.put("all", List.copyOf(byId.values()));
        Map<String, Payload> payloads = new ConcurrentHashMap<>();
        payloads.put("all", all);
        return new State(
                info,
                true,
                Collections.unmodifiableMap(byId),
                Collections.unmodifiableMap(groups),
                Collections.unmodifiableMap(members),
                payloads);
    }

    /** Records a CelesTrak attempt without touching the data in use. */
    public synchronized void updateInfo(CatalogInfo info) {
        State current = state;
        state = new State(
                info, current.indexed(), current.byId(), current.groups(), current.members(), current.payloads());
    }

    public CatalogInfo info() {
        return state.info();
    }

    /** Nothing to serve yet. */
    public boolean isEmpty() {
        return state.payloads().get("all") == null;
    }

    /** Lookups ({@link #find}, groups) are available. */
    public boolean indexed() {
        return state.indexed();
    }

    public Optional<OrbitalElements> find(int noradId) {
        return Optional.ofNullable(state.byId().get(noradId));
    }

    public SatelliteGroup groupOf(int noradId) {
        return state.groups().getOrDefault(noradId, SatelliteGroup.OTHER);
    }

    /**
     * {@code all} or a lower-case {@link SatelliteGroup} name. Groups are
     * empty until the catalog is indexed.
     */
    public Optional<Payload> payload(String group) {
        State current = state;
        Payload ready = current.payloads().get(group);
        if (ready != null) {
            return Optional.of(ready);
        }
        List<OrbitalElements> satellites = current.members().get(group);
        if (satellites == null) {
            return Optional.empty();
        }
        return Optional.of(current.payloads().computeIfAbsent(group, key -> {
            byte[] zipped = gzip(json.writeValueAsBytes(new CatalogResponse(
                    key, current.info().source(), current.info().fetchedAt(), satellites.size(), satellites)));
            return new Payload(zipped, etag(zipped));
        }));
    }

    /** The uncompressed body, for the rare client that doesn't accept gzip. */
    public static byte[] json(Payload payload) {
        return gunzip(payload.gzip());
    }

    private static String key(SatelliteGroup group) {
        return group.name().toLowerCase(Locale.ROOT);
    }

    private static String etag(byte[] gzip) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(gzip);
            return "\"" + HexFormat.of().formatHex(digest).substring(0, 16) + "\"";
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static byte[] gzip(byte[] body) {
        var out = new ByteArrayOutputStream(body.length / 4);
        try (var zip = new GZIPOutputStream(out)) {
            zip.write(body);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return out.toByteArray();
    }

    private static byte[] gunzip(byte[] gzip) {
        try (var in = new GZIPInputStream(new ByteArrayInputStream(gzip))) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
