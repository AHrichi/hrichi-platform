package dev.hrichi.orbit.catalog;

import dev.hrichi.orbit.config.OrbitProperties;
import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** CelesTrak's GP endpoint, Active group, JSON (OMM) format. */
@Component
public class CelestrakSource implements OrbitDataSource {

    private static final TypeReference<List<OrbitalElements>> CATALOG = new TypeReference<>() {};

    private final OrbitProperties properties;
    private final JsonMapper json;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    public CelestrakSource(OrbitProperties properties, JsonMapper json) {
        this.properties = properties;
        this.json = json;
    }

    @Override
    public Result fetch() {
        HttpRequest request = HttpRequest.newBuilder(properties.celestrakUrl())
                .timeout(Duration.ofSeconds(60))
                .header("Accept", "application/json")
                .header("User-Agent", "hrichi-platform orbit-api (+https://github.com/AHrichi/hrichi-platform)")
                .GET()
                .build();
        try {
            HttpResponse<byte[]> response = http.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() != 200) {
                return new Refused(response.statusCode());
            }
            List<OrbitalElements> satellites = json.readValue(response.body(), CATALOG);
            return satellites.isEmpty() ? new Failed("empty catalog") : new Fetched(satellites);
        } catch (IOException | JacksonException e) {
            return new Failed(e.getClass().getSimpleName() + ": " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new Failed("interrupted");
        }
    }
}
