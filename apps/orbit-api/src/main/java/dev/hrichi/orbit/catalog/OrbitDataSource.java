package dev.hrichi.orbit.catalog;

import java.util.List;

/** Downloads the Active catalog. One call is one request to CelesTrak. */
public interface OrbitDataSource {

    sealed interface Result {}

    record Fetched(List<OrbitalElements> satellites) implements Result {}

    /** CelesTrak answered with an error status (403 means "already downloaded"). */
    record Refused(int status) implements Result {}

    /** No usable answer: timeout, network error or unreadable body. */
    record Failed(String reason) implements Result {}

    Result fetch();
}
