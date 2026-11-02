// JIT for the injectables the store's dependencies declare.
import '@angular/compiler';
import { Injector } from '@angular/core';
import type {
  CurriculumRoadmap,
  GenerateSectionFlashcardsResponse,
  RoadmapSection,
  StudyFlashcard,
  StudySubject,
} from '@ah/products/studylm/domain';
import { StudyLmApiService } from '../services/studylm-api.service';
import { StudyLmStorageService } from '../services/studylm-storage.service';
import { keepApprovals } from './studylm.methods';
import { StudyLmStore } from './studylm.store';

function section(id: string, approved = false): RoadmapSection {
  return {
    id,
    code: id.toUpperCase(),
    title: `Section ${id}`,
    summary: '',
    difficultyTier: 'beginner',
    subtopics: [],
    officialDocs: [],
    approved,
    flashcardsStatus: 'idle',
    quizStatus: 'idle',
  };
}

function roadmap(...sections: RoadmapSection[]): CurriculumRoadmap {
  return {
    canonicalSubject: 'JS',
    domain: 'languages-runtimes',
    officialDocPortal: '',
    overviewSummary: '',
    branches: [{ id: 'b1', order: 1, title: 'B', description: '', sections }],
  };
}

function card(id: string, sectionId: string): StudyFlashcard {
  return {
    id,
    tier: 'beginner',
    front: `Q ${id}`,
    back: `A ${id}`,
    sourceCitation: '',
    category: 'Concept',
    sectionId,
    masteryCount: 0,
  };
}

function subject(id: string, flashcards: StudyFlashcard[] = []): StudySubject {
  return {
    id,
    title: `Subject ${id}`,
    roadmap: roadmap(section('s1')),
    sources: [],
    overview: null,
    flashcards,
    quizQuestions: [],
    createdAt: '2026-10-01T08:00:00.000Z',
  };
}

/** A store whose AI answers when the test says so. */
async function setup(saved: StudySubject[]) {
  let answer: (result: GenerateSectionFlashcardsResponse) => void = () =>
    undefined;
  let fail: (error: Error) => void = () => undefined;
  const api = {
    getDefaultConfig: async () => ({
      mode: 'local' as const,
      localUrl: 'http://127.0.0.1:5678/webhook/x',
      tunnelUrl: '',
      customUrl: '',
      activeEndpoint: 'http://127.0.0.1:5678/webhook/x',
      isConnected: false,
      isChecking: false,
    }),
    testConnection: async () => ({ ok: false, latencyMs: 1, error: 'down' }),
    generateSectionFlashcards: () =>
      new Promise<GenerateSectionFlashcardsResponse>((resolve, reject) => {
        answer = resolve;
        fail = reject;
      }),
  };
  const storage = {
    getAllSubjects: async () => saved,
    getSetting: async () => null,
    saveSetting: async () => undefined,
    saveSubject: async () => undefined,
  };
  const store = Injector.create({
    providers: [
      { provide: StudyLmApiService, useValue: api },
      { provide: StudyLmStorageService, useValue: storage },
      StudyLmStore,
    ],
  }).get(StudyLmStore);
  // Let the hooks load the saved subjects.
  await new Promise((resolve) => setTimeout(resolve));
  return {
    store,
    answer: (result: GenerateSectionFlashcardsResponse) => answer(result),
    fail: (error: Error) => fail(error),
  };
}

const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('StudyLmStore', () => {
  it('puts a reply into the subject that asked, not the one now open', async () => {
    const { store, answer } = await setup([subject('a'), subject('b')]);
    store.setActiveSubject('a');
    const generating = store.generateFlashcardsForSection('s1');
    store.setActiveSubject('b');
    answer({
      success: true,
      provider: 'test',
      sectionId: 's1',
      docsGrounded: [],
      flashcards: [card('new', 's1')],
    });
    await generating;

    const [a, b] = store.subjects();
    expect(a.flashcards.map((c) => c.id)).toEqual(['new']);
    expect(b.flashcards).toEqual([]);
  });

  it('keeps a section’s cards when generating fails, and says why', async () => {
    const { store, fail } = await setup([subject('a', [card('old', 's1')])]);
    const generating = store.generateFlashcardsForSection('s1');
    fail(new Error('Couldn’t reach n8n.'));
    await generating;
    await settle();

    const [a] = store.subjects();
    expect(a.flashcards.map((c) => c.id)).toEqual(['old']);
    expect(a.roadmap?.branches[0].sections[0]).toMatchObject({
      flashcardsStatus: 'error',
      lastError: 'Couldn’t reach n8n.',
    });
  });
});

describe('keepApprovals', () => {
  it('keeps approvals for sections with the same code', () => {
    const next = keepApprovals(
      roadmap(section('s1'), section('s2')),
      roadmap(section('s1', true)),
    );
    expect(next.branches[0].sections.map((s) => s.approved)).toEqual([
      true,
      false,
    ]);
  });
});
