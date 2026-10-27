package dev.hrichi.orbit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * The Orbit API (ADR-0013, ADR-0017): a night planner for stargazers. For a
 * place and the coming nights it computes twilight, moonrise and moonset and
 * the windows of true darkness with Orekit.
 */
@SpringBootApplication
public class OrbitApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrbitApiApplication.class, args);
    }
}
