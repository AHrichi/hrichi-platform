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
 * Generation can take a while on the free model pool: the workflow may try
 * five models in turn (25 s each on Groq, up to two 30 s tries on each
 * Gemini). A ping can't.
 */
const GENERATE_TIMEOUT_MS = 210_000;
const PING_TIMEOUT_MS = 8_000;

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
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');

    const useTunnel = !isLocalhost && tunnelUrl !== null;
    const defaultMode: N8nConnectionMode = useTunnel ? 'tunnel' : 'local';
    const activeUrl = useTunnel ? tunnelUrl : DEFAULT_LOCAL_URL;

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
  ): Promise<GenerateRoadmapResponse> {
    const payload: GenerateRoadmapRequest = {
      action: 'generate_roadmap',
      subject,
      domain,
      focusNotes,
    };
    const raw = await this.request(endpoint, payload);
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
  ): Promise<ConceptElaborationResponse> {
    const parsed = validateAndParseElaboration(
      await this.request(endpoint, request),
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
      const raw = await this.request(endpoint, payload);
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
        endpoint || DEFAULT_LOCAL_URL,
        request,
        GENERATE_TIMEOUT_MS,
        cancel,
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
        'The workflow doesn’t know how to write lessons yet. Re-import tools/scripts/studylm_workflow.json into n8n.',
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
  ): Promise<string> {
    try {
      const res = await this.post(
        endpoint || DEFAULT_LOCAL_URL,
        payload,
        GENERATE_TIMEOUT_MS,
      );
      return await res.text();
    } catch (err) {
      throw err instanceof StudyLmAiError
        ? err
        : new StudyLmAiError(describeFailure(err));
    }
  }

  /** One retry when the network drops; a timeout or an HTTP error is final. */
  private async post(
    url: string,
    body: unknown,
    timeoutMs: number,
    cancel?: AbortSignal,
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
      if (!(err instanceof TypeError)) throw err;
      res = await send();
    }
    if (!res.ok) {
      throw new StudyLmAiError(`n8n answered HTTP ${res.status}.`);
    }
    return res;
  }
}

/** Why a call to n8n failed, in words the learner can act on. */
function describeFailure(err: unknown): string {
  if (err instanceof StudyLmAiError) return err.message;
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return 'The AI took too long to answer.';
  }
  if (err instanceof TypeError) {
    return 'Couldn’t reach n8n. Check that it’s running and the address in Settings.';
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
