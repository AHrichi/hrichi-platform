package dev.hrichi.orbit.catalog;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Groups derived locally from the single Active download. CelesTrak asks
 * clients not to download overlapping groups (Starlink is a subset of
 * Active), so the API never requests them separately.
 */
public enum SatelliteGroup {
    STATIONS,
    STARLINK,
    GNSS,
    WEATHER,
    OTHER;

    private static final Pattern STATION = Pattern.compile("^(ISS|CSS) \\(");
    private static final Pattern NAVIGATION =
            Pattern.compile("\\b(GPS|NAVSTAR|GALILEO|GSAT0|BEIDOU|COSMOS|GLONASS|QZS|IRNSS)\\b");
    private static final Pattern WEATHER_NAME = Pattern.compile(
            "\\b(NOAA|METOP|METEOR|GOES|FENGYUN|HIMAWARI|METEOSAT|DMSP|SUOMI|JPSS|ELEKTRO|GK-?2A)\\b");

    public static SatelliteGroup classify(OrbitalElements elements, OrbitClass orbitClass) {
        String name = elements.objectName() == null ? "" : elements.objectName().toUpperCase(Locale.ROOT);
        if (STATION.matcher(name).find()) {
            return STATIONS;
        }
        if (name.startsWith("STARLINK")) {
            return STARLINK;
        }
        // Navigation constellations fly in MEO (and QZSS/IRNSS in GEO/HEO);
        // a LEO "COSMOS" is something else.
        if (orbitClass != OrbitClass.LEO && NAVIGATION.matcher(name).find()) {
            return GNSS;
        }
        if (WEATHER_NAME.matcher(name).find()) {
            return WEATHER;
        }
        return OTHER;
    }
}
