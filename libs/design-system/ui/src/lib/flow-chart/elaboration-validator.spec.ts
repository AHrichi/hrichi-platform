import { describe, expect, it } from 'vitest';
import {
  type ConceptElaborationRequest,
  validateAndParseElaboration,
} from '@ah/products/studylm/domain';

describe('validateAndParseElaboration', () => {
  const sampleReq: ConceptElaborationRequest = {
    action: 'elaborate_concept',
    mode: 'deep_dive',
    subject: 'JavaScript Internals',
    conceptTitle: 'Event Loop & Microtask Queue',
    difficultyTier: 'expert',
    sectionCode: '3.1',
    promptOrQuestion: 'How does the V8 microtask queue handle Promise resolution during ticks?',
    answerOrExplanation: 'Microtasks are drained completely before the next macrotask is dispatched.',
  };

  it('should parse valid JSON elaboration with graph and code snippet', () => {
    const jsonPayload = JSON.stringify({
      provider: 'n8n AI Engine (Groq LPU)',
      elaboration: {
        mode: 'deep_dive',
        conceptTitle: 'Event Loop & Microtask Queue',
        summary: 'The microtask queue executes to completion before rendering or macrotasks.',
        bulletPoints: [
          'Promises and queueMicrotask enqueue callbacks into the microtask queue.',
          'Drain loop runs until size is 0, risking starvation if recursive.',
        ],
        codeSnippet: {
          code: 'queueMicrotask(() => console.log("Microtask 1"));',
          language: 'typescript',
          filename: 'microtask.ts',
        },
        graph: {
          title: 'Event Loop Tick Flow',
          nodes: [
            { id: '1', label: 'Call Stack Frame', type: 'start' },
            { id: '2', label: 'Microtask Queue Drain', type: 'highlight' },
            { id: '3', label: 'Macrotask Queue', type: 'end' },
          ],
          edges: [
            { from: '1', to: '2', label: 'Stack Empty' },
            { from: '2', to: '3', label: 'Microtasks 0' },
          ],
        },
        officialDocs: [
          {
            title: 'HTML Standard - Event loops',
            url: 'https://html.spec.whatwg.org/multipage/webappapis.html#event-loops',
          },
        ],
      },
    });

    const res = validateAndParseElaboration(jsonPayload, sampleReq);
    expect(res.success).toBe(true);
    expect(res.elaboration.mode).toBe('deep_dive');
    expect(res.elaboration.summary).toContain('microtask queue executes to completion');
    expect(res.elaboration.codeSnippet?.code).toContain('queueMicrotask');
    expect(res.elaboration.graph?.nodes.length).toBe(3);
    expect(res.elaboration.graph?.edges?.length).toBe(2);
    expect(res.elaboration.officialDocs?.length).toBe(1);
  });

  it('should handle markdown fenced code blocks gracefully', () => {
    const rawFenced = `\`\`\`json
    {
      "mode": "hint",
      "summary": "Think about whether microtasks run before or after the timer queue.",
      "bulletPoints": ["Check the drain checkpoint after the current call stack clears."]
    }
    \`\`\``;

    const res = validateAndParseElaboration(rawFenced, { ...sampleReq, mode: 'hint' });
    expect(res.success).toBe(true);
    expect(res.elaboration.mode).toBe('hint');
    expect(res.elaboration.summary).toContain('Think about whether microtasks run before');
    expect(res.elaboration.bulletPoints.length).toBe(1);
  });

  it('should fall back safely if JSON is completely malformed', () => {
    const badRaw = '<html><body>502 Bad Gateway</body></html>';
    const res = validateAndParseElaboration(badRaw, sampleReq);
    expect(res.success).toBe(false);
    expect(res.elaboration.conceptTitle).toBe('Event Loop & Microtask Queue');
    expect(res.elaboration.bulletPoints.length).toBeGreaterThan(0);
  });
});
