package dev.hrichi.orbit.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Metadata for the committed contract, apps/orbit-api/openapi.json. */
@Configuration(proxyBeanMethods = false)
public class OpenApiConfig {

    @Bean
    OpenAPI orbitOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Orbit API")
                        .version("1")
                        .description("Active satellites from CelesTrak's public GP data, and pass predictions computed"
                                + " with Orekit. Errors are RFC 9457 problem details.")
                        .license(new License().name("MIT")));
    }
}
