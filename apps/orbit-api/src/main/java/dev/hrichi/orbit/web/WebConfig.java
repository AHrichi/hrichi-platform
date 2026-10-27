package dev.hrichi.orbit.web;

import dev.hrichi.orbit.config.OrbitProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Read-only API: GET from the portfolio and the Orbit lab only. */
@Configuration(proxyBeanMethods = false)
public class WebConfig implements WebMvcConfigurer {

    private final OrbitProperties properties;

    public WebConfig(OrbitProperties properties) {
        this.properties = properties;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(properties.corsOrigins().toArray(String[]::new))
                .allowedMethods("GET")
                .exposedHeaders("ETag")
                .maxAge(3600);
    }
}
