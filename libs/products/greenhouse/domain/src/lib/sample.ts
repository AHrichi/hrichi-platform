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
 * A made-up farm near Gabès for the portfolio demo and the tests: six
 * greenhouses, three teams of twelve, two floaters, four weeks of history
 * and a plan for the week. Every name is invented. The same `weekStart`
 * always gives the same farm.
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

export const SAMPLE_GREENHOUSES: readonly Greenhouse[] = [
  gh('gh-1', 'Serre 1', 'tomato', 12),
  gh('gh-2', 'Serre 2', 'tomato', 12),
  gh('gh-3', 'Serre 3', 'cherry-tomato', 6),
  gh('gh-4', 'Serre 4', 'pepper', 10),
  gh('gh-5', 'Serre 5', 'cucumber', 12),
  gh('gh-6', 'Serre 6', 'melon', 15),
];

export const SAMPLE_TEAMS: readonly Team[] = [
  { id: 'team-a', name: 'Équipe A', supervisorId: 'sup-1' },
  { id: 'team-b', name: 'Équipe B', supervisorId: 'sup-2' },
  { id: 'team-c', name: 'Équipe C', supervisorId: 'sup-3' },
];

/** Which greenhouses each team picks, and how quick it is (1 = average). */
const TEAM_WORK: Record<string, { greenhouses: string[]; pace: number }> = {
  'team-a': { greenhouses: ['gh-1', 'gh-2'], pace: 1.05 },
  'team-b': { greenhouses: ['gh-3', 'gh-4'], pace: 0.95 },
  'team-c': { greenhouses: ['gh-5', 'gh-6'], pace: 1 },
};

/** Expected kg per greenhouse on an ordinary day. */
const BASE_KG: Record<string, number> = {
  'gh-1': 2000,
  'gh-2': 2000,
  'gh-3': 600,
  'gh-4': 1200,
  'gh-5': 1800,
  'gh-6': 1500,
};

/** The week's shape, Monday to Saturday; Sunday is off. */
const DAY_FACTOR: Record<Weekday, number> = {
  1: 1,
  2: 1.05,
  3: 1.3,
  4: 1.15,
  5: 1.4,
  6: 0.8,
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
  const cropOf = new Map(greenhouses.map((g) => [g.id, g]));

  const history: WorkLog[] = [];
  for (let day = -28; day < 0; day++) {
    const date = addDays(monday, day);
    const weekday = ((((day % 7) + 7) % 7) + 1) as Weekday;
    if (weekday === 7) continue;
    for (const [index, worker] of workers.entries()) {
      if (!worker.teamId) continue;
      const work = TEAM_WORK[worker.teamId];
      if (!work) continue;
      // Half the team in each greenhouse, swapping every day.
      const greenhouseId =
        work.greenhouses[(index + day + 28) % work.greenhouses.length];
      const greenhouse = greenhouseId ? cropOf.get(greenhouseId) : undefined;
      if (!greenhouse) continue;
      const hours = random() < 0.2 ? 7 : 8;
      const rate =
        DEFAULT_KG_PER_HOUR[greenhouse.crop] *
        work.pace *
        (0.8 + random() * 0.4);
      const kg = Math.round(rate * hours * 10) / 10;
      const rejectedCrates = random() < 0.7 ? 0 : 1 + Math.floor(random() * 3);
      history.push({
        id: `log-${date}-${worker.id}`,
        date,
        workerId: worker.id,
        teamId: worker.teamId,
        greenhouseId: greenhouse.id,
        kg,
        crates: Math.round(kg / greenhouse.kgPerCrate) + rejectedCrates,
        rejectedCrates,
        hours,
        recordedAt: `${date}T15:30:00.000Z`,
        syncedAt: `${date}T15:31:00.000Z`,
      });
    }
  }

  const plan: PlanEntry[] = [];
  for (const [teamId, work] of Object.entries(TEAM_WORK)) {
    for (const greenhouseId of work.greenhouses) {
      for (const day of [1, 2, 3, 4, 5, 6] as const) {
        plan.push({
          weekStart: monday,
          day,
          greenhouseId,
          teamId,
          expectedKg: Math.round(
            (BASE_KG[greenhouseId] ?? 0) * DAY_FACTOR[day],
          ),
          hoursPerDay: 8,
        });
      }
    }
  }

  // Three of team C off on Thursday and Friday, two of team B on Friday.
  const absences: Absence[] = [
    ...['w-25', 'w-26', 'w-27'].map((workerId) => ({
      id: `abs-${workerId}`,
      workerId,
      from: addDays(monday, 3),
      to: addDays(monday, 4),
    })),
    ...['w-13', 'w-14'].map((workerId) => ({
      id: `abs-${workerId}`,
      workerId,
      from: addDays(monday, 4),
      to: addDays(monday, 4),
    })),
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
      costPerKgTarget: 0.085,
      kgTarget: plan.reduce((total, p) => total + p.expectedKg, 0),
    },
  };
}

function sampleWorkers(): Worker[] {
  return FIRST_NAMES.map((first, i) => {
    const n = i + 1;
    const teamId =
      n <= 12 ? 'team-a' : n <= 24 ? 'team-b' : n <= 36 ? 'team-c' : null;
    return {
      id: `w-${n}`,
      fullName: `${first} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]}`,
      teamId,
      badgeCode: `GH-${String(n).padStart(4, '0')}`,
      active: true,
    };
  });
}

function gh(
  id: string,
  name: string,
  crop: Crop,
  kgPerCrate: number,
): Greenhouse {
  return { id, name, areaM2: 10_000, crop, kgPerCrate, active: true };
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
