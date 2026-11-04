import { beforeEach, describe, expect, it } from 'vitest';
import {
  exportBackup,
  importBackup,
  loadAppState,
  saveAppState,
  STORAGE_KEY,
} from './storage';
import { createStarterAppState } from './sample-data';

describe('Alarm Engine Storage & Backup', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads starter app state if localStorage is empty', () => {
    const state = loadAppState();
    expect(state.chapters.length).toBe(0);
    expect(state.systemState.checklistState.length).toBe(9);
  });

  it('persists and retrieves updated state', () => {
    const custom = createStarterAppState();
    custom.chapters.push({
      chapterNumber: 1,
      originalStudyDate: '2026-11-01',
      d3Date: '2026-11-04',
      d7Date: '2026-11-08',
      d14Date: '2026-11-15',
      d3Completed: false,
      d7Completed: false,
      d14Completed: false,
      quizScorePercent: 90,
      quizQuestionsMissed: 1,
      isWeak: false,
      codingCarryover: false,
      errorNotes: 'Custom test error note',
    });
    saveAppState(custom);

    const reloaded = loadAppState();
    expect(reloaded.chapters[0].errorNotes).toBe('Custom test error note');
  });

  it('exports and imports backup JSON correctly', () => {
    const initial = createStarterAppState();
    initial.systemState.lastConsolidationAtChapter = 12;
    const json = exportBackup(initial);

    expect(json).toContain('"version": 1');
    expect(json).toContain('"lastConsolidationAtChapter": 12');

    localStorage.clear();
    const restored = importBackup(json);
    expect(restored.systemState.lastConsolidationAtChapter).toBe(12);
  });

  it('throws on malformed import', () => {
    expect(() => importBackup('{"notValid": true}')).toThrow();
  });
});
