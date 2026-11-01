import { Injectable } from '@angular/core';
import {
  AiRelationshipAnalysis,
  AnalyticsBasisMode,
  ArchiveExtractionResult,
  AudioInsightMeta,
  ChatAnalysisReport,
  DateOrderMode,
  ZipMediaEntry,
} from '@ah/products/whatsapp/domain';

const DB_NAME = 'chatpulse-whatsapp-vault-v1';
const DB_VERSION = 1;
const SUMMARIES_STORE = 'summaries';
const PAYLOADS_STORE = 'payloads';
const LAST_ACTIVE_ID_KEY = 'chatpulse:whatsapp:last-active-id:v1';

export interface SavedParticipantPill {
  name: string;
  initials: string;
  accentColor: string;
  messageSharePct: number;
}

export interface SavedWhatsAppConversationSummary {
  id: string;
  chatTitle: string;
  fileName: string;
  sourceType: 'txt' | 'zip' | 'demo';
  createdAtIso: string;
  updatedAtIso: string;
  updatedAtMs: number;
  participants: SavedParticipantPill[];
  totalMessages: number;
  totalWords: number;
  spokenWordsAdded: number;
  totalMediaFiles: number;
  totalVoiceNotes: number;
  transcribedVoiceNotes: number;
  translatedVoiceNotes: number;
  overallChemistryScore: number;
  firstMessageDate: string;
  lastMessageDate: string;
  hasAiAnalysis: boolean;
  aiRelationshipTitle?: string;
  estimatedSizeBytes: number;
}

export interface SavedWhatsAppConversationPayload {
  id: string;
  extractionResult: ArchiveExtractionResult;
  audioTranscripts: Record<string, string>;
  audioTranslations: Record<string, string>;
  audioMetadata: Record<string, AudioInsightMeta>;
  aiAnalysis: AiRelationshipAnalysis | null;
  dateOrderMode: DateOrderMode;
  sessionGapMinutes: number;
  analyticsBasisMode: AnalyticsBasisMode;
  customStopwords: string[];
}

export interface SavedWhatsAppConversationFull {
  summary: SavedWhatsAppConversationSummary;
  payload: SavedWhatsAppConversationPayload;
}

@Injectable({ providedIn: 'root' })
export class WhatsappArchiveDbService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  /**
   * Generates a deterministic conversation ID from the chat title, filename, and message count
   * so re-uploading or updating the same export updates the existing record rather than duplicating.
   */
  buildConversationId(
    chatTitle: string,
    fileName: string,
    firstMessageDate: string,
    lastMessageDate: string,
  ): string {
    const raw = `${chatTitle.trim().toLowerCase()}|${fileName.trim().toLowerCase()}|${firstMessageDate}|${lastMessageDate}`;
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i++) {
      hash ^= raw.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const hex = (hash >>> 0).toString(16).padStart(8, '0');
    const slug = chatTitle
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
    return `conv-${slug || 'chat'}-${hex}`;
  }

  getLastActiveConversationId(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    try {
      return window.localStorage.getItem(LAST_ACTIVE_ID_KEY);
    } catch {
      return null;
    }
  }

  setLastActiveConversationId(id: string | null): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      if (id) {
        window.localStorage.setItem(LAST_ACTIVE_ID_KEY, id);
      } else {
        window.localStorage.removeItem(LAST_ACTIVE_ID_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  }

  async listSummaries(): Promise<SavedWhatsAppConversationSummary[]> {
    const db = await this.openDb();
    if (!db) {
      return [];
    }

    return new Promise<SavedWhatsAppConversationSummary[]>((resolve) => {
      try {
        const tx = db.transaction(SUMMARIES_STORE, 'readonly');
        const store = tx.objectStore(SUMMARIES_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const items =
            (req.result as SavedWhatsAppConversationSummary[]) ?? [];
          items.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
          resolve(items);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async loadConversation(
    id: string,
  ): Promise<SavedWhatsAppConversationFull | null> {
    const db = await this.openDb();
    if (!db) {
      return null;
    }

    return new Promise<SavedWhatsAppConversationFull | null>((resolve) => {
      try {
        const tx = db.transaction(
          [SUMMARIES_STORE, PAYLOADS_STORE],
          'readonly',
        );
        const sumStore = tx.objectStore(SUMMARIES_STORE);
        const payStore = tx.objectStore(PAYLOADS_STORE);

        const sumReq = sumStore.get(id);
        const payReq = payStore.get(id);

        tx.oncomplete = () => {
          const summary = sumReq.result as
            SavedWhatsAppConversationSummary | undefined;
          const payload = payReq.result as
            SavedWhatsAppConversationPayload | undefined;
          if (!summary || !payload) {
            resolve(null);
            return;
          }

          const hydratedExtraction = this.hydrateExtractionPreviewUrls(
            payload.extractionResult,
          );
          resolve({
            summary,
            payload: {
              ...payload,
              extractionResult: hydratedExtraction,
            },
          });
        };

        tx.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async saveConversation(params: {
    id?: string | null;
    report: ChatAnalysisReport;
    extractionResult: ArchiveExtractionResult;
    audioTranscripts: Record<string, string>;
    audioTranslations: Record<string, string>;
    audioMetadata: Record<string, AudioInsightMeta>;
    aiAnalysis: AiRelationshipAnalysis | null;
    dateOrderMode: DateOrderMode;
    sessionGapMinutes: number;
    analyticsBasisMode: AnalyticsBasisMode;
    customStopwords: string[];
    existingCreatedAtIso?: string | null;
  }): Promise<SavedWhatsAppConversationSummary | null> {
    const db = await this.openDb();
    if (!db) {
      return null;
    }

    const { report, extractionResult } = params;
    const now = new Date();
    const nowIso = now.toISOString();
    const id =
      params.id ||
      this.buildConversationId(
        report.chatTitle,
        extractionResult.fileName,
        report.streaksAndTimeline.firstMessageDate,
        report.streaksAndTimeline.lastMessageDate,
      );

    const compactExtraction =
      this.dehydrateExtractionForStorage(extractionResult);
    const estimatedSizeBytes = this.estimatePayloadBytes(compactExtraction);

    const summary: SavedWhatsAppConversationSummary = {
      id,
      chatTitle: report.chatTitle,
      fileName: extractionResult.fileName,
      sourceType: extractionResult.sourceType,
      createdAtIso: params.existingCreatedAtIso || nowIso,
      updatedAtIso: nowIso,
      updatedAtMs: now.getTime(),
      participants: report.participants.slice(0, 6).map((p) => ({
        name: p.name,
        initials: p.initials,
        accentColor: p.accentColor,
        messageSharePct: p.messageSharePct,
      })),
      totalMessages: report.totalMessages,
      totalWords: report.totalWords,
      spokenWordsAdded: report.mediaAnalytics.transcribedWordsAdded,
      totalMediaFiles:
        report.mediaAnalytics.totalArchiveMediaFiles || report.totalMedia,
      totalVoiceNotes:
        report.mediaAnalytics.voiceNotes.length ||
        report.mediaAnalytics.byCategory.audio,
      transcribedVoiceNotes: report.mediaAnalytics.transcribedVoiceNoteCount,
      translatedVoiceNotes: report.mediaAnalytics.translatedVoiceNoteCount,
      overallChemistryScore: report.deepAnalytics.overallChemistryScore,
      firstMessageDate: report.streaksAndTimeline.firstMessageDate,
      lastMessageDate: report.streaksAndTimeline.lastMessageDate,
      hasAiAnalysis: params.aiAnalysis !== null,
      aiRelationshipTitle: params.aiAnalysis?.relationshipDynamicTitle,
      estimatedSizeBytes,
    };

    const payload: SavedWhatsAppConversationPayload = {
      id,
      extractionResult: compactExtraction,
      audioTranscripts: { ...params.audioTranscripts },
      audioTranslations: { ...params.audioTranslations },
      audioMetadata: { ...params.audioMetadata },
      aiAnalysis: params.aiAnalysis,
      dateOrderMode: params.dateOrderMode,
      sessionGapMinutes: params.sessionGapMinutes,
      analyticsBasisMode: params.analyticsBasisMode,
      customStopwords: [...params.customStopwords],
    };

    return new Promise<SavedWhatsAppConversationSummary | null>((resolve) => {
      try {
        const tx = db.transaction(
          [SUMMARIES_STORE, PAYLOADS_STORE],
          'readwrite',
        );
        tx.objectStore(SUMMARIES_STORE).put(summary);
        tx.objectStore(PAYLOADS_STORE).put(payload);
        tx.oncomplete = () => {
          this.setLastActiveConversationId(id);
          resolve(summary);
        };
        tx.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async deleteConversation(id: string): Promise<boolean> {
    const db = await this.openDb();
    if (!db) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(
          [SUMMARIES_STORE, PAYLOADS_STORE],
          'readwrite',
        );
        tx.objectStore(SUMMARIES_STORE).delete(id);
        tx.objectStore(PAYLOADS_STORE).delete(id);
        tx.oncomplete = () => {
          if (this.getLastActiveConversationId() === id) {
            this.setLastActiveConversationId(null);
          }
          resolve(true);
        };
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  async clearAllConversations(): Promise<boolean> {
    const db = await this.openDb();
    if (!db) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(
          [SUMMARIES_STORE, PAYLOADS_STORE],
          'readwrite',
        );
        tx.objectStore(SUMMARIES_STORE).clear();
        tx.objectStore(PAYLOADS_STORE).clear();
        tx.oncomplete = () => {
          this.setLastActiveConversationId(null);
          resolve(true);
        };
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  private openDb(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.resolve(null);
    }
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase | null>((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(SUMMARIES_STORE)) {
            db.createObjectStore(SUMMARIES_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(PAYLOADS_STORE)) {
            db.createObjectStore(PAYLOADS_STORE, { keyPath: 'id' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          this.dbPromise = null;
          resolve(null);
        };
      } catch {
        this.dbPromise = null;
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * Avoids duplicating base64 audio strings in both `base64Data` and `previewUrl`
   * when persisting to IndexedDB.
   */
  private dehydrateExtractionForStorage(
    ext: ArchiveExtractionResult,
  ): ArchiveExtractionResult {
    const cleanEntry = (entry: ZipMediaEntry): ZipMediaEntry => {
      if (entry.category === 'audio' && entry.base64Data) {
        const copy: ZipMediaEntry = { ...entry };
        delete copy.previewUrl;
        return copy;
      }
      return { ...entry };
    };

    return {
      ...ext,
      mediaEntries: ext.mediaEntries?.map(cleanEntry),
      extractedAudioFiles: ext.extractedAudioFiles?.map(cleanEntry),
    };
  }

  /**
   * Rebuilds `previewUrl` data URIs from `base64Data` for audio entries when
   * loading a saved conversation from IndexedDB.
   */
  private hydrateExtractionPreviewUrls(
    ext: ArchiveExtractionResult,
  ): ArchiveExtractionResult {
    const hydrateEntry = (entry: ZipMediaEntry): ZipMediaEntry => {
      if (entry.category === 'audio' && entry.base64Data && !entry.previewUrl) {
        const dataMime = (entry.mimeType || 'audio/ogg').split(';')[0];
        return {
          ...entry,
          previewUrl: `data:${dataMime};base64,${entry.base64Data}`,
        };
      }
      return entry;
    };

    return {
      ...ext,
      mediaEntries: ext.mediaEntries?.map(hydrateEntry),
      extractedAudioFiles: ext.extractedAudioFiles?.map(hydrateEntry),
    };
  }

  private estimatePayloadBytes(ext: ArchiveExtractionResult): number {
    let bytes = ext.rawText.length * 2;
    for (const m of ext.mediaEntries ?? []) {
      if (m.base64Data) {
        bytes += m.base64Data.length;
      } else if (m.previewUrl) {
        bytes += m.previewUrl.length;
      }
    }
    return bytes;
  }
}
