import { extractAndParseJson } from './schema-validator';
import type {
  ConceptElaboration,
  ConceptElaborationRequest,
  ConceptElaborationResponse,
  ElaborationCodeSnippet,
  ElaborationGraph,
  ElaborationNode,
  ElaborationEdge,
} from '../models/elaboration.model';

export function validateAndParseElaboration(
  raw: unknown,
  fallbackReq: ConceptElaborationRequest,
): ConceptElaborationResponse {
  try {
    const data =
      typeof raw === 'string'
        ? extractAndParseJson<Record<string, unknown>>(raw)
        : (raw as Record<string, unknown>);

    const elabObj = (data['elaboration'] ?? data) as Record<string, unknown>;

    // Guard against unhandled synthesis responses (e.g. { overview: "", flashcards: [], quiz: [] })
    if (
      !elabObj['summary'] &&
      !elabObj['bulletPoints'] &&
      !elabObj['codeSnippet'] &&
      !elabObj['graph'] &&
      (data['overview'] !== undefined || data['flashcards'] !== undefined)
    ) {
      throw new Error('Server returned synthesis schema instead of elaboration response');
    }

    const mode =
      elabObj['mode'] === 'hint' || elabObj['mode'] === 'deep_dive'
        ? elabObj['mode']
        : fallbackReq.mode;

    const summary =
      typeof elabObj['summary'] === 'string' && elabObj['summary'].trim().length > 0
        ? elabObj['summary'].trim()
        : mode === 'hint'
        ? 'Analyze the core specification guarantees, execution boundaries, and invariant constraints.'
        : `Architectural breakdown and specification invariants for ${fallbackReq.conceptTitle}.`;

    const rawBullets = Array.isArray(elabObj['bulletPoints'])
      ? elabObj['bulletPoints']
      : Array.isArray(elabObj['keyTakeaways'])
      ? elabObj['keyTakeaways']
      : [];

    const bulletPoints: string[] = rawBullets
      .map((b) => (typeof b === 'string' ? b.trim() : ''))
      .filter((b) => b.length > 0);

    // Parse Code Snippet if present
    let codeSnippet: ElaborationCodeSnippet | undefined;
    if (elabObj['codeSnippet'] && typeof elabObj['codeSnippet'] === 'object') {
      const cs = elabObj['codeSnippet'] as Record<string, unknown>;
      if (typeof cs['code'] === 'string' && cs['code'].trim().length > 0) {
        codeSnippet = {
          code: cs['code'].trim(),
          language: typeof cs['language'] === 'string' ? cs['language'] : 'typescript',
          filename: typeof cs['filename'] === 'string' ? cs['filename'] : undefined,
          explanation: typeof cs['explanation'] === 'string' ? cs['explanation'] : undefined,
        };
      }
    } else if (typeof elabObj['codeSnippet'] === 'string' && elabObj['codeSnippet'].trim().length > 0) {
      codeSnippet = {
        code: elabObj['codeSnippet'].trim(),
        language: 'typescript',
      };
    }

    // Parse Graph if present
    let graph: ElaborationGraph | undefined;
    const rawGraph = (elabObj['graph'] ?? elabObj['diagram']) as Record<string, unknown> | undefined;
    if (rawGraph && typeof rawGraph === 'object') {
      const rawNodes = Array.isArray(rawGraph['nodes']) ? rawGraph['nodes'] : [];
      const nodes: ElaborationNode[] = rawNodes.map((n, i) => {
        const nodeObj = typeof n === 'object' && n !== null ? (n as Record<string, unknown>) : {};
        return {
          id: String(nodeObj['id'] ?? `node-${i + 1}`),
          label: String(nodeObj['label'] ?? `Step ${i + 1}`),
          subtext: typeof nodeObj['subtext'] === 'string' ? nodeObj['subtext'] : undefined,
          type: (nodeObj['type'] as ElaborationNode['type']) ?? (i === 0 ? 'start' : i === rawNodes.length - 1 ? 'end' : 'process'),
          badge: typeof nodeObj['badge'] === 'string' ? nodeObj['badge'] : undefined,
        };
      });

      const rawEdges = Array.isArray(rawGraph['edges']) ? rawGraph['edges'] : [];
      const edges: ElaborationEdge[] = rawEdges.map((e) => {
        const edgeObj = typeof e === 'object' && e !== null ? (e as Record<string, unknown>) : {};
        return {
          from: String(edgeObj['from'] ?? ''),
          to: String(edgeObj['to'] ?? ''),
          label: typeof edgeObj['label'] === 'string' ? edgeObj['label'] : undefined,
          style: edgeObj['style'] === 'dashed' ? 'dashed' : 'solid',
        };
      });

      if (nodes.length > 0 || typeof rawGraph['rawMermaid'] === 'string') {
        graph = {
          title: typeof rawGraph['title'] === 'string' ? rawGraph['title'] : `${fallbackReq.conceptTitle} Architecture`,
          description: typeof rawGraph['description'] === 'string' ? rawGraph['description'] : undefined,
          direction: rawGraph['direction'] === 'horizontal' ? 'horizontal' : 'vertical',
          nodes,
          edges,
          rawMermaid: typeof rawGraph['rawMermaid'] === 'string' ? rawGraph['rawMermaid'] : undefined,
        };
      }
    }

    // Official Docs
    const rawDocs = Array.isArray(elabObj['officialDocs']) ? elabObj['officialDocs'] : [];
    const officialDocs = rawDocs
      .map((d) => {
        if (typeof d === 'object' && d !== null) {
          const doc = d as Record<string, unknown>;
          if (typeof doc['title'] === 'string' && typeof doc['url'] === 'string') {
            return { title: doc['title'], url: doc['url'] };
          }
        }
        return null;
      })
      .filter((d): d is { title: string; url: string } => d !== null);

    const elaboration: ConceptElaboration = {
      id: `elab-${Date.now()}`,
      mode,
      conceptTitle: typeof elabObj['conceptTitle'] === 'string' ? elabObj['conceptTitle'] : fallbackReq.conceptTitle,
      sectionCode: fallbackReq.sectionCode,
      tier: fallbackReq.difficultyTier,
      summary,
      bulletPoints: bulletPoints.length > 0 ? bulletPoints : [
        'Check spec-defined invariants before mutating or referencing state.',
        'Observe deterministic execution boundaries across asynchronous queues.',
      ],
      codeSnippet,
      graph,
      officialDocs: officialDocs.length > 0 ? officialDocs : [
        {
          title: 'MDN Web Docs / Official Spec Reference',
          url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(fallbackReq.subject)}`,
        },
      ],
      provider: typeof data['provider'] === 'string' ? data['provider'] : 'n8n AI Engine (Groq LPU)',
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      provider: elaboration.provider,
      elaboration,
    };
  } catch (err) {
    console.warn('Failed to parse elaboration response, falling back to safe structure:', err);
    return {
      success: false,
      provider: 'Client Fallback Parser',
      elaboration: {
        id: `elab-fallback-${Date.now()}`,
        mode: fallbackReq.mode,
        conceptTitle: fallbackReq.conceptTitle,
        sectionCode: fallbackReq.sectionCode,
        tier: fallbackReq.difficultyTier,
        summary: fallbackReq.mode === 'hint'
          ? 'Focus on how the runtime schedules tasks and preserves state isolation.'
          : `Deep architectural analysis for ${fallbackReq.conceptTitle}.`,
        bulletPoints: [
          'Verify execution order of microtasks and call stack frames.',
          'Prevent memory retention across scope boundaries.',
        ],
        officialDocs: [
          {
            title: 'MDN Web Docs Reference',
            url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(fallbackReq.subject)}`,
          },
        ],
        provider: 'Grounded Elaboration Engine (Fallback)',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
