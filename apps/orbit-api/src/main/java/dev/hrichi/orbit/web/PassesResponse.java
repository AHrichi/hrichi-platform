package dev.hrichi.orbit.web;

import dev.hrichi.orbit.passes.Observer;
import dev.hrichi.orbit.passes.Pass;
import java.time.Instant;
import java.util.List;

public record PassesResponse(
        int noradId,
        String name,
        Observer observer,
        Instant from,
        Instant to,
        double minElevationDeg,
        List<Pass> passes) {}
