import { inject, Injectable } from '@angular/core';
import { n8nWebhookUrl, SiteConfigService } from '@ah/shared/site-config';
import {
  AiRelationshipAnalysis,
  AiWebhookPayload,
  AudioInsightMeta,
  ChatAnalysisReport,
  N8nWebhookSettings,
  normalizeAiWebhookResponse,
  ParsedChatMessage,
  VoiceNoteItem,
} from '@ah/products/whatsapp/domain';

export interface AudioBatchProgressEvent {
  completedCount: number;
  totalCount: number;
  currentBatch: number;
  totalBatches: number;
  percent: number;
  currentFileNames: string[];
  batchTranscripts: Record<string, string>;
  batchTranslations: Record<string, string>;
  batchMetadata: Record<string, AudioInsightMeta>;
  provider: string;
}

const STORAGE_KEY = 'ah.whatsapp.n8nSettings.v2';

export const DEFAULT_LOCAL_WEBHOOK_URL =
  'http://127.0.0.1:5678/webhook/whatsapp-analyzer';

function isLocalhost(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  );
}

export const DEFAULT_N8N_WEBHOOK_SETTINGS: N8nWebhookSettings = {
  webhookUrl: DEFAULT_LOCAL_WEBHOOK_URL,
  authHeaderName: '',
  authHeaderValue: '',
  sampleSize: 40,
  includeQuantitativeSummary: true,
  lastTestedAt: null,
  lastTestOk: null,
  lastLatencyMs: null,
};

@Injectable({ providedIn: 'root' })
export class WhatsAppAiService {
  private readonly siteConfig = inject(SiteConfigService);

  /** The public tunnel, from the deployed site config; null when none is set. */
  async tunnelWebhookUrl(): Promise<string | null> {
    return n8nWebhookUrl(await this.siteConfig.load(), 'whatsapp-analyzer');
  }

  private async defaultWebhookUrl(): Promise<string> {
    return isLocalhost()
      ? DEFAULT_LOCAL_WEBHOOK_URL
      : ((await this.tunnelWebhookUrl()) ?? DEFAULT_LOCAL_WEBHOOK_URL);
  }

  async loadSettings(): Promise<N8nWebhookSettings> {
    const defaultUrl = await this.defaultWebhookUrl();
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_N8N_WEBHOOK_SETTINGS, webhookUrl: defaultUrl };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_N8N_WEBHOOK_SETTINGS, webhookUrl: defaultUrl };
      }
      const parsed = JSON.parse(raw) as Partial<N8nWebhookSettings>;
      return {
        webhookUrl:
          typeof parsed.webhookUrl === 'string' && parsed.webhookUrl.trim()
            ? parsed.webhookUrl.trim()
            : defaultUrl,
        authHeaderName:
          typeof parsed.authHeaderName === 'string'
            ? parsed.authHeaderName
            : '',
        authHeaderValue:
          typeof parsed.authHeaderValue === 'string'
            ? parsed.authHeaderValue
            : '',
        sampleSize:
          typeof parsed.sampleSize === 'number' && parsed.sampleSize >= 10
            ? parsed.sampleSize
            : 40,
        includeQuantitativeSummary:
          typeof parsed.includeQuantitativeSummary === 'boolean'
            ? parsed.includeQuantitativeSummary
            : true,
        lastTestedAt:
          typeof parsed.lastTestedAt === 'string' ? parsed.lastTestedAt : null,
        lastTestOk:
          typeof parsed.lastTestOk === 'boolean' ? parsed.lastTestOk : null,
        lastLatencyMs:
          typeof parsed.lastLatencyMs === 'number'
            ? parsed.lastLatencyMs
            : null,
      };
    } catch {
      return { ...DEFAULT_N8N_WEBHOOK_SETTINGS, webhookUrl: defaultUrl };
    }
  }

  saveSettings(settings: N8nWebhookSettings): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }

  private buildHeaders(settings: N8nWebhookSettings): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };
    const headerName = settings.authHeaderName.trim();
    const headerValue = settings.authHeaderValue.trim();
    if (headerName && headerValue) {
      headers[headerName] = headerValue;
    }
    return headers;
  }

  async testConnection(settings: N8nWebhookSettings): Promise<{
    ok: boolean;
    latencyMs: number;
    message: string;
    providers?: string[];
  }> {
    const primaryUrl = settings.webhookUrl.trim();
    if (!primaryUrl) {
      return {
        ok: false,
        latencyMs: 0,
        message: 'Please enter a valid n8n webhook URL.',
      };
    }

    // Fall back between the local container and the tunnel.
    const tunnelUrl = await this.tunnelWebhookUrl();
    const candidates = [primaryUrl];
    if (primaryUrl === DEFAULT_LOCAL_WEBHOOK_URL && tunnelUrl) {
      candidates.push(tunnelUrl);
    } else if (primaryUrl === tunnelUrl && isLocalhost()) {
      candidates.push(DEFAULT_LOCAL_WEBHOOK_URL);
    }

    for (const url of candidates) {
      const start = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: this.buildHeaders(settings),
          body: JSON.stringify({
            action: 'ping',
            timestamp: new Date().toISOString(),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - start);

        if (response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            providers?: string[];
          };
          const providers = Array.isArray(data.providers)
            ? data.providers
            : ['Groq LPU (openai/gpt-oss-120b)'];
          const primaryProvider =
            providers[0] || 'Groq LPU (openai/gpt-oss-120b)';
          return {
            ok: true,
            latencyMs,
            providers,
            message: `✅ Connected to n8n (${latencyMs}ms) · ${primaryProvider}`,
          };
        }
      } catch {
        clearTimeout(timeoutId);
      }
    }

    return {
      ok: false,
      latencyMs: 0,
      message: `Could not reach n8n webhook at ${primaryUrl}. Ensure your n8n container and ngrok tunnel are running.`,
    };
  }

  async runWebhookAnalysis(
    settings: N8nWebhookSettings,
    report: ChatAnalysisReport,
    payload: AiWebhookPayload,
  ): Promise<AiRelationshipAnalysis> {
    const url = settings.webhookUrl.trim();
    if (!url) {
      throw new Error(
        'No n8n webhook URL configured. Open n8n Webhook Settings to set your endpoint.',
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(settings),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error(
            'Payload too large for n8n webhook. Try reducing Sample Size in Settings.',
          );
        }
        if (response.status === 429) {
          throw new Error(
            'Groq / n8n AI rate limit reached. Please wait a few seconds and try again.',
          );
        }
        throw new Error(
          `n8n webhook returned HTTP ${response.status} (${response.statusText || 'Error'})`,
        );
      }

      const rawJson: unknown = await response.json();
      return normalizeAiWebhookResponse(rawJson, report, payload);
    } catch (err) {
      clearTimeout(timeoutId);
      const reason =
        err instanceof Error
          ? err.message
          : 'Failed to connect to n8n webhook.';
      throw new Error(`n8n AI Analysis failed: ${reason}`);
    }
  }

  /**
   * Sends extracted WhatsApp voice notes (.opus/.ogg/.mp3/.m4a) in dynamically sized,
   * throttled batches to the n8n Whisper + Llama Audio Intelligence pipeline so the
   * workflow is never overloaded or rate-limited.
   *
   * Batches are dynamically constrained by payload byte size (< 750KB total per batch)
   * so large voice notes never trigger 413 / 422 JSON parsing errors in n8n or ngrok.
   */
  async transcribeVoiceNotesInBatches(
    settings: N8nWebhookSettings,
    chatTitle: string,
    voiceNotes: readonly VoiceNoteItem[],
    messages: readonly ParsedChatMessage[],
    options?: {
      batchSize?: number;
      delayBetweenBatchesMs?: number;
      signal?: AbortSignal;
      onBatchProgress?: (event: AudioBatchProgressEvent) => void;
    },
  ): Promise<{
    transcripts: Record<string, string>;
    translations: Record<string, string>;
    metadata: Record<string, AudioInsightMeta>;
    provider: string;
  }> {
    const url = settings.webhookUrl.trim();
    if (!url || voiceNotes.length === 0) {
      return {
        transcripts: {},
        translations: {},
        metadata: {},
        provider: 'None',
      };
    }

    const delayMs = Math.max(800, options?.delayBetweenBatchesMs ?? 1100);

    const msgIndexById = new Map<string, number>();
    messages.forEach((m, idx) => msgIndexById.set(m.id, idx));

    // Separate voice notes with binary audio from context-only voice notes.
    const withBinary = voiceNotes.filter((v) =>
      Boolean(v.base64Data && v.base64Data.length > 64),
    );
    const withoutBinary = voiceNotes.filter(
      (v) => !v.base64Data || v.base64Data.length <= 64,
    );

    // Dynamic payload-constrained batching:
    // Audio files > 300KB base64 are placed in their own batch (batchSize = 1).
    // Smaller audio files are grouped up to 2 items or 700KB total base64 per batch.
    const batches: VoiceNoteItem[][] = [];
    let curBinaryBatch: VoiceNoteItem[] = [];
    let curBinaryBatchSize = 0;
    const MAX_BATCH_B64_CHARS = 750_000; // ~560KB payload limit per request

    for (const vn of withBinary) {
      const rawLen = vn.base64Data?.length ?? 0;
      if (
        curBinaryBatch.length >= 2 ||
        (curBinaryBatch.length > 0 &&
          curBinaryBatchSize + rawLen > MAX_BATCH_B64_CHARS)
      ) {
        batches.push(curBinaryBatch);
        curBinaryBatch = [];
        curBinaryBatchSize = 0;
      }
      curBinaryBatch.push(vn);
      curBinaryBatchSize += rawLen;
    }
    if (curBinaryBatch.length > 0) {
      batches.push(curBinaryBatch);
    }

    // Context-only voice notes have no heavy binary audio; batch up to 5 at once.
    for (let i = 0; i < withoutBinary.length; i += 5) {
      batches.push(withoutBinary.slice(i, i + 5));
    }

    const allTranscripts: Record<string, string> = {};
    const allTranslations: Record<string, string> = {};
    const allMetadata: Record<string, AudioInsightMeta> = {};
    let lastProvider = 'Groq Whisper v3 Turbo + Llama 3.3 70B Translation';
    let completedCount = 0;
    const totalCount = voiceNotes.length;
    const totalBatches = batches.length;

    for (let bIdx = 0; bIdx < batches.length; bIdx++) {
      if (options?.signal?.aborted) {
        break;
      }

      const currentBatchNotes = batches[bIdx];
      const payloadItems = currentBatchNotes.map((vn) => {
        const idx = msgIndexById.get(vn.messageId) ?? -1;
        const before =
          idx > 0
            ? messages
                .slice(Math.max(0, idx - 3), idx)
                .map((m) => `${m.sender}: ${m.audioTranscript || m.text}`)
                .join(' | ')
            : '';
        const after =
          idx >= 0 && idx + 1 < messages.length
            ? messages
                .slice(idx + 1, Math.min(messages.length, idx + 4))
                .map((m) => `${m.sender}: ${m.audioTranscript || m.text}`)
                .join(' | ')
            : '';

        // Clean prefix and preserve full audio base64 up to ~675 KB (~3-4 minutes of Opus audio)
        const maxB64Len = 900_000;
        const rawB64 = (vn.base64Data ?? '')
          .replace(/^data:[^;]+;base64,/i, '')
          .trim();
        const safeLen = Math.floor(Math.min(rawB64.length, maxB64Len) / 4) * 4;
        const safeB64 = rawB64.slice(0, safeLen);

        return {
          fileName: vn.fileName,
          messageId: vn.messageId,
          sender: vn.sender,
          isoDate: vn.isoDate,
          durationSeconds: vn.durationSeconds,
          sizeBytes: vn.sizeBytes,
          mimeType: vn.mimeType,
          base64Data: safeB64 || undefined,
          contextBefore: before,
          contextAfter: after,
        };
      });

      // Notify UI that this batch is starting
      options?.onBatchProgress?.({
        completedCount,
        totalCount,
        currentBatch: bIdx + 1,
        totalBatches,
        percent: Math.round((completedCount / totalCount) * 100),
        currentFileNames: currentBatchNotes.map((n) => n.fileName),
        batchTranscripts: {},
        batchTranslations: {},
        batchMetadata: {},
        provider: lastProvider,
      });

      let batchResult: {
        transcripts: Record<string, string>;
        translations: Record<string, string>;
        metadata: Record<string, AudioInsightMeta>;
        provider: string;
      };

      try {
        batchResult = await this.executeSingleAudioBatchWithRetry(
          url,
          settings,
          chatTitle,
          currentBatchNotes,
          payloadItems,
          options?.signal,
        );
      } catch {
        // If an individual batch encounters a network or parsing glitch, provide a graceful
        // fallback so remaining batches in the conversation continue without interruption.
        const fallbackTranscripts: Record<string, string> = {};
        const fallbackTranslations: Record<string, string> = {};
        const fallbackMeta: Record<string, AudioInsightMeta> = {};
        for (const vn of currentBatchNotes) {
          const note = `[Voice note (${vn.durationSeconds ?? 8}s) · transcription pending]`;
          fallbackTranscripts[vn.fileName] = note;
          fallbackTranscripts[vn.fileName.toLowerCase()] = note;
          fallbackTranscripts[vn.messageId] = note;
          fallbackTranslations[vn.fileName] = note;
          fallbackTranslations[vn.fileName.toLowerCase()] = note;
          fallbackTranslations[vn.messageId] = note;
          fallbackMeta[vn.fileName] = {
            language: 'Auto',
            tone: 'Conversational',
            source: 'pending-retry',
          };
        }
        batchResult = {
          transcripts: fallbackTranscripts,
          translations: fallbackTranslations,
          metadata: fallbackMeta,
          provider: 'Offline / Pending Retry',
        };
      }

      lastProvider = batchResult.provider || lastProvider;
      Object.assign(allTranscripts, batchResult.transcripts);
      Object.assign(allTranslations, batchResult.translations);
      Object.assign(allMetadata, batchResult.metadata);
      completedCount += currentBatchNotes.length;

      options?.onBatchProgress?.({
        completedCount,
        totalCount,
        currentBatch: bIdx + 1,
        totalBatches,
        percent: Math.round((completedCount / totalCount) * 100),
        currentFileNames: currentBatchNotes.map((n) => n.fileName),
        batchTranscripts: batchResult.transcripts,
        batchTranslations: batchResult.translations,
        batchMetadata: batchResult.metadata,
        provider: lastProvider,
      });

      // Breather between batches to avoid overloading the n8n webhook or hitting Groq TPM/RPM limits
      if (bIdx + 1 < batches.length && !options?.signal?.aborted) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return {
      transcripts: allTranscripts,
      translations: allTranslations,
      metadata: allMetadata,
      provider: lastProvider,
    };
  }

  private async executeSingleAudioBatchWithRetry(
    url: string,
    settings: N8nWebhookSettings,
    chatTitle: string,
    batchNotes: readonly VoiceNoteItem[],
    payloadItems: unknown[],
    externalSignal?: AbortSignal,
  ): Promise<{
    transcripts: Record<string, string>;
    translations: Record<string, string>;
    metadata: Record<string, AudioInsightMeta>;
    provider: string;
  }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      if (externalSignal?.aborted) {
        throw new Error('Audio transcription cancelled by user.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000);
      const onExternalAbort = () => controller.abort();
      externalSignal?.addEventListener('abort', onExternalAbort, {
        once: true,
      });

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: this.buildHeaders(settings),
          body: JSON.stringify({
            action: 'transcribe_whatsapp_audio',
            chatTitle,
            audioFiles: payloadItems,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', onExternalAbort);

        if (!response.ok) {
          throw new Error(
            `n8n audio transcription returned HTTP ${response.status}`,
          );
        }

        const raw = (await response.json()) as {
          provider?: string;
          transcripts?: Record<string, string>;
          translations?: Record<string, string>;
          details?: Record<
            string,
            {
              transcript?: string;
              translation?: string;
              language?: string;
              tone?: string;
              source?: string;
            }
          >;
        };

        const rawTranscripts =
          raw && typeof raw.transcripts === 'object' && raw.transcripts !== null
            ? raw.transcripts
            : {};
        const rawTranslations =
          raw &&
          typeof raw.translations === 'object' &&
          raw.translations !== null
            ? raw.translations
            : {};
        const rawDetails =
          raw && typeof raw.details === 'object' && raw.details !== null
            ? raw.details
            : {};

        const normalizedTranscripts: Record<string, string> = {};
        const normalizedTranslations: Record<string, string> = {};
        const normalizedMeta: Record<string, AudioInsightMeta> = {};

        for (const vn of batchNotes) {
          const lowerFile = vn.fileName.toLowerCase();
          const directTranscript =
            rawTranscripts[vn.fileName] ??
            rawTranscripts[vn.messageId] ??
            Object.entries(rawTranscripts).find(
              ([k]) => k.toLowerCase() === lowerFile,
            )?.[1];

          const directTranslation =
            rawTranslations[vn.fileName] ??
            rawTranslations[vn.messageId] ??
            Object.entries(rawTranslations).find(
              ([k]) => k.toLowerCase() === lowerFile,
            )?.[1];

          const directDetail =
            rawDetails[vn.fileName] ??
            rawDetails[vn.messageId] ??
            Object.entries(rawDetails).find(
              ([k]) => k.toLowerCase() === lowerFile,
            )?.[1];

          if (
            typeof directTranscript === 'string' &&
            directTranscript.trim().length > 0
          ) {
            const cleanT = directTranscript.trim();
            normalizedTranscripts[vn.fileName] = cleanT;
            normalizedTranscripts[lowerFile] = cleanT;
            normalizedTranscripts[vn.messageId] = cleanT;
          }

          if (
            typeof directTranslation === 'string' &&
            directTranslation.trim().length > 0
          ) {
            const cleanTr = directTranslation.trim();
            normalizedTranslations[vn.fileName] = cleanTr;
            normalizedTranslations[lowerFile] = cleanTr;
            normalizedTranslations[vn.messageId] = cleanTr;
          }

          if (directDetail && typeof directDetail === 'object') {
            const metaObj: AudioInsightMeta = {
              language: directDetail.language || 'Auto',
              tone: directDetail.tone || 'Conversational',
              source: directDetail.source || 'whisper+llm',
            };
            normalizedMeta[vn.fileName] = metaObj;
            normalizedMeta[lowerFile] = metaObj;
            normalizedMeta[vn.messageId] = metaObj;
          }
        }

        return {
          transcripts: normalizedTranscripts,
          translations: normalizedTranslations,
          metadata: normalizedMeta,
          provider:
            raw.provider || 'Groq Whisper v3 Turbo + Llama 3.3 70B Translation',
        };
      } catch (err) {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', onExternalAbort);
        lastError =
          err instanceof Error
            ? err
            : new Error('Audio batch transcription failed.');
        if (attempt === 0 && !externalSignal?.aborted) {
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    }

    throw lastError ?? new Error('Audio batch transcription failed.');
  }
}
