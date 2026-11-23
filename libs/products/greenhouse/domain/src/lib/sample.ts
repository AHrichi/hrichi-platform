import { addDays, type IsoDate, startOfWeek, type Weekday } from './dates';
import type {
  Absence,
  Crop,
  Greenhouse,
  PlanEntry,
  Team,
  WeeklyTarget,
  Worker,
  WorkerPay,
  WorkLog,
} from './models';
import { DEFAULT_KG_PER_HOUR } from './productivity';

/**
 * A made-up tomato glasshouse in southern Tunisia, for demos and tests:
 * 32 hectares in eight 4-hectare compartments (truss tomatoes in six,
 * cherry tomatoes in two), one harvest crew per compartment, a few
 * floaters, four weeks of history and a plan for the week. Every name and
 * number is invented. The same `weekStart` always gives the same farm.
 *
 * Yields follow about 30 kg/m² a year over some 300 picking days: about
 * 4,000 kg a day from a tomato compartment and 2,000 kg from a cherry one,
 * where picking is three times slower per kg.
 */
export interface SampleFarm {
  greenhouses: Greenhouse[];
  teams: Team[];
  workers: Worker[];
  pay: WorkerPay[];
  absences: Absence[];
  /** Four weeks of work logs before `weekStart`, all synced. */
  history: WorkLog[];
  plan: PlanEntry[];
  target: WeeklyTarget;
}

const COMPARTMENT_M2 = 40_000;

interface Compartment {
  id: string;
  name: string;
  crop: Crop;
  kgPerCrate: number;
  /** Expected kg on an ordinary picking day. */
  baseKg: number;
  team: string;
  crew: number;
  /** How quick the crew is (1 = average). */
  pace: number;
}

const COMPARTMENTS: readonly Compartment[] = [
  {
    id: 'gh-1',
    name: 'A1',
    crop: 'tomato',
    kgPerCrate: 7,
    baseKg: 4000,
    team: 'team-a1',
    crew: 13,
    pace: 1.06,
  },
  {
    id: 'gh-2',
    name: 'A2',
    crop: 'tomato',
    kgPerCrate: 7,
    baseKg: 4000,
    team: 'team-a2',
    crew: 13,
    pace: 0.97,
  },
  {
    id: 'gh-3',
    name: 'A3',
    crop: 'tomato',
    kgPerCrate: 7,
    baseKg: 4000,
    team: 'team-a3',
    crew: 13,
    pace: 1.02,
  },
  {
    id: 'gh-4',
    name: 'A4',
    crop: 'tomato',
    kgPerCrate: 7,
    baseKg: 4000,
    team: 'team-a4',
    crew: 13,
    pace: 0.95,
  },
  {
    id: 'gh-5',
    name: 'B1',
    crop: 'cherry-tomato',
    kgPerCrate: 4,
    baseKg: 2000,
    team: 'team-b1',
    crew: 18,
    pace: 1.03,
  },
  {
    id: 'gh-6',
    name: 'B2',
    crop: 'cherry-tomato',
    kgPerCrate: 4,
    baseKg: 2000,
    team: 'team-b2',
    crew: 18,
    pace: 0.96,
  },
  {
    id: 'gh-7',
    name: 'B3',
    crop: 'tomato',
    kgPerCrate: 7,
    baseKg: 4000,
    team: 'team-b3',
    crew: 13,
    pace: 1,
  },
  {
    id: 'gh-8',
    name: 'B4',
    crop: 'tomato',
    kgPerCrate: 7,
    baseKg: 4000,
    team: 'team-b4',
    crew: 13,
    pace: 1.04,
  },
];

/** Workers in no crew, sent where they're short. */
const FLOATERS = 8;

export const SAMPLE_GREENHOUSES: readonly Greenhouse[] = COMPARTMENTS.map(
  (c) => ({
    id: c.id,
    name: c.name,
    areaM2: COMPARTMENT_M2,
    crop: c.crop,
    kgPerCrate: c.kgPerCrate,
    active: true,
  }),
);

export const SAMPLE_TEAMS: readonly Team[] = COMPARTMENTS.map((c, i) => ({
  id: c.team,
  name: `Équipe ${c.name}`,
  supervisorId: `sup-${i + 1}`,
}));

/** The week's shape, Monday to Saturday; Sunday is off. */
const DAY_FACTOR: Record<Weekday, number> = {
  1: 1,
  2: 0.95,
  3: 1.1,
  4: 1,
  5: 1.15,
  6: 0.85,
  7: 0,
};

const FIRST_NAMES = [
  'Amira',
  'Bilel',
  'Chaima',
  'Dhia',
  'Emna',
  'Fares',
  'Ghada',
  'Hamza',
  'Ines',
  'Jawher',
  'Khaoula',
  'Lotfi',
  'Marwa',
  'Nizar',
  'Olfa',
  'Rami',
  'Salma',
  'Taher',
  'Wafa',
  'Yassine',
  'Zeineb',
  'Anis',
  'Basma',
  'Chokri',
  'Dorra',
  'Elyes',
  'Fatma',
  'Hela',
  'Imed',
  'Jihen',
  'Karim',
  'Leila',
  'Mehdi',
  'Nour',
  'Oussama',
  'Rim',
  'Sami',
  'Hajer',
];
const LAST_NAMES = [
  'Ben Salah',
  'Gharbi',
  'Trabelsi',
  'Jlassi',
  'Mansouri',
  'Ayari',
  'Hammami',
  'Bouazizi',
  'Chebbi',
  'Dridi',
  'Ferchichi',
  'Khelifi',
  'Mejri',
  'Nasri',
  'Riahi',
  'Saidi',
  'Tlili',
  'Zouari',
  'Belhaj',
];

export function sampleFarm(weekStart: IsoDate): SampleFarm {
  const monday = startOfWeek(weekStart);
  const random = mulberry32(hash(monday));
  const workers = sampleWorkers();
  const greenhouses = SAMPLE_GREENHOUSES.map((g) => ({ ...g }));
  const crewOf = new Map(COMPARTMENTS.map((c) => [c.team, c]));

  const history: WorkLog[] = [];
  for (let day = -28; day < 0; day++) {
    const date = addDays(monday, day);
    const weekday = ((((day % 7) + 7) % 7) + 1) as Weekday;
    if (weekday === 7) continue;
    for (const worker of workers) {
      const crew = worker.teamId ? crewOf.get(worker.teamId) : undefined;
      if (!crew) continue;
      const hours = random() < 0.2 ? 7 : 8;
      const rate =
        DEFAULT_KG_PER_HOUR[crew.crop] * crew.pace * (0.8 + random() * 0.4);
      const kg = Math.round(rate * hours * 10) / 10;
      const rejectedCrates = random() < 0.7 ? 0 : 1 + Math.floor(random() * 3);
      history.push({
        id: `log-${date}-${worker.id}`,
        date,
        workerId: worker.id,
        teamId: worker.teamId,
        greenhouseId: crew.id,
        kg,
        crates: Math.round(kg / crew.kgPerCrate) + rejectedCrates,
        rejectedCrates,
        hours,
        recordedAt: `${date}T15:30:00.000Z`,
        syncedAt: `${date}T15:31:00.000Z`,
      });
    }
  }

  const plan: PlanEntry[] = [];
  for (const crew of COMPARTMENTS) {
    for (const day of [1, 2, 3, 4, 5, 6] as const) {
      plan.push({
        weekStart: monday,
        day,
        greenhouseId: crew.id,
        teamId: crew.team,
        expectedKg: Math.round(crew.baseKg * DAY_FACTOR[day]),
        hoursPerDay: 8,
      });
    }
  }

  // Friday is the week's peak; leave and sickness make it short.
  const away = (workerIds: string[], from: number, to: number): Absence[] =>
    workerIds.map((workerId) => ({
      id: `abs-${workerId}`,
      workerId,
      from: addDays(monday, from),
      to: addDays(monday, to),
    }));
  const absences: Absence[] = [
    ...away(['w-53', 'w-54', 'w-55'], 3, 4),
    ...away(['w-71', 'w-72', 'w-73'], 4, 4),
    ...away(['w-1', 'w-14', 'w-27', 'w-40'], 4, 4),
  ];

  return {
    greenhouses,
    teams: SAMPLE_TEAMS.map((t) => ({ ...t })),
    workers,
    // 2.40 to 2.85 TND an hour.
    pay: workers.map((w, i) => ({
      workerId: w.id,
      hourlyRate: 2.4 + ((i + 1) % 4) * 0.15,
    })),
    absences,
    history,
    plan,
    target: {
      weekStart: monday,
      costPerKgTarget: 0.075,
      kgTarget: plan.reduce((total, p) => total + p.expectedKg, 0),
    },
  };
}

/** Each crew in compartment order, then the floaters; names never repeat. */
function sampleWorkers(): Worker[] {
  const teams = [
    ...COMPARTMENTS.flatMap((c) => Array<string | null>(c.crew).fill(c.team)),
    ...Array<string | null>(FLOATERS).fill(null),
  ];
  const used = new Set<string>();
  return teams.map((teamId, i) => {
    const n = i + 1;
    let k = i;
    let fullName = '';
    do {
      fullName = `${FIRST_NAMES[k % FIRST_NAMES.length]} ${LAST_NAMES[(k * 7 + Math.floor(k / FIRST_NAMES.length)) % LAST_NAMES.length]}`;
      k += 1;
    } while (used.has(fullName));
    used.add(fullName);
    return {
      id: `w-${n}`,
      fullName,
      teamId,
      badgeCode: `GH-${String(n).padStart(4, '0')}`,
      active: true,
    };
  });
}

/** A small seeded random number generator, so samples repeat exactly. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function hash(text: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16_777_619);
  }
  return h >>> 0;
}
