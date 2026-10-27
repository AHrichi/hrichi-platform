package dev.hrichi.orbit.config;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * @param celestrakUrl  the Active group in JSON (OMM) format
 * @param refreshAfter  age at which CelesTrak data is downloaded again
 * @param minAttemptGap minimum time between two CelesTrak requests
 * @param loadOnStartup load the stored catalog (and maybe refresh) at boot
 * @param corsOrigins   browser origins allowed to call the API
 */
@ConfigurationProperties("orbit")
public record OrbitProperties(
        @DefaultValue("https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json") URI celestrakUrl,
        @DefaultValue("6h") Duration refreshAfter,
        @DefaultValue("2h") Duration minAttemptGap,
        @DefaultValue("true") boolean loadOnStartup,
        @DefaultValue({"http://localhost:4200", "http://localhost:4302"}) List<String> corsOrigins) {}
