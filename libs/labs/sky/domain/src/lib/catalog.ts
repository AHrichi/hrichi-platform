import constellationData from '../generated/constellations.json';
import starNameData from '../generated/star-names.json';

/** Where a constellation's name goes, J2000 degrees. */
export interface Constellation {
  /** IAU abbreviation, e.g. `Ori`. */
  id: string;
  name: string;
  /** For star names: `Orionis`. */
  genitive: string;
  ra: number;
  dec: number;
}

/** The 88 IAU constellations (Serpens twice, one per half). */
export const constellations: readonly Constellation[] =
  constellationData.constellations;

// JSON imports type each entry literally; the generator guarantees the shape.
const names = starNameData.names as StarName[];

export interface StarName {
  /** Index into the scene's catalogue, brightest first. */
  index: number;
  name: string | null;
  /** Greek letter, e.g. `α`. */
  bayer: string | null;
  constellation: string;
  /** J2000 degrees. */
  ra: number;
  dec: number;
  mag: number;
}

const starNames = new Map<number, StarName>(
  names.map((entry) => [entry.index, entry]),
);
const constellationsById = new Map(
  constellations.map((constellation) => [constellation.id, constellation]),
);

export function constellationName(id: string): string {
  return constellationsById.get(id)?.name ?? id;
}

/** `Betelgeuse`, `α Orionis`… or null for a star with neither. */
export function starLabel(index: number): string | null {
  const entry = starNames.get(index);
  if (!entry) {
    return null;
  }
  const genitive =
    constellationsById.get(entry.constellation)?.genitive ??
    entry.constellation;
  return entry.name ?? `${entry.bayer} ${genitive}`;
}

/** A named or lettered star, by catalogue index. */
export function starAt(index: number): StarName | null {
  return starNames.get(index) ?? null;
}

/** Stars with a proper name, for labels on the sky. */
export const namedStars: readonly StarName[] = names.filter(
  (entry) => entry.name !== null,
);
