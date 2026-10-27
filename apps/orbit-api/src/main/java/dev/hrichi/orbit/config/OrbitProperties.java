package dev.hrichi.orbit.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** @param corsOrigins browser origins allowed to call the API */
@ConfigurationProperties("orbit")
public record OrbitProperties(
        @DefaultValue({"http://localhost:4200", "http://localhost:4302"}) List<String> corsOrigins) {}
