import { inject, Injectable } from '@angular/core';
import { n8nWebhookUrl, SiteConfigService } from '@ah/shared/site-config';
import {
  type ConceptElaborationRequest,
  type ConceptElaborationResponse,
  type AnswerEvaluationRequest,
  type AnswerEvaluationResponse,
  type GenerateRoadmapRequest,
  type GenerateRoadmapResponse,
  type GenerateSectionFlashcardsRequest,
  type GenerateSectionFlashcardsResponse,
  type GenerateSectionQuizRequest,
  type GenerateSectionQuizResponse,
  type N8nConnectionConfig,
  type N8nConnectionMode,
  type RoadmapSection,
  type SoftwareEngineeringDomain,
  type SynthesisRequest,
  type SynthesisResponse,
  validateAndParseAnswerEvaluation,
  validateAndParseElaboration,
  validateAndParseRoadmap,
  validateAndParseSectionFlashcards,
  validateAndParseSectionQuiz,
} from '@ah/products/studylm/domain';
import type {
  GenerateRequest,
  GenerateResponse,
} from '@ah/products/studylm/lessons';

export const DEFAULT_LOCAL_URL =
  'http://127.0.0.1:5678/webhook/study-synthesizer';

/**
 * Whether this page itself runs on the developer's machine. Only then may
 * StudyLM talk to an n8n on localhost: a public page that does triggers the
 * browser's Local Network Access prompt for every visitor.
 */
export function isLocalPage(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

/**
 * Generation can take a while on the free model pool: the workflow may try
 * five models in turn (25 s each on Groq, up to two 30 s tries on each
 * Gemini). Hints and answer grading are short, so a learner never waits
 * minutes for them; a ping is shorter still.
 */
const GENERATE_TIMEOUT_MS = 210_000;
const QUICK_TIMEOUT_MS = 40_000;
const PING_TIMEOUT_MS = 8_000;

/** Shown when this deployment has no AI endpoint configured. */
export const AI_UNAVAILABLE_MESSAGE =
  'The AI assistant isn’t available on this site right now. Lessons, flashcards and quizzes you already have still work.';

/**
 * A call to the AI that failed. StudyLM shows the message and a retry; it
 * never stands in made-up content (docs/studylm/learning-lab.md).
 */
export class StudyLmAiError extends Error {
  override readonly name = 'StudyLmAiError';
}

@Injectable({
  providedIn: 'root',
})
export class StudyLmApiService {
  private readonly siteConfig = inject(SiteConfigService);

  /** The tunnel comes from the deployed site config, never the source. */
  async getDefaultConfig(): Promise<N8nConnectionConfig> {
    const tunnelUrl = n8nWebhookUrl(
      await this.siteConfig.load(),
      'study-synthesizer',
    );
    const local = isLocalPage();
    // On a public page: the configured tunnel, or no AI at all. Never
    // localhost (see isLocalPage).
    const defaultMode: N8nConnectionMode = local
      ? 'local'
      : tunnelUrl !== null
        ? 'tunnel'
        : 'unavailable';
    const activeUrl =
      defaultMode === 'local'
        ? DEFAULT_LOCAL_URL
        : defaultMode === 'tunnel'
          ? (tunnelUrl as string)
          : '';

    return {
      mode: defaultMode,
      localUrl: DEFAULT_LOCAL_URL,
      tunnelUrl: tunnelUrl ?? '',
      customUrl: '',
      activeEndpoint: activeUrl,
      isConnected: false,
      isChecking: false,
    };
  }

  async testConnection(endpoint: string): Promise<{
    ok: boolean;
    latencyMs: number;
    error?: string;
    providers?: string[];
  }> {
    const start = performance.now();
    try {
      const res = await this.post(
        endpoint,
        { action: 'ping' },
        PING_TIMEOUT_MS,
        {
          retry: true,
        },
      );
      const latencyMs = Math.round(performance.now() - start);
      const data = (await res.json().catch(() => ({}))) as {
        providers?: string[];
      };
      return { ok: true, latencyMs, providers: data.providers };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      return { ok: false, latencyMs, error: describeFailure(err) };
    }
  }

  /** Rejects with a StudyLmAiError when n8n can't be reached or refuses. */
  async generateRoadmap(
    subject: string,
    domain: SoftwareEngineeringDomain = 'languages-runtimes',
    focusNotes?: string,
    endpoint?: string,
    cancel?: AbortSignal,
  ): Promise<GenerateRoadmapResponse> {
    const payload: GenerateRoadmapRequest = {
      action: 'generate_roadmap',
      subject,
      domain,
      focusNotes,
    };
    const raw = await this.request(endpoint, payload, { cancel });
    // A refused topic is an answer, not a failure: the caller shows why.
    return validateAndParseRoadmap(raw);
  }

  async generateSectionFlashcards(
    subject: string,
    domain: SoftwareEngineeringDomain,
    branchTitle: string,
    section: RoadmapSection,
    endpoint?: string,
  ): Promise<GenerateSectionFlashcardsResponse> {
    const payload: GenerateSectionFlashcardsRequest = {
      action: 'generate_section_flashcards',
      subject,
      domain,
      branchTitle,
      section: sectionPayload(section),
    };
    const parsed = validateAndParseSectionFlashcards(
      await this.request(endpoint, payload),
      section.id,
    );
    if (!parsed.success || parsed.flashcards.length === 0) {
      throw new StudyLmAiError(
        parsed.message ?? 'The AI replied without any usable flashcards.',
      );
    }
    return parsed;
  }

  async generateSectionQuiz(
    subject: string,
    domain: SoftwareEngineeringDomain,
    branchTitle: string,
    section: RoadmapSection,
    endpoint?: string,
  ): Promise<GenerateSectionQuizResponse> {
    const payload: GenerateSectionQuizRequest = {
      action: 'generate_section_quiz',
      subject,
      domain,
      branchTitle,
      section: sectionPayload(section),
    };
    const parsed = validateAndParseSectionQuiz(
      await this.request(endpoint, payload),
      section.id,
    );
    if (!parsed.success || parsed.quiz.length === 0) {
      throw new StudyLmAiError(
        parsed.message ?? 'The AI replied without any usable questions.',
      );
    }
    return parsed;
  }

  async elaborateConcept(
    request: ConceptElaborationRequest,
    endpoint?: string,
    cancel?: AbortSignal,
  ): Promise<ConceptElaborationResponse> {
    const parsed = validateAndParseElaboration(
      await this.request(endpoint, request, {
        timeoutMs: QUICK_TIMEOUT_MS,
        cancel,
      }),
      request,
    );
    if (!parsed.success) {
      throw new StudyLmAiError('The AI’s explanation could not be read.');
    }
    return parsed;
  }

  async evaluateAnswer(
    request: Omit<AnswerEvaluationRequest, 'action'>,
    endpoint?: string,
  ): Promise<AnswerEvaluationResponse> {
    const payload: AnswerEvaluationRequest = {
      action: 'evaluate_answer',
      question: request.question,
      expected: request.expected,
      answer: request.answer,
      context: request.context,
    };
    try {
      const raw = await this.request(endpoint, payload, {
        timeoutMs: QUICK_TIMEOUT_MS,
      });
      return validateAndParseAnswerEvaluation(raw, request);
    } catch {
      return validateAndParseAnswerEvaluation(null, request);
    }
  }

  async synthesize(
    request: SynthesisRequest,
    endpoint: string,
  ): Promise<SynthesisResponse> {
    const raw = await this.request(endpoint, request);
    let data: Partial<SynthesisResponse>;
    try {
      data = JSON.parse(raw) as Partial<SynthesisResponse>;
    } catch {
      throw new StudyLmAiError('The AI’s reply was not JSON.');
    }
    if (!data.overview || !data.flashcards || !data.quiz) {
      throw new StudyLmAiError(
        'The AI’s reply was missing the overview, cards or quiz.',
      );
    }
    return {
      success: true,
      provider: data.provider ?? 'n8n AI Engine (Groq LPU)',
      timestamp: data.timestamp ?? new Date().toISOString(),
      subject: request.subject,
      overview: {
        title: data.overview.title || request.subject,
        executiveSummary: data.overview.executiveSummary || '',
        keyTakeaways: data.overview.keyTakeaways || [],
      },
      flashcards: data.flashcards,
      quiz: data.quiz,
    };
  }

  /**
   * One stage of writing a lesson (generate_lesson_part). The reply's data
   * still has to pass the lessons lib's validators.
   */
  async generateLessonPart(
    request: GenerateRequest,
    endpoint: string | undefined,
    cancel: AbortSignal,
  ): Promise<GenerateResponse> {
    let text: string;
    try {
      const res = await this.post(
        requireEndpoint(endpoint),
        request,
        GENERATE_TIMEOUT_MS,
        { cancel },
      );
      text = await res.text();
    } catch (err) {
      if (cancel.aborted) throw err;
      throw err instanceof StudyLmAiError
        ? err
        : new StudyLmAiError(describeFailure(err));
    }
    let reply: Partial<GenerateResponse>;
    try {
      reply = JSON.parse(text) as Partial<GenerateResponse>;
    } catch {
      throw new StudyLmAiError('The workflow’s reply was not JSON.');
    }
    if (typeof reply.code !== 'string') {
      throw new StudyLmAiError(
        'The lesson writer isn’t available right now. Try again later; the built-in lessons work without it.',
      );
    }
    return {
      success: reply.success === true,
      code: reply.code,
      provider: reply.provider ?? 'n8n',
      specVersion: reply.specVersion ?? 0,
      data: reply.data ?? null,
      message: reply.message ?? null,
    };
  }

  /** Posts to n8n and returns the reply's text, or rejects with a StudyLmAiError. */
  private async request(
    endpoint: string | undefined,
    payload: unknown,
    {
      timeoutMs = GENERATE_TIMEOUT_MS,
      cancel,
    }: { timeoutMs?: number; cancel?: AbortSignal } = {},
  ): Promise<string> {
    try {
      const res = await this.post(
        requireEndpoint(endpoint),
        payload,
        timeoutMs,
        {
          cancel,
        },
      );
      return await res.text();
    } catch (err) {
      if (cancel?.aborted) throw err;
      throw err instanceof StudyLmAiError
        ? err
        : new StudyLmAiError(describeFailure(err));
    }
  }

  /**
   * POST to n8n. Only a ping is retried when the network drops: a generation
   * request may already have reached the server, and sending it again would
   * spend the model quota twice. A timeout or an HTTP error is final.
   */
  private async post(
    url: string,
    body: unknown,
    timeoutMs: number,
    { cancel, retry = false }: { cancel?: AbortSignal; retry?: boolean } = {},
  ): Promise<Response> {
    const send = () =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(body),
        signal: cancel
          ? AbortSignal.any([AbortSignal.timeout(timeoutMs), cancel])
          : AbortSignal.timeout(timeoutMs),
      });
    let res: Response;
    try {
      res = await send();
    } catch (err) {
      if (!retry || !(err instanceof TypeError)) throw err;
      res = await send();
    }
    if (!res.ok) {
      throw new StudyLmAiError(
        res.status === 429
          ? 'The AI assistant is busy. Wait a minute and try again.'
          : 'The AI assistant couldn’t answer this time. Try again in a moment.',
      );
    }
    return res;
  }
}

/** The endpoint to call, or the "AI unavailable" error. Never a fallback. */
function requireEndpoint(endpoint: string | undefined): string {
  if (!endpoint) throw new StudyLmAiError(AI_UNAVAILABLE_MESSAGE);
  return endpoint;
}

/** Why a call to the AI failed, in words the learner can act on. */
function describeFailure(err: unknown): string {
  if (err instanceof StudyLmAiError) return err.message;
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return 'The AI assistant took too long to answer. Try again in a moment.';
  }
  if (err instanceof TypeError) {
    return isLocalPage()
      ? 'Couldn’t reach n8n. Check that it’s running and the address in Settings.'
      : 'The AI assistant can’t be reached right now. Your lessons, flashcards and quizzes still work.';
  }
  return err instanceof Error ? err.message : 'The request failed.';
}

function sectionPayload(section: RoadmapSection) {
  return {
    id: section.id,
    code: section.code,
    title: section.title,
    summary: section.summary,
    difficultyTier: section.difficultyTier,
    subtopics: section.subtopics,
    officialDocs: section.officialDocs,
  };
}
