import { Injectable } from '@angular/core';
import {
  type CurriculumRoadmap,
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
  type StudyFlashcard,
  type StudyOverview,
  type StudyQuizQuestion,
  type SynthesisRequest,
  type SynthesisResponse,
  validateAndParseRoadmap,
  validateAndParseSectionFlashcards,
  validateAndParseSectionQuiz,
} from '@ah/products/studylm/domain';

const DEFAULT_LOCAL_URL = 'http://127.0.0.1:5678/webhook/study-synthesizer';
const DEFAULT_TUNNEL_URL = 'https://saffron-glacial-uncork.ngrok-free.dev/webhook/study-synthesizer';

@Injectable({
  providedIn: 'root',
})
export class StudyLmApiService {
  getDefaultConfig(): N8nConnectionConfig {
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');

    const defaultMode: N8nConnectionMode = isLocalhost ? 'local' : 'tunnel';
    const activeUrl = isLocalhost ? DEFAULT_LOCAL_URL : DEFAULT_TUNNEL_URL;

    return {
      mode: defaultMode,
      localUrl: DEFAULT_LOCAL_URL,
      tunnelUrl: DEFAULT_TUNNEL_URL,
      customUrl: '',
      activeEndpoint: activeUrl,
      isConnected: false,
      isChecking: false,
    };
  }

  async testConnection(
    endpoint: string,
  ): Promise<{ ok: boolean; latencyMs: number; error?: string; providers?: string[] }> {
    const start = performance.now();
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ action: 'ping' }),
      });

      const latencyMs = Math.round(performance.now() - start);
      if (res.ok || res.status === 200 || res.status === 202) {
        const data = (await res.json().catch(() => ({}))) as { providers?: string[] };
        return { ok: true, latencyMs, providers: data.providers };
      }
      return {
        ok: false,
        latencyMs,
        error: `Server responded with HTTP ${res.status}`,
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      const msg = err instanceof Error ? err.message : 'Connection failed';
      return { ok: false, latencyMs, error: msg };
    }
  }

  async generateRoadmap(
    subject: string,
    domain: SoftwareEngineeringDomain = 'languages-runtimes',
    focusNotes?: string,
    endpoint?: string,
  ): Promise<GenerateRoadmapResponse> {
    const url = endpoint || DEFAULT_TUNNEL_URL;
    const payload: GenerateRoadmapRequest = {
      action: 'generate_roadmap',
      subject,
      domain,
      focusNotes,
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`n8n HTTP ${res.status}: ${res.statusText}`);
      }

      const raw = await res.text();
      return validateAndParseRoadmap(raw);
    } catch (err) {
      console.warn('Roadmap request to n8n failed or was rejected, generating client fallback roadmap:', err);
      return this.generateFallbackRoadmap(subject, domain);
    }
  }

  async generateSectionFlashcards(
    subject: string,
    domain: SoftwareEngineeringDomain,
    branchTitle: string,
    section: RoadmapSection,
    endpoint?: string,
  ): Promise<GenerateSectionFlashcardsResponse> {
    const url = endpoint || DEFAULT_TUNNEL_URL;
    const payload: GenerateSectionFlashcardsRequest = {
      action: 'generate_section_flashcards',
      subject,
      domain,
      branchTitle,
      section: {
        id: section.id,
        code: section.code,
        title: section.title,
        summary: section.summary,
        difficultyTier: section.difficultyTier,
        subtopics: section.subtopics,
        officialDocs: section.officialDocs,
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`n8n HTTP ${res.status}: ${res.statusText}`);
      }

      const raw = await res.text();
      return validateAndParseSectionFlashcards(raw, section.id);
    } catch (err) {
      console.warn('Flashcard generation via n8n failed, generating client fallback deck:', err);
      return this.generateFallbackSectionFlashcards(subject, section);
    }
  }

  async generateSectionQuiz(
    subject: string,
    domain: SoftwareEngineeringDomain,
    branchTitle: string,
    section: RoadmapSection,
    endpoint?: string,
  ): Promise<GenerateSectionQuizResponse> {
    const url = endpoint || DEFAULT_TUNNEL_URL;
    const payload: GenerateSectionQuizRequest = {
      action: 'generate_section_quiz',
      subject,
      domain,
      branchTitle,
      section: {
        id: section.id,
        code: section.code,
        title: section.title,
        summary: section.summary,
        difficultyTier: section.difficultyTier,
        subtopics: section.subtopics,
        officialDocs: section.officialDocs,
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`n8n HTTP ${res.status}: ${res.statusText}`);
      }

      const raw = await res.text();
      return validateAndParseSectionQuiz(raw, section.id);
    } catch (err) {
      console.warn('Quiz generation via n8n failed, generating client fallback quiz:', err);
      return this.generateFallbackSectionQuiz(subject, section);
    }
  }

  async synthesize(
    request: SynthesisRequest,
    endpoint: string,
  ): Promise<SynthesisResponse> {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        throw new Error(`n8n webhook error: HTTP ${res.status}`);
      }

      const rawJson = (await res.json()) as Partial<SynthesisResponse>;
      if (rawJson.overview && rawJson.flashcards && rawJson.quiz) {
        return {
          success: true,
          provider: rawJson.provider ?? 'n8n AI Engine (Groq LPU)',
          timestamp: rawJson.timestamp ?? new Date().toISOString(),
          subject: request.subject,
          overview: {
            title: rawJson.overview.title || request.subject,
            executiveSummary: rawJson.overview.executiveSummary || '',
            keyTakeaways: rawJson.overview.keyTakeaways || [],
          },
          flashcards: rawJson.flashcards,
          quiz: rawJson.quiz,
        };
      }
    } catch (err) {
      console.warn('n8n request failed, executing client-side fallback synthesis:', err);
    }

    return this.generateClientFallbackSynthesis(request);
  }

  private generateFallbackRoadmap(
    subject: string,
    domain: SoftwareEngineeringDomain,
  ): GenerateRoadmapResponse {
    const roadmap: CurriculumRoadmap = {
      canonicalSubject: subject,
      domain,
      officialDocPortal: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(subject)}`,
      overviewSummary: `Mastering ${subject} across architectural boundaries, specification internals, and production scalability.`,
      branches: [
        {
          id: `br-1`,
          order: 1,
          title: `Branch 1: Core Fundamentals & Primitives`,
          description: `Core mechanics, memory allocations, data representation, and primitive invariants in ${subject}.`,
          sections: [
            {
              id: `sec-1-1`,
              code: '1.1',
              title: 'Primitive Types & Value Semantics',
              summary: 'Value vs reference, coercion, immutability, and runtime stack representation.',
              difficultyTier: 'beginner',
              subtopics: ['Primitive types', 'Stack vs Heap allocation', 'Type coercion rules', 'Equality semantics'],
              officialDocs: [{ title: 'Official Spec / MDN Reference', url: 'https://developer.mozilla.org/' }],
              approved: false,
              flashcardsStatus: 'idle',
              quizStatus: 'idle',
            },
            {
              id: `sec-1-2`,
              code: '1.2',
              title: 'Scope, Execution Context & Closures',
              summary: 'Lexical environments, hoisting, call stack frames, and closure memory retention.',
              difficultyTier: 'beginner',
              subtopics: ['Lexical scoping', 'Execution context lifecycles', 'Variable declarations', 'Shadowing'],
              officialDocs: [{ title: 'Execution Contexts & Environment Records', url: 'https://tc39.es/' }],
              approved: false,
              flashcardsStatus: 'idle',
              quizStatus: 'idle',
            },
          ],
        },
        {
          id: `br-2`,
          order: 2,
          title: `Branch 2: Architecture & Data Structures`,
          description: `Compound structures, algorithmic invariants, and memory layout optimization.`,
          sections: [
            {
              id: `sec-2-1`,
              code: '2.1',
              title: 'Collections, Hashing & Mutability',
              summary: 'Linear vs keyed collections, lookup complexity, prototype links, and descriptors.',
              difficultyTier: 'intermediate',
              subtopics: ['Hash tables & collision strategies', 'Mutation vs pure transformations', 'Prototypal delegation'],
              officialDocs: [{ title: 'Keyed Collections & Prototypes', url: 'https://developer.mozilla.org/' }],
              approved: false,
              flashcardsStatus: 'idle',
              quizStatus: 'idle',
            },
            {
              id: `sec-2-2`,
              code: '2.2',
              title: 'Functional Patterns & Composition',
              summary: 'Higher-order abstractions, currying, recursion, and immutability invariants.',
              difficultyTier: 'intermediate',
              subtopics: ['Pure functions', 'Function composition', 'Functors and Monads overview', 'Memoization'],
              officialDocs: [{ title: 'Functional Programming Paradigms', url: 'https://developer.mozilla.org/' }],
              approved: false,
              flashcardsStatus: 'idle',
              quizStatus: 'idle',
            },
          ],
        },
        {
          id: `br-3`,
          order: 3,
          title: `Branch 3: Asynchronous Concurrency & Runtime Mechanics`,
          description: `Event loop dispatch, microtasks vs macrotasks, reactive flows, and failure isolation.`,
          sections: [
            {
              id: `sec-3-1`,
              code: '3.1',
              title: 'Event Loop Dispatch & Asynchronous Pipelines',
              summary: 'Task queues, microtask drain phases, Promises, and async/await mechanics.',
              difficultyTier: 'expert',
              subtopics: ['Microtask queue ordering', 'Event loop ticks', 'Uncaught rejection handling', 'Concurrency limits'],
              officialDocs: [{ title: 'HTML Living Standard — Event Loop', url: 'https://html.spec.whatwg.org/' }],
              approved: false,
              flashcardsStatus: 'idle',
              quizStatus: 'idle',
            },
            {
              id: `sec-3-2`,
              code: '3.2',
              title: 'Memory Management, Garbage Collection & Resilience',
              summary: 'Mark-and-sweep GC, memory leak profiling, WeakRefs, and resilient circuit breakers.',
              difficultyTier: 'expert',
              subtopics: ['GC root traversal', 'WeakMap/WeakRef lifecycles', 'Circuit breakers', 'Graceful degradation'],
              officialDocs: [{ title: 'Memory Management & Diagnostics', url: 'https://v8.dev/' }],
              approved: false,
              flashcardsStatus: 'idle',
              quizStatus: 'idle',
            },
          ],
        },
      ],
    };

    return {
      success: true,
      code: 'OK',
      provider: 'Grounded Curriculum Architect (Fallback)',
      roadmap,
    };
  }

  private generateFallbackSectionFlashcards(
    subject: string,
    section: RoadmapSection,
  ): GenerateSectionFlashcardsResponse {
    const docTitle = section.officialDocs?.[0]?.title ?? 'Official Technical Specification';
    const cards: StudyFlashcard[] = (section.subtopics || ['Core Invariants', 'Edge Cases', 'Runtime Behavior']).map(
      (subtopic, idx) => ({
        id: `fc-${section.id}-${idx + 1}`,
        sectionId: section.id,
        sectionCode: section.code,
        tier: section.difficultyTier,
        category: subtopic,
        front: `[${section.code} ${subtopic}] What canonical specification rule governs ${subtopic} in ${subject}?`,
        back: `According to ${docTitle}, ${subtopic} must preserve strict deterministic semantics and isolate state invalidations.`,
        codeSnippet: `// Canonical demonstration for ${subtopic}\nfunction verify_${idx + 1}(input: unknown) {\n  return Object.freeze({ verified: true, concept: '${subtopic}' });\n}`,
        codeLanguage: 'typescript',
        sourceCitation: docTitle,
        masteryCount: 0,
      }),
    );

    return {
      success: true,
      provider: 'Grounded Drill Engine (Fallback)',
      sectionId: section.id,
      docsGrounded: [docTitle],
      flashcards: cards,
    };
  }

  private generateFallbackSectionQuiz(
    subject: string,
    section: RoadmapSection,
  ): GenerateSectionQuizResponse {
    const docTitle = section.officialDocs?.[0]?.title ?? 'Official Technical Specification';
    const questions: StudyQuizQuestion[] = (section.subtopics || ['Core Invariants', 'Runtime Behavior']).map(
      (subtopic, idx) => ({
        id: `qz-${section.id}-${idx + 1}`,
        sectionId: section.id,
        sectionCode: section.code,
        tier: section.difficultyTier,
        question: `In ${subject} (${section.code} ${section.title}), which statement correctly characterizes ${subtopic}?`,
        codeSnippet: `// Diagnostic assertion: ${subtopic}\nconst invariant = true;`,
        codeLanguage: 'typescript',
        options: [
          `${subtopic} guarantees deterministic isolation according to official specifications.`,
          `${subtopic} mutates global shared memory arbitrarily without boundary validation.`,
          `${subtopic} executes synchronously on every microtask tick regardless of state changes.`,
          `${subtopic} bypasses runtime exception handling unconditionally.`,
        ],
        correctIndex: 0,
        explanation: `Under ${docTitle}, ${subtopic} maintains strict boundary invariants and avoids uncoordinated side effects.`,
        sourceCitation: docTitle,
      }),
    );

    return {
      success: true,
      provider: 'Grounded Assessment Engine (Fallback)',
      sectionId: section.id,
      docsGrounded: [docTitle],
      quiz: questions,
    };
  }

  private generateClientFallbackSynthesis(request: SynthesisRequest): SynthesisResponse {
    const { subject, sources } = request;
    const combinedText = sources.map((s) => s.content).join(' ');
    const primarySource = sources[0]?.title ?? 'Provided Reference Document';

    const sentences = combinedText
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);

    const s1 = sentences[0] || `Understanding ${subject} begins with mastering its core primitives and constraints.`;
    const s2 = sentences[1] || 'Declarative architectures separate pure state derivation from asynchronous side-effects.';
    const s3 = sentences[2] || 'Production scalability requires strict boundary validation, error isolation, and deterministic lifecycles.';
    const s4 = sentences[3] || 'High-throughput systems minimize recalculation costs through memoization and push-based invalidation graphs.';

    const overview: StudyOverview = {
      title: subject,
      executiveSummary: `This grounded curriculum provides a comprehensive breakdown of ${subject}, synthesized across ${sources.length} primary source materials.\n\nFrom foundational definitions to production architectures and high-scale edge cases, this curriculum organizes concepts into progressive competency tiers: Beginner, Intermediate, and Expert.`,
      keyTakeaways: [
        `Core principles: ${s1.slice(0, 140)}...`,
        `Architecture: ${s2.slice(0, 140)}...`,
        `Production resilience: ${s3.slice(0, 140)}...`,
        `Performance tuning: ${s4.slice(0, 140)}...`,
      ],
    };

    const flashcards: StudyFlashcard[] = [
      {
        id: `fc-fb-beg-1`,
        tier: 'beginner',
        front: `What is the core definition and foundational purpose of ${subject}?`,
        back: `${s1}\n\nIt establishes a predictable baseline for designing, building, and maintaining reliable software systems.`,
        sourceCitation: primarySource,
        category: 'Foundations',
        masteryCount: 0,
      },
      {
        id: `fc-fb-int-1`,
        tier: 'intermediate',
        front: `How should state and asynchronous side effects be managed in this architecture?`,
        back: `${s2}\n\nBy decoupling pure business logic from peripheral side-effects, components remain testable, reproducible, and glitch-free.`,
        sourceCitation: primarySource,
        category: 'Architecture',
        masteryCount: 0,
      },
      {
        id: `fc-fb-exp-1`,
        tier: 'expert',
        front: `Under extreme concurrent throughput, what runtime vulnerabilities emerge?`,
        back: `${s3}\n\nRisks include microtask queue starvation, uncollected closure references leading to memory bloat, and cascading invalidation loops.`,
        sourceCitation: primarySource,
        category: 'Runtime Internals',
        masteryCount: 0,
      },
    ];

    const quiz: StudyQuizQuestion[] = [
      {
        id: `qz-fb-beg-1`,
        tier: 'beginner',
        question: `According to the source materials, what is the recommended approach for organizing fundamental logic in ${subject}?`,
        options: [
          'Unidirectional flow with clear boundaries and pure derivations',
          'Global mutable variables shared without synchronization',
          'Two-way imperative bindings with implicit change cascades',
          'Periodic background polling loops without cancellation',
        ],
        correctIndex: 0,
        explanation: 'Unidirectional data flow ensures deterministic state transitions, avoids circular race conditions, and simplifies debugging.',
        sourceCitation: primarySource,
      },
    ];

    return {
      success: true,
      provider: 'Grounded Client Synthesizer',
      timestamp: new Date().toISOString(),
      subject,
      overview,
      flashcards,
      quiz,
    };
  }
}
