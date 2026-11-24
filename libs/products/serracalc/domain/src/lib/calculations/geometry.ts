import type {
  CalcNote,
  GeometryResult,
  GreenhouseSpec,
} from '../models/serra.models';
import { round } from '../utils/physics';

/** Width of one Venlo roof section, m. */
export const VENLO_ROOF_M = 3.2;

/** Roof sections across one span: one, or one per 3.2 m for Venlo. */
export function roofSectionsPerSpan(spec: GreenhouseSpec): number {
  return spec.shape === 'venlo'
    ? Math.max(1, Math.round(spec.spanWidthM / VENLO_ROOF_M))
    : 1;
}

/** Half the perimeter of an ellipse with semi-axes a and b (Ramanujan). */
function halfEllipse(a: number, b: number): number {
  return (Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))) / 2;
}

/**
 * The house's surfaces and air volume. A pitched roof section is two
 * straight slopes; a tunnel's arch is half an ellipse as wide as the span
 * and as tall as the roof rise. Gable ends close every section.
 */
export function greenhouseGeometry(spec: GreenhouseSpec): GeometryResult {
  const spans = Math.max(1, Math.round(spec.spans));
  const span = Math.max(1, spec.spanWidthM);
  const length = Math.max(1, spec.lengthM);
  const gutter = Math.max(1, spec.gutterHeightM);
  const rise = Math.max(0, spec.ridgeHeightM - gutter);
  const sections = roofSectionsPerSpan(spec);
  const sectionWidth = span / sections;

  const width = spans * span;
  const floor = width * length;
  const perimeter = 2 * (width + length);

  // Roof across one section (m of surface per m of house) and its gable end.
  let roofAcross: number;
  let sectionEnd: number;
  if (spec.shape === 'tunnel') {
    roofAcross = halfEllipse(sectionWidth / 2, rise);
    sectionEnd = (Math.PI * (sectionWidth / 2) * rise) / 2;
  } else {
    roofAcross = 2 * Math.hypot(sectionWidth / 2, rise);
    sectionEnd = (sectionWidth * rise) / 2;
  }
  const totalSections = spans * sections;
  const roof = totalSections * roofAcross * length;
  const sideWalls = 2 * length * gutter;
  const gables = 2 * (width * gutter + totalSections * sectionEnd);
  const cover = roof + sideWalls + gables;
  const volume = floor * gutter + totalSections * sectionEnd * length;
  const meanHeight = volume / floor;

  const notes: CalcNote[] = [];
  if (gutter < 3.5) {
    notes.push({
      code: 'geometry.lowGutter',
      severity: 'warn',
      values: { gutter: round(gutter, 1) },
    });
  } else {
    notes.push({
      code: 'geometry.goodVolume',
      severity: 'ok',
      values: { height: round(meanHeight, 2) },
    });
  }
  if (spec.shape !== 'tunnel' && rise > 0) {
    const slopeDeg = (Math.atan(rise / (sectionWidth / 2)) * 180) / Math.PI;
    if (slopeDeg < 18) {
      notes.push({
        code: 'geometry.flatRoof',
        severity: 'info',
        values: { slope: round(slopeDeg) },
      });
    }
  }
  if (length > 100) {
    notes.push({
      code: 'geometry.longHouse',
      severity: 'info',
      values: { length: round(length) },
    });
  }

  return {
    widthM: round(width, 2),
    floorAreaM2: round(floor),
    roofAreaM2: round(roof),
    sideWallAreaM2: round(sideWalls),
    gableAreaM2: round(gables),
    coverAreaM2: round(cover),
    volumeM3: round(volume),
    perimeterM: round(perimeter, 1),
    meanHeightM: round(meanHeight, 2),
    coverRatio: round(cover / floor, 2),
    roofSectionsPerSpan: sections,
    notes,
  };
}
