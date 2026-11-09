import '@angular/compiler';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { Injector, PLATFORM_ID, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { APP_MODE, type AppMode } from '@ah/platform/app-mode';
import type { ProjectItem } from '@ah/products/lighting/domain';
import { LightingDbService, type PolePhotoRecord } from './lighting-db.service';

function createDbService(mode: AppMode = 'standalone'): LightingDbService {
  const injector = Injector.create({
    providers: [
      { provide: APP_MODE, useValue: mode },
      { provide: PLATFORM_ID, useValue: 'browser' },
      LightingDbService,
    ],
  });
  return runInInjectionContext(injector, () => injector.get(LightingDbService));
}

const sampleProject: ProjectItem = {
  id: 'proj-1',
  title: 'Solar Highway',
  clientOrMunicipality: 'City',
  locationName: 'North Road',
  lightingType: 'solar_autonomous',
  stage: 'construction',
  startDate: '2026-11-01',
  commissioningDeadline: '2026-12-01',
  roadWidthMeters: 8,
  roadClass: 'M2',
  windZone: 3,
  defaultSoil: 'compact_gravel',
  engineerName: 'A. H.',
  gpsCenter: { lat: 36.8, lng: 10.2 },
  poles: [],
  milestones: [],
  calculations: [],
  measurements: [],
  createdAt: '2026-11-01T08:00:00.000Z',
  updatedAt: '2026-11-01T08:00:00.000Z',
};

beforeEach(() => {
  const factory = new IDBFactory();
  Object.assign(globalThis, { indexedDB: factory });
});

describe('LightingDbService', () => {
  it('saves and retrieves projects from IndexedDB', async () => {
    const service = createDbService('standalone');
    await service.saveProject(sampleProject);

    const projects = await service.getAllProjects();
    expect(projects.length).toBe(1);
    expect(projects[0].id).toBe('proj-1');
    expect(projects[0].title).toBe('Solar Highway');
  });

  it('stores and retrieves pole photos in the dedicated store', async () => {
    const service = createDbService('standalone');
    const photoRecord: PolePhotoRecord = {
      poleId: 'pole-101',
      photos: [
        {
          id: 'ph-1',
          blob: new Blob(['image-bytes-mock'], { type: 'image/jpeg' }),
          takenAt: '2026-11-01T09:00:00.000Z',
        },
      ],
    };

    await service.savePolePhotos(photoRecord);
    const retrieved = await service.getPolePhotos('pole-101');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.poleId).toBe('pole-101');
    expect(retrieved?.photos.length).toBe(1);
    expect(retrieved?.photos[0].id).toBe('ph-1');

    await service.deletePolePhotos('pole-101');
    const afterDelete = await service.getPolePhotos('pole-101');
    expect(afterDelete).toBeNull();
  });

  it('uses a demo-isolated database name in embedded demo mode', async () => {
    const service = createDbService('embedded-demo');
    await service.saveProject(sampleProject);

    const dbs = await indexedDB.databases();
    const names = dbs.map((d) => d.name);
    expect(names.some((name) => name?.startsWith('ah-demo-'))).toBe(true);
  });
});
