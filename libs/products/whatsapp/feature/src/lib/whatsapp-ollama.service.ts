import { Injectable } from '@angular/core';
import {
  AiRelationshipAnalysis,
  AiWebhookPayload,
  buildRelationshipUserPrompt,
  ChatAnalysisReport,
  normalizeAiWebhookResponse,
  RELATIONSHIP_ANALYSIS_JSON_SCHEMA,
  RELATIONSHIP_ANALYSIS_SYSTEM_PROMPT,
} from '@ah/products/whatsapp/domain';

export const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';

/** A local 7B model on CPU can take a few minutes for a long chat. */
const ANALYSIS_TIMEOUT_MS = 5 * 60_000;

interface OllamaTag {
  name: string;
  capabilities?: string[];
  details?: { parameter_size?: string };
}

/** "7.6B" → 7.6, "137M" → 0.137; unknown sizes sort last. */
function billions(tag: OllamaTag): number {
  const m = /^([\d.]+)\s*([BM])$/i.exec(tag.details?.parameter_size ?? '');
  if (!m) return 0;
  return Number(m[1]) / (m[2].toUpperCase() === 'M' ? 1000 : 1);
}

/**
 * Orders installed models for chat analysis: general chat models before
 * code-tuned ones, larger before smaller; embedding-only models are left out.
 */
export function rankOllamaChatModels(tags: readonly OllamaTag[]): string[] {
  const usable = tags.filter((t) => {
    if (t.capabilities && !t.capabilities.includes('completion')) return false;
    return !/embed/i.test(t.name);
  });
  const score = (t: OllamaTag) => (/coder|code/i.test(t.name) ? 1 : 0);
  return [...usable]
    .sort(
      (a, b) =>
        score(a) - score(b) ||
        billions(b) - billions(a) ||
        a.name.localeCompare(b.name),
    )
    .map((t) => t.name);
}

function baseUrl(url: string): string {
  return (url.trim() || DEFAULT_OLLAMA_URL).replace(/\/+$/, '');
}

@Injectable({ providedIn: 'root' })
export class WhatsAppOllamaService {
  async listModels(url: string): Promise<string[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${baseUrl(url)}/api/tags`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { models?: OllamaTag[] };
      return rankOllamaChatModels(data.models ?? []);
    } finally {
      clearTimeout(timeout);
    }
  }

  async testConnection(url: string): Promise<{
    ok: boolean;
    latencyMs: number;
    message: string;
    models: string[];
  }> {
    const start = performance.now();
    try {
      const models = await this.listModels(url);
      const latencyMs = Math.round(performance.now() - start);
      if (models.length === 0) {
        return {
          ok: false,
          latencyMs,
          models,
          message:
            'Ollama is running but has no chat model. Run: ollama pull qwen2.5:7b',
        };
      }
      return {
        ok: true,
        latencyMs,
        models,
        message: `✅ Connected to local Ollama (${latencyMs}ms) · ${models.length} model${models.length === 1 ? '' : 's'}`,
      };
    } catch {
      return {
        ok: false,
        latencyMs: 0,
        models: [],
        message: `Could not reach Ollama at ${baseUrl(url)}. Start it with "ollama serve" and allow this page's origin in OLLAMA_ORIGINS.`,
      };
    }
  }

  async runAnalysis(
    url: string,
    model: string,
    report: ChatAnalysisReport,
    payload: AiWebhookPayload,
  ): Promise<AiRelationshipAnalysis> {
    const chosen = model.trim() || (await this.listModels(url))[0];
    if (!chosen) {
      throw new Error(
        'No Ollama chat model installed. Run: ollama pull qwen2.5:7b',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);
    try {
      const res = await fetch(`${baseUrl(url)}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: chosen,
          stream: false,
          format: RELATIONSHIP_ANALYSIS_JSON_SCHEMA,
          options: { temperature: 0.2, num_ctx: 8192 },
          messages: [
            { role: 'system', content: RELATIONSHIP_ANALYSIS_SYSTEM_PROMPT },
            { role: 'user', content: buildRelationshipUserPrompt(payload) },
          ],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Ollama returned HTTP ${res.status} ${detail}`.trim());
      }
      const data = (await res.json()) as { message?: { content?: string } };
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.message?.content ?? '');
      } catch {
        throw new Error(
          `${chosen} did not return valid JSON. Try again or pick another model.`,
        );
      }
      const analysis = normalizeAiWebhookResponse(parsed, report, payload);
      return { ...analysis, provider: `Local Ollama · ${chosen}` };
    } catch (err) {
      const reason =
        err instanceof DOMException && err.name === 'AbortError'
          ? 'timed out after 5 minutes'
          : err instanceof Error
            ? err.message
            : 'request failed';
      throw new Error(`Ollama analysis failed: ${reason}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
