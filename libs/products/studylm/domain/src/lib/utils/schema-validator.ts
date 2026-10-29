import type { CompetencyTier } from '../models/tier.model';
import type {
  CurriculumRoadmap,
  RoadmapBranch,
  RoadmapSection,
  SoftwareEngineeringDomain,
} from '../models/roadmap.model';
import type { StudyFlashcard } from '../models/flashcard.model';
import type { StudyQuizQuestion } from '../models/quiz.model';
import type {
  GenerateRoadmapResponse,
  GenerateSectionFlashcardsResponse,
  GenerateSectionQuizResponse,
} from '../models/synthesis.model';

/**
 * Safely extracts and parses JSON even if an LLM wraps the response in markdown code blocks.
 */
export function extractAndParseJson<T>(raw: string | unknown): T {
  if (typeof raw !== 'string') {
    return raw as T;
  }
  let clean = raw.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  const lastBrace = clean.lastIndexOf('}');
  const lastBracket = clean.lastIndexOf(']');
  const endIdx = Math.max(lastBrace, lastBracket);
  if (startIdx >= 0 && endIdx > startIdx) {
    clean = clean.substring(startIdx, endIdx + 1);
  }
  return JSON.parse(clean) as T;
}

function parseTier(val: unknown, fallback: CompetencyTier = 'intermediate'): CompetencyTier {
  if (val === 'beginner' || val === 'intermediate' || val === 'expert') {
    return val;
  }
  return fallback;
}

export function validateAndParseRoadmap(
  raw: unknown,
  fallbackDomain: SoftwareEngineeringDomain = 'languages-runtimes',
): GenerateRoadmapResponse {
  try {
    const data = typeof raw === 'string' ? extractAndParseJson<Record<string, unknown>>(raw) : (raw as Record<string, unknown>);

    if (data['code'] === 'NON_SE_TOPIC' || data['isValidSoftwareEngineeringTopic'] === false) {
      return {
        success: false,
        code: 'NON_SE_TOPIC',
        provider: String(data['provider'] || 'SE Domain Guardrail'),
        message: String(
          data['message'] ||
            data['rejectionReason'] ||
            'StudyLM is strictly specialized for Software Engineering concepts. Please choose a technical software engineering subject.',
        ),
      };
    }

    const branchesRaw = Array.isArray(data['branches']) ? data['branches'] : [];
    const branches: RoadmapBranch[] = branchesRaw.map((bRaw, bIdx) => {
      const b = bRaw as Record<string, unknown>;
      const sectionsRaw = Array.isArray(b['sections']) ? b['sections'] : [];
      const sections: RoadmapSection[] = sectionsRaw.map((sRaw, sIdx) => {
        const s = sRaw as Record<string, unknown>;
        const secCode = String(s['code'] || `${bIdx + 1}.${sIdx + 1}`);
        const secId = String(s['id'] || `sec-${bIdx + 1}-${sIdx + 1}`);
        const docsRaw = Array.isArray(s['officialDocs']) ? s['officialDocs'] : [];
        const subtopicsRaw = Array.isArray(s['subtopics']) ? s['subtopics'] : [];

        return {
          id: secId,
          code: secCode,
          title: String(s['title'] || `Section ${secCode}`),
          summary: String(s['summary'] || ''),
          difficultyTier: parseTier(s['difficultyTier'], 'intermediate'),
          subtopics: subtopicsRaw.map((st) => String(st).trim()).filter(Boolean),
          officialDocs: docsRaw.map((d) => {
            const docObj = d as Record<string, unknown>;
            return {
              title: String(docObj['title'] || 'Official Docs'),
              url: String(docObj['url'] || ''),
            };
          }),
          approved: false,
          flashcardsStatus: 'idle',
          quizStatus: 'idle',
        };
      });

      return {
        id: String(b['id'] || `branch-${bIdx + 1}`),
        order: typeof b['order'] === 'number' ? b['order'] : bIdx + 1,
        title: String(b['title'] || `Branch ${bIdx + 1}`),
        description: String(b['description'] || ''),
        sections,
      };
    });

    const roadmap: CurriculumRoadmap = {
      canonicalSubject: String(data['canonicalSubject'] || data['subject'] || 'Software Engineering Curriculum'),
      domain: (data['domain'] as SoftwareEngineeringDomain) || fallbackDomain,
      officialDocPortal: String(data['officialDocPortal'] || ''),
      overviewSummary: String(data['overviewSummary'] || data['summary'] || ''),
      branches,
    };

    return {
      success: true,
      code: 'OK',
      provider: String(data['provider'] || 'n8n Multi-AI Engine'),
      roadmap,
    };
  } catch (err) {
    return {
      success: false,
      code: 'INVALID_RESPONSE',
      provider: 'Parser Guard',
      message: err instanceof Error ? err.message : 'Failed to parse roadmap JSON',
    };
  }
}

export function validateAndParseSectionFlashcards(
  raw: unknown,
  fallbackSectionId: string,
): GenerateSectionFlashcardsResponse {
  try {
    const data = typeof raw === 'string' ? extractAndParseJson<Record<string, unknown>>(raw) : (raw as Record<string, unknown>);
    const rawList = Array.isArray(data['flashcards']) ? data['flashcards'] : Array.isArray(data) ? data : [];
    const sectionId = String(data['sectionId'] || fallbackSectionId);
    const docsGrounded = Array.isArray(data['docsGrounded']) ? (data['docsGrounded'] as string[]) : [];

    const flashcards: StudyFlashcard[] = rawList.map((cRaw, i) => {
      const c = cRaw as Record<string, unknown>;
      return {
        id: String(c['id'] || `fc-${sectionId}-${Date.now()}-${i}`),
        tier: parseTier(c['tier']),
        front: String(c['front'] || ''),
        back: String(c['back'] || ''),
        category: String(c['category'] || 'Concept'),
        sectionId,
        sectionCode: c['sectionCode'] ? String(c['sectionCode']) : undefined,
        codeSnippet: c['codeSnippet'] ? String(c['codeSnippet']) : undefined,
        codeLanguage: c['codeLanguage'] ? String(c['codeLanguage']) : 'typescript',
        sourceCitation: String(c['sourceCitation'] || 'Official Documentation'),
        masteryCount: 0,
      };
    });

    return {
      success: true,
      provider: String(data['provider'] || 'n8n Free AI Pool'),
      sectionId,
      docsGrounded,
      flashcards,
    };
  } catch (err) {
    return {
      success: false,
      provider: 'Parser Guard',
      sectionId: fallbackSectionId,
      docsGrounded: [],
      flashcards: [],
      message: err instanceof Error ? err.message : 'Invalid flashcard format',
    };
  }
}

export function validateAndParseSectionQuiz(
  raw: unknown,
  fallbackSectionId: string,
): GenerateSectionQuizResponse {
  try {
    const data = typeof raw === 'string' ? extractAndParseJson<Record<string, unknown>>(raw) : (raw as Record<string, unknown>);
    const rawList = Array.isArray(data['quiz']) ? data['quiz'] : Array.isArray(data) ? data : [];
    const sectionId = String(data['sectionId'] || fallbackSectionId);
    const docsGrounded = Array.isArray(data['docsGrounded']) ? (data['docsGrounded'] as string[]) : [];

    const quiz: StudyQuizQuestion[] = rawList.map((qRaw, i) => {
      const q = qRaw as Record<string, unknown>;
      const rawOpts = Array.isArray(q['options']) ? q['options'] : [];
      const opts: [string, string, string, string] = [
        String(rawOpts[0] || 'Option A'),
        String(rawOpts[1] || 'Option B'),
        String(rawOpts[2] || 'Option C'),
        String(rawOpts[3] || 'Option D'),
      ];

      const cIdx = typeof q['correctIndex'] === 'number' && q['correctIndex'] >= 0 && q['correctIndex'] <= 3 ? q['correctIndex'] : 0;

      return {
        id: String(q['id'] || `qz-${sectionId}-${Date.now()}-${i}`),
        tier: parseTier(q['tier']),
        question: String(q['question'] || ''),
        options: opts,
        correctIndex: cIdx,
        explanation: String(q['explanation'] || 'Official specification rationale.'),
        sourceCitation: String(q['sourceCitation'] || 'Official Documentation'),
        sectionId,
        sectionCode: q['sectionCode'] ? String(q['sectionCode']) : undefined,
        codeSnippet: q['codeSnippet'] ? String(q['codeSnippet']) : undefined,
        codeLanguage: q['codeLanguage'] ? String(q['codeLanguage']) : 'typescript',
      };
    });

    return {
      success: true,
      provider: String(data['provider'] || 'n8n Free AI Pool'),
      sectionId,
      docsGrounded,
      quiz,
    };
  } catch (err) {
    return {
      success: false,
      provider: 'Parser Guard',
      sectionId: fallbackSectionId,
      docsGrounded: [],
      quiz: [],
      message: err instanceof Error ? err.message : 'Invalid quiz format',
    };
  }
}
