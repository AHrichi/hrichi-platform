package dev.hrichi.orbit.passes;

import java.util.ArrayList;
import java.util.List;
import org.orekit.time.DateComponents;
import org.orekit.time.OffsetModel;
import org.orekit.time.UTCTAIOffsetsLoader;

/**
 * TAI − UTC since 1972 (IERS Bulletin C), so Orekit needs no data files.
 * Orekit's usual {@code orekit-data} folder also carries Earth orientation
 * and planetary ephemerides; this API needs neither (ADR-0013).
 * When the IERS announces a new leap second, add a line here.
 */
public final class LeapSeconds implements UTCTAIOffsetsLoader {

    /** {year, month, day, TAI − UTC in seconds from that date}. */
    private static final int[][] TABLE = {
        {1972, 1, 1, 10}, {1972, 7, 1, 11}, {1973, 1, 1, 12}, {1974, 1, 1, 13},
        {1975, 1, 1, 14}, {1976, 1, 1, 15}, {1977, 1, 1, 16}, {1978, 1, 1, 17},
        {1979, 1, 1, 18}, {1980, 1, 1, 19}, {1981, 7, 1, 20}, {1982, 7, 1, 21},
        {1983, 7, 1, 22}, {1985, 7, 1, 23}, {1988, 1, 1, 24}, {1990, 1, 1, 25},
        {1991, 1, 1, 26}, {1992, 7, 1, 27}, {1993, 7, 1, 28}, {1994, 7, 1, 29},
        {1996, 1, 1, 30}, {1997, 7, 1, 31}, {1999, 1, 1, 32}, {2006, 1, 1, 33},
        {2009, 1, 1, 34}, {2012, 7, 1, 35}, {2015, 7, 1, 36}, {2017, 1, 1, 37},
    };

    @Override
    public List<OffsetModel> loadOffsets() {
        List<OffsetModel> offsets = new ArrayList<>(TABLE.length);
        for (int[] row : TABLE) {
            offsets.add(new OffsetModel(new DateComponents(row[0], row[1], row[2]), row[3]));
        }
        return offsets;
    }
}
