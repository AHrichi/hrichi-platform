package dev.hrichi.orbit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * The Orbit API (ADR-0013): a cached copy of CelesTrak's public orbit data,
 * refreshed politely, plus pass predictions computed with Orekit.
 */
@SpringBootApplication
@EnableScheduling
public class OrbitApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrbitApiApplication.class, args);
    }
}
