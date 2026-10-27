/// <reference lib="webworker" />
// SGP4 for the whole catalog, off the main thread (ADR-0014). Positions go
// back in transferable Float32Arrays: zero-copy, nothing is cloned.
import { eciToGeodetic, json2satrec, propagate, type SatRec } from './sgp4';
import {
  EARTH_RADIUS_KM,
  gmst,
  groupOf,
  orbitShape,
  satelliteGroups,
  sunDirection,
} from '@ah/labs/orbit/domain';
import type { FromWorker, ToWorker } from './protocol';

const classIndex = { LEO: 0, MEO: 1, GEO: 2, HEO: 3 } as const;
const PATH_POINTS = 240;

let records: (SatRec | null)[] = [];
let periods: number[] = [];

const scope = self as unknown as DedicatedWorkerGlobalScope;
const send = (message: FromWorker, transfer: Transferable[] = []) =>
  scope.postMessage(message, transfer);

/** ECI km → scene units: Earth radii, pole up: (x, y, z) → (x, z, −y). */
function write(
  target: Float32Array,
  offset: number,
  p: { x: number; y: number; z: number },
): void {
  target[offset] = p.x / EARTH_RADIUS_KM;
  target[offset + 1] = p.z / EARTH_RADIUS_KM;
  target[offset + 2] = -p.y / EARTH_RADIUS_KM;
}

scope.addEventListener('message', ({ data }: MessageEvent<ToWorker>) => {
  switch (data.type) {
    case 'catalog': {
      const classes = new Uint8Array(data.satellites.length);
      const groups = new Uint8Array(data.satellites.length);
      periods = [];
      records = data.satellites.map((elements, i) => {
        const shape = orbitShape(elements);
        classes[i] = classIndex[shape.orbitClass];
        groups[i] = satelliteGroups.indexOf(
          groupOf(elements, shape.orbitClass),
        );
        periods.push(shape.periodMinutes);
        try {
          // satellite.js types EPHEMERIS_TYPE as the literal 0 (SGP4 elements),
          // which is what CelesTrak publishes.
          return json2satrec(elements as Parameters<typeof json2satrec>[0]);
        } catch {
          return null;
        }
      });
      send({ type: 'catalog', count: records.length, classes, groups }, [
        classes.buffer,
        groups.buffer,
      ]);
      break;
    }
    case 'frame': {
      const date = new Date(data.time);
      const positions = new Float32Array(records.length * 3);
      records.forEach((record, i) => {
        const state = record ? propagate(record, date) : null;
        if (state) {
          write(positions, i * 3, state.position);
        }
      });
      const angle = gmst(date);
      const [sx, sy, sz] = sunDirection(date);
      let telemetry = null;
      const selected = data.selected === null ? null : records[data.selected];
      const state = selected ? propagate(selected, date) : null;
      if (state && data.selected !== null) {
        const where = eciToGeodetic(state.position, angle);
        const v = state.velocity;
        telemetry = {
          index: data.selected,
          latitude: (where.latitude * 180) / Math.PI,
          longitude: (where.longitude * 180) / Math.PI,
          altitudeKm: where.height,
          speedKmS: Math.hypot(v.x, v.y, v.z),
        };
      }
      send(
        {
          type: 'frame',
          time: data.time,
          positions,
          gmst: angle,
          sun: [sx, sz, -sy],
          telemetry,
        },
        [positions.buffer],
      );
      break;
    }
    case 'path': {
      const record = records[data.index];
      const positions = new Float32Array(PATH_POINTS * 3);
      const stepMs = (periods[data.index] * 60_000) / PATH_POINTS;
      for (let i = 0; record && i < PATH_POINTS; i++) {
        const state = propagate(record, new Date(data.time + i * stepMs));
        if (state) {
          write(positions, i * 3, state.position);
        }
      }
      send({ type: 'path', index: data.index, positions }, [positions.buffer]);
      break;
    }
  }
});
