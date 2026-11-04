import type {
  Chapter,
  NightlyAppState,
  NightlySystemState,
  QuestionnaireInput,
} from './models';
import { createStarterAppState } from './sample-data';

export const STORAGE_KEY = 'nightly_alarm_engine_v1';

export interface ExportBackupPayload {
  version: number;
  exportedAt: string;
  chapters: Chapter[];
  systemState: NightlySystemState;
  questionnaire?: QuestionnaireInput;
}

export function loadAppState(): NightlyAppState {
  if (typeof localStorage === 'undefined') {
    return createStarterAppState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createStarterAppState();
      saveAppState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.chapters) && parsed.systemState) {
      const starter = createStarterAppState();
      return {
        chapters: parsed.chapters,
        systemState: {
          lastConsolidationAtChapter:
            parsed.systemState.lastConsolidationAtChapter ?? 0,
          checklistState: Array.isArray(parsed.systemState.checklistState)
            ? parsed.systemState.checklistState
            : new Array(9).fill(false),
          selectedTopicId:
            parsed.systemState.selectedTopicId ??
            starter.systemState.selectedTopicId ??
            'all',
          topics:
            Array.isArray(parsed.systemState.topics) &&
            parsed.systemState.topics.length > 0
              ? parsed.systemState.topics
              : starter.systemState.topics,
          notificationsEnabled:
            parsed.systemState.notificationsEnabled ?? false,
          collapsedSections: parsed.systemState.collapsedSections ?? {},
        },
        questionnaire: parsed.questionnaire ?? starter.questionnaire,
        lastDecision: parsed.lastDecision,
      };
    }
    return createStarterAppState();
  } catch (err) {
    console.error('Failed to parse localStorage alarm engine state:', err);
    return createStarterAppState();
  }
}

export function saveAppState(state: NightlyAppState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function exportBackup(state: NightlyAppState): string {
  const payload: ExportBackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    chapters: state.chapters,
    systemState: state.systemState,
    questionnaire: state.questionnaire,
  };
  return JSON.stringify(payload, null, 2);
}

export function importBackup(jsonString: string): NightlyAppState {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !Array.isArray(parsed.chapters)) {
    throw new Error('Invalid backup file: "chapters" array is required.');
  }

  // Validate chapter schema minimally
  for (const ch of parsed.chapters) {
    if (typeof ch.chapterNumber !== 'number') {
      throw new Error('Each chapter must have a numeric "chapterNumber".');
    }
  }

  const systemState: NightlySystemState = {
    lastConsolidationAtChapter:
      parsed.systemState?.lastConsolidationAtChapter ?? 0,
    checklistState: Array.isArray(parsed.systemState?.checklistState)
      ? parsed.systemState.checklistState
      : new Array(9).fill(false),
  };

  const starter = createStarterAppState();
  const questionnaire: QuestionnaireInput =
    parsed.questionnaire ?? starter.questionnaire;

  const restored: NightlyAppState = {
    chapters: parsed.chapters,
    systemState,
    questionnaire,
  };

  saveAppState(restored);
  return restored;
}
