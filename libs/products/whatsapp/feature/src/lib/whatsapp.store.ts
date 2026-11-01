import { computed, inject } from '@angular/core';
import {
  AiRelationshipAnalysis,
  AnalyticsBasisMode,
  analyzeWhatsAppChat,
  appendMediaFilesToExtraction,
  ArchiveExtractionResult,
  AudioInsightMeta,
  buildAiWebhookPayload,
  buildMediaEntriesFromFiles,
  ChatAnalysisReport,
  DateOrderMode,
  enrichMessageMetrics,
  extractTranscriptFromZip,
  ingestPlainTextTranscript,
  isZipBuffer,
  N8nWebhookSettings,
  ParsedChatMessage,
  ParseTranscriptResult,
  parseWhatsAppTranscript,
  TimelinePoint,
  VoiceNoteItem,
} from '@ah/products/whatsapp/domain';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  DEFAULT_LOCAL_WEBHOOK_URL,
  DEFAULT_N8N_WEBHOOK_SETTINGS,
  WhatsAppAiService,
} from './whatsapp-ai.service';
import {
  SavedWhatsAppConversationSummary,
  WhatsappArchiveDbService,
} from './whatsapp-archive-db.service';

export type WhatsAppDashboardTab =
  | 'overview'
  | 'media'
  | 'dynamics'
  | 'lexical'
  | 'heatmap'
  | 'wrapped'
  | 'ai-insights'
  | 'transcript';

export type TranscriptTypeFilter =
  'all' | 'multiline' | 'media' | 'audio' | 'questions' | 'links';

export interface AudioTranscriptionProgressState {
  completed: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  percent: number;
  currentFiles: string[];
  provider: string;
}

export interface WhatsAppState {
  activeConversationId: string | null;
  savedConversations: SavedWhatsAppConversationSummary[];
  isVaultModalOpen: boolean;
  isLoadingVault: boolean;
  lastSavedAtIso: string | null;
  extractionResult: ArchiveExtractionResult | null;
  dateOrderMode: DateOrderMode;
  sessionGapMinutes: number;
  customStopwords: string[];
  audioTranscripts: Record<string, string>;
  audioTranslations: Record<string, string>;
  audioMetadata: Record<string, AudioInsightMeta>;
  analyticsBasisMode: AnalyticsBasisMode;
  isTranscribingAudio: boolean;
  audioTranscriptionStatus: string | null;
  audioTranscriptionProgress: AudioTranscriptionProgressState | null;
  activeTab: WhatsAppDashboardTab;
  timelineGranularity: 'daily' | 'monthly';
  transcriptSearch: string;
  transcriptParticipantFilter: string;
  transcriptTypeFilter: TranscriptTypeFilter;
  webhookSettings: N8nWebhookSettings;
  isSettingsOpen: boolean;
  isTestingWebhook: boolean;
  webhookTestStatus: string | null;
  isAnalyzingAi: boolean;
  aiAnalysis: AiRelationshipAnalysis | null;
  aiError: string | null;
  showPayloadInspector: boolean;
  isDraggingFile: boolean;
  isIngestingFile: boolean;
  ingestionError: string | null;
  copiedBadge: string | null;
}

const initialState: WhatsAppState = {
  activeConversationId: null,
  savedConversations: [],
  isVaultModalOpen: false,
  isLoadingVault: false,
  lastSavedAtIso: null,
  extractionResult: null,
  dateOrderMode: 'auto',
  sessionGapMinutes: 180,
  customStopwords: [],
  audioTranscripts: {},
  audioTranslations: {},
  audioMetadata: {},
  analyticsBasisMode: 'text_and_audio',
  isTranscribingAudio: false,
  audioTranscriptionStatus: null,
  audioTranscriptionProgress: null,
  activeTab: 'overview',
  timelineGranularity: 'daily',
  transcriptSearch: '',
  transcriptParticipantFilter: 'ALL',
  transcriptTypeFilter: 'all',
  webhookSettings: { ...DEFAULT_N8N_WEBHOOK_SETTINGS },
  isSettingsOpen: false,
  isTestingWebhook: false,
  webhookTestStatus: null,
  isAnalyzingAi: false,
  aiAnalysis: null,
  aiError: null,
  showPayloadInspector: false,
  isDraggingFile: false,
  isIngestingFile: false,
  ingestionError: null,
  copiedBadge: null,
};

export const WhatsAppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => {
    const hasChatLoaded = computed(() => store.extractionResult() !== null);

    const parsedTranscript = computed<ParseTranscriptResult | null>(() => {
      const ext = store.extractionResult();
      if (!ext) {
        return null;
      }
      const parsed = parseWhatsAppTranscript(
        ext.rawText,
        store.dateOrderMode(),
      );
      const transcripts = store.audioTranscripts();
      const translations = store.audioTranslations();
      const metadata = store.audioMetadata();
      const zipAudioList = ext.extractedAudioFiles ?? [];
      let unlinkedAudioIdx = 0;

      for (const msg of parsed.messages) {
        if (
          msg.mediaCategory === 'audio' &&
          !msg.attachedFileName &&
          unlinkedAudioIdx < zipAudioList.length
        ) {
          msg.attachedFileName = zipAudioList[unlinkedAudioIdx].fileName;
          msg.audioDurationSeconds =
            zipAudioList[unlinkedAudioIdx].durationSeconds;
          unlinkedAudioIdx++;
        }
        const fKey = msg.attachedFileName ?? '';
        const lowerKey = fKey.toLowerCase();
        const t =
          (fKey ? (transcripts[fKey] ?? transcripts[lowerKey]) : undefined) ??
          transcripts[msg.id];
        const tr =
          (fKey ? (translations[fKey] ?? translations[lowerKey]) : undefined) ??
          translations[msg.id];
        const meta =
          (fKey ? (metadata[fKey] ?? metadata[lowerKey]) : undefined) ??
          metadata[msg.id];

        if (t && t.trim().length > 0) {
          msg.audioTranscript = t.trim();
          if (tr && tr.trim().length > 0) {
            msg.audioTranslation = tr.trim();
          }
          if (meta?.language) {
            msg.audioLanguage = meta.language;
          }
          if (meta?.tone) {
            msg.audioTone = meta.tone;
          }
          if (store.analyticsBasisMode() === 'text_and_audio') {
            enrichMessageMetrics(msg);
          }
        }
      }
      return parsed;
    });

    const report = computed<ChatAnalysisReport | null>(() => {
      const ext = store.extractionResult();
      if (!ext) {
        return null;
      }
      return analyzeWhatsAppChat(ext, {
        dateOrderMode: store.dateOrderMode(),
        sessionGapMinutes: store.sessionGapMinutes(),
        customStopwords: store.customStopwords(),
        audioTranscripts: store.audioTranscripts(),
        audioTranslations: store.audioTranslations(),
        audioMetadata: store.audioMetadata(),
        analyticsBasisMode: store.analyticsBasisMode(),
      });
    });

    const aiPayload = computed(() => {
      const rep = report();
      const parsed = parsedTranscript();
      if (!rep || !parsed) {
        return null;
      }
      return buildAiWebhookPayload(
        rep,
        parsed.messages,
        store.webhookSettings().sampleSize,
      );
    });

    const timelinePoints = computed<TimelinePoint[]>(() => {
      const r = report();
      if (!r) {
        return [];
      }
      return store.timelineGranularity() === 'monthly'
        ? r.streaksAndTimeline.monthlyTimeline
        : r.streaksAndTimeline.dailyTimeline;
    });

    const filteredTranscriptMessages = computed<ParsedChatMessage[]>(() => {
      const parsed = parsedTranscript();
      if (!parsed) {
        return [];
      }
      const all = parsed.messages;
      const query = store.transcriptSearch().trim().toLowerCase();
      const participant = store.transcriptParticipantFilter();
      const typeFilter = store.transcriptTypeFilter();

      return all.filter((m) => {
        if (participant !== 'ALL' && m.sender !== participant) {
          return false;
        }
        if (typeFilter === 'multiline' && !m.isMultiline) {
          return false;
        }
        if (typeFilter === 'media' && !m.isMedia && !m.isDeleted) {
          return false;
        }
        if (typeFilter === 'audio' && m.mediaCategory !== 'audio') {
          return false;
        }
        if (typeFilter === 'questions' && !m.isQuestion) {
          return false;
        }
        if (typeFilter === 'links' && !m.hasLink) {
          return false;
        }
        if (
          query &&
          !m.text.toLowerCase().includes(query) &&
          !(m.audioTranscript ?? '').toLowerCase().includes(query) &&
          !(m.audioTranslation ?? '').toLowerCase().includes(query) &&
          !m.sender.toLowerCase().includes(query) &&
          !m.isoDate.includes(query)
        ) {
          return false;
        }
        return true;
      });
    });

    return {
      hasChatLoaded,
      parsedTranscript,
      report,
      aiPayload,
      timelinePoints,
      filteredTranscriptMessages,
    };
  }),
  withMethods(
    (
      store,
      aiService = inject(WhatsAppAiService),
      archiveDb = inject(WhatsappArchiveDbService),
    ) => {
      let activeAudioAbortController: AbortController | null = null;
      let persistDebounceTimer: ReturnType<typeof setTimeout> | null = null;

      const persistCurrentConversation = async (): Promise<void> => {
        const ext = store.extractionResult();
        const rep = store.report();
        if (!ext || !rep) {
          return;
        }

        const existingId = store.activeConversationId();
        const existingRecord = existingId
          ? store.savedConversations().find((c) => c.id === existingId)
          : undefined;

        const savedSummary = await archiveDb.saveConversation({
          id: existingId,
          report: rep,
          extractionResult: ext,
          audioTranscripts: store.audioTranscripts(),
          audioTranslations: store.audioTranslations(),
          audioMetadata: store.audioMetadata(),
          aiAnalysis: store.aiAnalysis(),
          dateOrderMode: store.dateOrderMode(),
          sessionGapMinutes: store.sessionGapMinutes(),
          analyticsBasisMode: store.analyticsBasisMode(),
          customStopwords: store.customStopwords(),
          existingCreatedAtIso: existingRecord?.createdAtIso ?? null,
        });

        if (savedSummary) {
          const others = store
            .savedConversations()
            .filter((c) => c.id !== savedSummary.id);
          const nextList = [savedSummary, ...others].sort(
            (a, b) => b.updatedAtMs - a.updatedAtMs,
          );
          patchState(store, {
            activeConversationId: savedSummary.id,
            lastSavedAtIso: savedSummary.updatedAtIso,
            savedConversations: nextList,
          });
        }
      };

      const schedulePersistCurrentConversation = (delayMs = 350): void => {
        if (persistDebounceTimer) {
          clearTimeout(persistDebounceTimer);
        }
        persistDebounceTimer = setTimeout(() => {
          persistDebounceTimer = null;
          void persistCurrentConversation();
        }, delayMs);
      };

      const runBatchAudioTranscription = async (
        onlyUntranscribed = false,
        customSlice?: readonly VoiceNoteItem[],
      ): Promise<void> => {
        const rep = store.report();
        const parsed = store.parsedTranscript();
        if (!rep || !parsed) {
          return;
        }

        const allVoiceNotes = customSlice ?? rep.mediaAnalytics.voiceNotes;
        const targetVoiceNotes = onlyUntranscribed
          ? allVoiceNotes.filter((v) => !v.transcript || !v.transcript.trim())
          : allVoiceNotes;

        if (targetVoiceNotes.length === 0) {
          return;
        }

        if (activeAudioAbortController) {
          activeAudioAbortController.abort();
        }
        activeAudioAbortController = new AbortController();
        const signal = activeAudioAbortController.signal;

        const batchSize = 2;
        const totalBatches = Math.max(
          1,
          Math.ceil(targetVoiceNotes.length / batchSize),
        );

        patchState(store, {
          isTranscribingAudio: true,
          analyticsBasisMode: 'text_and_audio',
          audioTranscriptionProgress: {
            completed: 0,
            total: targetVoiceNotes.length,
            currentBatch: 1,
            totalBatches,
            percent: 0,
            currentFiles: targetVoiceNotes
              .slice(0, batchSize)
              .map((v) => v.fileName),
            provider: 'Groq Whisper v3 Turbo + Llama 3.3 70B Translation',
          },
          audioTranscriptionStatus: `🎙️ Preparing audio batch pipeline · Transcribing & translating ${targetVoiceNotes.length} voice note(s)...`,
        });

        try {
          const res = await aiService.transcribeVoiceNotesInBatches(
            store.webhookSettings(),
            rep.chatTitle,
            targetVoiceNotes,
            parsed.messages,
            {
              batchSize,
              delayBetweenBatchesMs: 1100,
              signal,
              onBatchProgress: (ev) => {
                const hasNew = Object.keys(ev.batchTranscripts).length > 0;
                const nextTranscripts = hasNew
                  ? { ...store.audioTranscripts(), ...ev.batchTranscripts }
                  : store.audioTranscripts();
                const nextTranslations = hasNew
                  ? { ...store.audioTranslations(), ...ev.batchTranslations }
                  : store.audioTranslations();
                const nextMetadata = hasNew
                  ? { ...store.audioMetadata(), ...ev.batchMetadata }
                  : store.audioMetadata();

                patchState(store, {
                  audioTranscripts: nextTranscripts,
                  audioTranslations: nextTranslations,
                  audioMetadata: nextMetadata,
                  audioTranscriptionProgress: {
                    completed: ev.completedCount,
                    total: ev.totalCount,
                    currentBatch: ev.currentBatch,
                    totalBatches: ev.totalBatches,
                    percent: ev.percent,
                    currentFiles: ev.currentFileNames,
                    provider: ev.provider,
                  },
                  audioTranscriptionStatus: `🎙️ Batch ${ev.currentBatch}/${ev.totalBatches} (${ev.completedCount}/${ev.totalCount} · ${ev.percent}%) — Transcribing & translating via ${ev.provider}...`,
                });

                if (hasNew) {
                  void persistCurrentConversation();
                }
              },
            },
          );

          const updatedReport = store.report();
          const transcribedCount =
            updatedReport?.mediaAnalytics.transcribedVoiceNoteCount ?? 0;
          const wordsAdded =
            updatedReport?.mediaAnalytics.transcribedWordsAdded ?? 0;

          patchState(store, {
            isTranscribingAudio: false,
            audioTranscriptionProgress: null,
            audioTranscriptionStatus: signal.aborted
              ? `⏹️ Batch transcription paused (${transcribedCount}/${allVoiceNotes.length} voice notes transcribed · +${wordsAdded.toLocaleString()} spoken words in stats).`
              : `✅ Transcribed & translated ${transcribedCount}/${allVoiceNotes.length} voice notes via ${res.provider} (+${wordsAdded.toLocaleString()} spoken words merged into analytics)!`,
          });
          await persistCurrentConversation();
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to transcribe voice notes.';
          patchState(store, {
            isTranscribingAudio: false,
            audioTranscriptionProgress: null,
            audioTranscriptionStatus: `⚠️ ${msg}`,
          });
        } finally {
          activeAudioAbortController = null;
        }
      };

      const ingestFilesInternal = async (
        files: readonly File[],
      ): Promise<void> => {
        if (!files || files.length === 0) {
          return;
        }

        if (activeAudioAbortController) {
          activeAudioAbortController.abort();
          activeAudioAbortController = null;
        }

        patchState(store, {
          isIngestingFile: true,
          isDraggingFile: false,
          ingestionError: null,
        });

        try {
          let zipFileCandidate: { file: File; buffer: ArrayBuffer } | null =
            null;
          const txtCandidates: Array<{ file: File; text: string }> = [];
          const mediaCandidates: Array<{ name: string; buffer: ArrayBuffer }> =
            [];

          for (const f of files) {
            const lower = f.name.toLowerCase();
            if (lower.startsWith('.') || lower.endsWith('.ds_store')) {
              continue;
            }

            const buffer = await f.arrayBuffer();
            if (lower.endsWith('.zip') || isZipBuffer(buffer)) {
              zipFileCandidate = { file: f, buffer };
              break;
            }

            if (lower.endsWith('.txt') || f.type === 'text/plain') {
              const text = new TextDecoder('utf-8', { fatal: false }).decode(
                buffer,
              );
              txtCandidates.push({ file: f, text });
            } else {
              if (files.length === 1) {
                const maybeText = new TextDecoder('utf-8', {
                  fatal: false,
                }).decode(buffer);
                const probe = parseWhatsAppTranscript(
                  maybeText.slice(0, 8000),
                  'auto',
                );
                if (probe.messages.length > 0) {
                  txtCandidates.push({ file: f, text: maybeText });
                  continue;
                }
              }
              mediaCandidates.push({ name: f.name, buffer });
            }
          }

          let extraction: ArchiveExtractionResult;
          // Media dropped on its own attaches to the chat already loaded.
          const loaded = store.extractionResult();

          if (zipFileCandidate) {
            extraction = await extractTranscriptFromZip(
              zipFileCandidate.buffer,
              zipFileCandidate.file.name,
            );
            if (mediaCandidates.length > 0) {
              extraction = appendMediaFilesToExtraction(
                extraction,
                mediaCandidates,
              );
            }
          } else if (txtCandidates.length > 0) {
            txtCandidates.sort((a, b) => {
              const aLower = a.file.name.toLowerCase();
              const bLower = b.file.name.toLowerCase();
              const aScore =
                aLower === '_chat.txt' || aLower.startsWith('whatsapp') ? 1 : 0;
              const bScore =
                bLower === '_chat.txt' || bLower.startsWith('whatsapp') ? 1 : 0;
              if (aScore !== bScore) return bScore - aScore;
              return b.text.length - a.text.length;
            });

            const primaryTxt = txtCandidates[0];
            extraction = ingestPlainTextTranscript(
              primaryTxt.text,
              primaryTxt.file.name,
              'txt',
            );

            if (mediaCandidates.length > 0) {
              const builtMedia = buildMediaEntriesFromFiles(mediaCandidates);
              extraction = {
                ...extraction,
                sourceType: 'zip',
                skippedMediaFiles: builtMedia.skippedMediaFiles,
                skippedMediaCount: builtMedia.skippedMediaFiles.length,
                totalZipEntries: 1 + builtMedia.skippedMediaFiles.length,
                mediaEntries: builtMedia.mediaEntries,
                extractedAudioFiles: builtMedia.extractedAudioFiles,
                totalMediaBytes: builtMedia.totalMediaBytes,
              };
            }
          } else if (mediaCandidates.length > 0 && loaded) {
            const updatedExtraction = appendMediaFilesToExtraction(
              loaded,
              mediaCandidates,
            );
            patchState(store, {
              extractionResult: updatedExtraction,
              activeTab: 'media',
              isIngestingFile: false,
              ingestionError: null,
            });
            await persistCurrentConversation();
            const repAfterAttach = store.report();
            if (
              repAfterAttach &&
              repAfterAttach.mediaAnalytics.voiceNotes.length > 0
            ) {
              void runBatchAudioTranscription(true);
            }
            return;
          } else {
            throw new Error(
              `No WhatsApp chat transcript (.txt or .zip) found in the selected file(s). When uploading from Google Drive, select either the exported .zip archive, OR select the "WhatsApp Chat.txt" file together with your media/audio files.`,
            );
          }

          const testParse = parseWhatsAppTranscript(extraction.rawText, 'auto');
          if (testParse.messages.length === 0) {
            throw new Error(
              `No valid WhatsApp messages found in "${extraction.transcriptFileName}". Ensure the file is an exported WhatsApp chat transcript.`,
            );
          }

          patchState(store, {
            activeConversationId: null,
            extractionResult: extraction,
            audioTranscripts: {},
            audioTranslations: {},
            audioMetadata: {},
            analyticsBasisMode: 'text_and_audio',
            isTranscribingAudio: false,
            audioTranscriptionStatus: null,
            audioTranscriptionProgress: null,
            aiAnalysis: null,
            aiError: null,
            dateOrderMode: 'auto',
            transcriptParticipantFilter: 'ALL',
            activeTab: 'overview',
            isIngestingFile: false,
            ingestionError: null,
          });

          await persistCurrentConversation();

          const currentReport = store.report();
          if (
            currentReport &&
            currentReport.mediaAnalytics.voiceNotes.length > 0
          ) {
            void runBatchAudioTranscription(false);
          }
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to parse WhatsApp export file.';
          patchState(store, {
            isIngestingFile: false,
            ingestionError: msg,
          });
        }
      };

      return {
        setActiveTab(tab: WhatsAppDashboardTab): void {
          patchState(store, { activeTab: tab });
        },

        setDateOrderMode(mode: DateOrderMode): void {
          patchState(store, { dateOrderMode: mode });
          schedulePersistCurrentConversation(200);
        },

        setSessionGapMinutes(minutes: number): void {
          patchState(store, { sessionGapMinutes: minutes });
          schedulePersistCurrentConversation(200);
        },

        setAnalyticsBasisMode(mode: AnalyticsBasisMode): void {
          patchState(store, { analyticsBasisMode: mode });
          schedulePersistCurrentConversation(200);
        },

        setTimelineGranularity(granularity: 'daily' | 'monthly'): void {
          patchState(store, { timelineGranularity: granularity });
        },

        addCustomStopword(rawWord: string): void {
          const cleaned = rawWord.trim().toLowerCase();
          if (!cleaned || cleaned.length < 2) {
            return;
          }
          const existing = store.customStopwords();
          if (!existing.includes(cleaned)) {
            patchState(store, { customStopwords: [...existing, cleaned] });
            schedulePersistCurrentConversation(250);
          }
        },

        removeCustomStopword(word: string): void {
          patchState(store, {
            customStopwords: store.customStopwords().filter((w) => w !== word),
          });
          schedulePersistCurrentConversation(250);
        },

        clearCustomStopwords(): void {
          patchState(store, { customStopwords: [] });
          schedulePersistCurrentConversation(250);
        },

        setTranscriptSearch(query: string): void {
          patchState(store, { transcriptSearch: query });
        },

        setTranscriptParticipantFilter(sender: string): void {
          patchState(store, { transcriptParticipantFilter: sender });
        },

        setTranscriptTypeFilter(filter: TranscriptTypeFilter): void {
          patchState(store, { transcriptTypeFilter: filter });
        },

        setDraggingFile(isDragging: boolean): void {
          patchState(store, { isDraggingFile: isDragging });
        },

        clearChat(): void {
          if (activeAudioAbortController) {
            activeAudioAbortController.abort();
            activeAudioAbortController = null;
          }
          archiveDb.setLastActiveConversationId(null);
          patchState(store, {
            activeConversationId: null,
            extractionResult: null,
            audioTranscripts: {},
            audioTranslations: {},
            audioMetadata: {},
            analyticsBasisMode: 'text_and_audio',
            isTranscribingAudio: false,
            audioTranscriptionStatus: null,
            audioTranscriptionProgress: null,
            aiAnalysis: null,
            aiError: null,
            ingestionError: null,
            transcriptSearch: '',
            transcriptParticipantFilter: 'ALL',
            transcriptTypeFilter: 'all',
            activeTab: 'overview',
          });
        },

        openVaultModal(): void {
          patchState(store, { isVaultModalOpen: true });
        },

        closeVaultModal(): void {
          patchState(store, { isVaultModalOpen: false });
        },

        async refreshSavedConversations(): Promise<void> {
          patchState(store, { isLoadingVault: true });
          const summaries = await archiveDb.listSummaries();
          patchState(store, {
            savedConversations: summaries,
            isLoadingVault: false,
          });
        },

        async openSavedConversation(id: string): Promise<void> {
          if (activeAudioAbortController) {
            activeAudioAbortController.abort();
            activeAudioAbortController = null;
          }
          patchState(store, { isLoadingVault: true, ingestionError: null });
          const full = await archiveDb.loadConversation(id);
          if (!full) {
            patchState(store, {
              isLoadingVault: false,
              ingestionError:
                'Could not load saved conversation from IndexedDB.',
            });
            return;
          }

          archiveDb.setLastActiveConversationId(id);
          const { summary, payload } = full;

          patchState(store, {
            activeConversationId: summary.id,
            lastSavedAtIso: summary.updatedAtIso,
            extractionResult: payload.extractionResult,
            audioTranscripts: payload.audioTranscripts ?? {},
            audioTranslations: payload.audioTranslations ?? {},
            audioMetadata: payload.audioMetadata ?? {},
            aiAnalysis: payload.aiAnalysis ?? null,
            dateOrderMode: payload.dateOrderMode ?? 'auto',
            sessionGapMinutes: payload.sessionGapMinutes ?? 180,
            analyticsBasisMode: payload.analyticsBasisMode ?? 'text_and_audio',
            customStopwords: payload.customStopwords ?? [],
            isTranscribingAudio: false,
            audioTranscriptionProgress: null,
            audioTranscriptionStatus:
              summary.transcribedVoiceNotes > 0
                ? `🗄️ Restored from IndexedDB Vault (${summary.transcribedVoiceNotes}/${summary.totalVoiceNotes} voice notes transcribed · +${summary.spokenWordsAdded.toLocaleString()} spoken words)`
                : null,
            aiError: null,
            transcriptSearch: '',
            transcriptParticipantFilter: 'ALL',
            transcriptTypeFilter: 'all',
            isVaultModalOpen: false,
            isLoadingVault: false,
          });
        },

        async deleteSavedConversation(id: string): Promise<void> {
          const ok = await archiveDb.deleteConversation(id);
          if (!ok) {
            return;
          }
          const nextList = store
            .savedConversations()
            .filter((c) => c.id !== id);
          patchState(store, { savedConversations: nextList });

          if (store.activeConversationId() === id) {
            this.clearChat();
          }
        },

        async clearAllSavedConversations(): Promise<void> {
          const ok = await archiveDb.clearAllConversations();
          if (!ok) {
            return;
          }
          patchState(store, { savedConversations: [] });
          if (store.activeConversationId()) {
            this.clearChat();
          }
        },

        updateVoiceNoteTranscript(key: string, transcript: string): void {
          const cleaned = transcript.trim();
          const next = { ...store.audioTranscripts() };
          if (cleaned) {
            next[key] = cleaned;
            next[key.toLowerCase()] = cleaned;
          } else {
            delete next[key];
            delete next[key.toLowerCase()];
          }
          patchState(store, { audioTranscripts: next });
          schedulePersistCurrentConversation(400);
        },

        updateVoiceNoteTranslation(key: string, translation: string): void {
          const cleaned = translation.trim();
          const next = { ...store.audioTranslations() };
          if (cleaned) {
            next[key] = cleaned;
            next[key.toLowerCase()] = cleaned;
          } else {
            delete next[key];
            delete next[key.toLowerCase()];
          }
          patchState(store, { audioTranslations: next });
          schedulePersistCurrentConversation(400);
        },

        async transcribeAllVoiceNotes(
          onlyUntranscribed = false,
        ): Promise<void> {
          await runBatchAudioTranscription(onlyUntranscribed);
        },

        async transcribeVoiceNotesSlice(
          slice: readonly VoiceNoteItem[],
        ): Promise<void> {
          await runBatchAudioTranscription(false, slice);
        },

        cancelAudioTranscription(): void {
          if (activeAudioAbortController) {
            activeAudioAbortController.abort();
          }
        },

        async ingestUploadedFile(file: File): Promise<void> {
          await ingestFilesInternal([file]);
        },

        async ingestUploadedFiles(files: readonly File[]): Promise<void> {
          await ingestFilesInternal(files);
        },

        openSettingsModal(): void {
          patchState(store, { isSettingsOpen: true });
        },

        closeSettingsModal(): void {
          patchState(store, { isSettingsOpen: false });
        },

        async setWebhookEndpointPreset(
          preset: 'tunnel' | 'local',
        ): Promise<void> {
          // Without a configured tunnel the field empties for the user's own URL.
          const url =
            preset === 'local'
              ? DEFAULT_LOCAL_WEBHOOK_URL
              : ((await aiService.tunnelWebhookUrl()) ?? '');
          const updated: N8nWebhookSettings = {
            ...store.webhookSettings(),
            webhookUrl: url,
          };
          aiService.saveSettings(updated);
          patchState(store, { webhookSettings: updated });
        },

        updateWebhookSettings(partial: Partial<N8nWebhookSettings>): void {
          const updated: N8nWebhookSettings = {
            ...store.webhookSettings(),
            ...partial,
          };
          aiService.saveSettings(updated);
          patchState(store, { webhookSettings: updated });
        },

        async testWebhookConnection(): Promise<void> {
          patchState(store, {
            isTestingWebhook: true,
            webhookTestStatus: 'Pinging n8n webhook endpoint...',
          });
          const result = await aiService.testConnection(
            store.webhookSettings(),
          );
          const updatedSettings: N8nWebhookSettings = {
            ...store.webhookSettings(),
            lastTestedAt: new Date().toISOString(),
            lastTestOk: result.ok,
            lastLatencyMs: result.latencyMs,
          };
          aiService.saveSettings(updatedSettings);
          patchState(store, {
            webhookSettings: updatedSettings,
            isTestingWebhook: false,
            webhookTestStatus: result.message,
          });
        },

        async triggerN8nAiAnalysis(): Promise<void> {
          const rep = store.report();
          const payload = store.aiPayload();
          if (!rep || !payload) {
            return;
          }

          patchState(store, {
            isAnalyzingAi: true,
            aiError: null,
            activeTab: 'ai-insights',
          });

          try {
            const analysis = await aiService.runWebhookAnalysis(
              store.webhookSettings(),
              rep,
              payload,
            );
            patchState(store, {
              isAnalyzingAi: false,
              aiAnalysis: analysis,
              aiError: null,
              webhookSettings: {
                ...store.webhookSettings(),
                lastTestOk: true,
                lastTestedAt: new Date().toISOString(),
              },
            });
            await persistCurrentConversation();
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : 'n8n AI analysis failed.';
            patchState(store, {
              isAnalyzingAi: false,
              aiError: msg,
            });
          }
        },

        togglePayloadInspector(): void {
          patchState(store, {
            showPayloadInspector: !store.showPayloadInspector(),
          });
        },

        async copyTextToClipboard(
          text: string,
          badgeLabel: string,
        ): Promise<void> {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
              await navigator.clipboard.writeText(text);
              patchState(store, { copiedBadge: badgeLabel });
              setTimeout(() => {
                if (store.copiedBadge() === badgeLabel) {
                  patchState(store, { copiedBadge: null });
                }
              }, 2400);
            } catch {
              // Ignore clipboard errors
            }
          }
        },
      };
    },
  ),
  withHooks({
    onInit(
      store,
      aiService = inject(WhatsAppAiService),
      archiveDb = inject(WhatsappArchiveDbService),
    ) {
      // The default webhook depends on site config, so settings load async.
      void aiService.loadSettings().then(async (savedSettings) => {
        patchState(store, { webhookSettings: savedSettings });
        if (typeof window === 'undefined') {
          return;
        }
        const res = await aiService.testConnection(savedSettings);
        const updated: N8nWebhookSettings = {
          ...store.webhookSettings(),
          lastTestedAt: new Date().toISOString(),
          lastTestOk: res.ok,
          lastLatencyMs: res.latencyMs,
        };
        aiService.saveSettings(updated);
        patchState(store, {
          webhookSettings: updated,
          webhookTestStatus: res.message,
        });
      });
      if (typeof window !== 'undefined') {
        void (async () => {
          const summaries = await archiveDb.listSummaries();
          patchState(store, { savedConversations: summaries });
          const lastActiveId = archiveDb.getLastActiveConversationId();
          if (
            lastActiveId &&
            summaries.some((s) => s.id === lastActiveId) &&
            !store.extractionResult()
          ) {
            await store.openSavedConversation(lastActiveId);
          }
        })();
      }
    },
  }),
);
