package dev.hrichi.orbit.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import java.util.ArrayList;
import java.util.Set;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Metadata for the committed contract, apps/orbit-api/openapi.json. */
@Configuration(proxyBeanMethods = false)
public class OpenApiConfig {

    /** The API's own response records; every component is always present. */
    private static final Set<String> RECORDS = Set.of("NightsResponse", "Night", "DarkWindow", "ActiveShower");

    @Bean
    OpenAPI orbitOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Orbit API")
                        .version("1")
                        .description("A night planner for stargazers: twilight, the Moon and moonless darkness for"
                                + " any place, computed with Orekit. Errors are RFC 9457 problem details.")
                        .license(new License().name("MIT")));
    }

    /**
     * springdoc leaves record components optional, so generated TypeScript
     * would make every field `| undefined`. Java records always serialise
     * every component, so the contract says so.
     */
    @Bean
    OpenApiCustomizer requiredRecordComponents() {
        return openApi -> openApi.getComponents().getSchemas().forEach((name, schema) -> {
            if (RECORDS.contains(name) && schema.getProperties() != null) {
                schema.setRequired(new ArrayList<>(schema.getProperties().keySet()));
            }
        });
    }
}
