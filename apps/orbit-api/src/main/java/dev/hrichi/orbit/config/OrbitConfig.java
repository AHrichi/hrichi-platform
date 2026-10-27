package dev.hrichi.orbit.config;

import java.time.Clock;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** The API's settings and one injectable clock, so time-based rules are testable. */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(OrbitProperties.class)
public class OrbitConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
