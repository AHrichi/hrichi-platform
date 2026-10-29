import { writeFileSync } from 'fs';

const workflow = [
  {
    name: "StudyLM Pedagogical Synthesis & Roadmap Engine",
    id: "DeA78ziIV0C4jZZ9",
    active: true,
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "study-synthesizer",
          responseMode: "responseNode",
          options: {}
        },
        id: "webhook-in",
        name: "Webhook Ingest",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [100, 300],
        webhookId: "study-synthesizer-webhook-id"
      },
      {
        parameters: {
          jsCode: `
const body = $input.item.json.body || $input.item.json || {};
const action = body.action || (body.sources ? 'synthesize_sources' : 'ping');
const subject = String(body.subject || '').trim();
const domain = body.domain || 'languages-runtimes';

if (action === 'ping') {
  return [{
    json: {
      action: 'ping',
      isPing: true,
      ok: true,
      providers: ['Groq LPU (openai/gpt-oss-120b)', 'Groq LPU (qwen/qwen3.8-27b)']
    }
  }];
}

let systemPrompt = '';
let userPrompt = '';

if (action === 'generate_roadmap') {
  const focusNotes = body.focusNotes ? ('\\nAdditional User Focus: ' + body.focusNotes) : '';
  systemPrompt = 'You are the StudyLM Principal Software Engineering Curriculum Architect.\\n' +
    'Your goal is to build an exhaustive, progressive, multi-branch curriculum roadmap for technical mastery.\\n' +
    'GUARDRAIL:\\n' +
    'The subject MUST be a valid Software Engineering, Computer Science, System Architecture, or Web Development topic.\\n' +
    'If the subject is NOT a Software Engineering topic (e.g. cooking, history, fiction), you MUST set "isValidSoftwareEngineeringTopic": false, explain why in "rejectionReason", and provide empty branches.\\n\\n' +
    'CURRICULUM SPECIFICATIONS FOR VALID SE TOPICS:\\n' +
    '1. Break the subject into 5 to 8 logical Branches (Chapters/Phases) in pedagogical sequence.\\n' +
    '2. Inside each Branch, define 2 to 5 atomic Sections with code "X.Y" (e.g. Section 1.1, 1.2, 2.1...).\\n' +
    '3. To prevent LLM hallucination and shallow coverage, EACH section MUST be scoped tightly to a cohesive concept cluster.\\n' +
    '4. Assign each Section an accurate difficultyTier: "beginner", "intermediate", or "expert".\\n' +
    '5. List 3 to 6 explicit subtopics that MUST be covered when generating cards/quizzes for that section.\\n' +
    '6. Provide authoritative official documentation links (MDN Web Docs, ECMAScript Spec, Angular.dev, TypeScript Handbook, RFCs, official docs).\\n\\n' +
    'OUTPUT FORMAT (Strict JSON):\\n' +
    '{\\n' +
    '  "isValidSoftwareEngineeringTopic": true,\\n' +
    '  "canonicalSubject": "' + subject + '",\\n' +
    '  "domain": "' + domain + '",\\n' +
    '  "officialDocPortal": "Official Documentation URL or hub",\\n' +
    '  "overviewSummary": "2-3 sentence overview of the technical mastery path",\\n' +
    '  "branches": [\\n' +
    '    {\\n' +
    '      "id": "branch-1",\\n' +
    '      "order": 1,\\n' +
    '      "title": "Branch 1: Core Fundamentals",\\n' +
    '      "description": "Branch description",\\n' +
    '      "sections": [\\n' +
    '        {\\n' +
    '          "id": "sec-1-1",\\n' +
    '          "code": "1.1",\\n' +
    '          "title": "Section Title",\\n' +
    '          "summary": "Specific boundary of this section",\\n' +
    '          "difficultyTier": "beginner",\\n' +
    '          "subtopics": ["Concept 1", "Concept 2", "Concept 3"],\\n' +
    '          "officialDocs": [{ "title": "Official Doc Page", "url": "https://..." }]\\n' +
    '        }\\n' +
    '      ]\\n' +
    '    }\\n' +
    '  ]\\n' +
    '}';

  userPrompt = 'Create an exhaustive Software Engineering curriculum roadmap for: "' + subject + '"' + focusNotes;
} else if (action === 'generate_section_flashcards') {
  const section = body.section || {};
  const branchTitle = body.branchTitle || 'Curriculum Branch';
  const subtopicsList = (section.subtopics || []).join(', ');
  const docsList = (section.officialDocs || []).map(d => d.title + (d.url ? ' (' + d.url + ')' : '')).join('; ');

  systemPrompt = 'You are the StudyLM Senior Technical Drill Master.\\n' +
    'You are generating an UNCAPPED, EXHAUSTIVE deck of high-yield technical flashcards for a SINGLE atomic section.\\n\\n' +
    'SECTION DETAILS:\\n' +
    '• Subject: ' + subject + '\\n' +
    '• Branch: ' + branchTitle + '\\n' +
    '• Section ' + (section.code || '1.1') + ': ' + (section.title || '') + '\\n' +
    '• Difficulty Tier: ' + (section.difficultyTier || 'intermediate') + '\\n' +
    '• Required Subtopics: ' + subtopicsList + '\\n' +
    '• Grounding Documentation: ' + docsList + '\\n\\n' +
    'MANDATORY RULES:\\n' +
    '1. PRIORITIZE OFFICIAL DOCUMENTATION & SPECIFICATIONS: Strictly align with canonical spec behavior (ECMAScript, MDN, framework specs, RFCs). No informal blog folklore.\\n' +
    '2. EXHAUSTIVE COVERAGE: There is NO ARBITRARY LIMIT on cards. Cover EVERY subtopic, edge case, gotcha, runtime mechanic, and subtle trap thoroughly (typically 12 to 24+ cards depending on depth).\\n' +
    '3. CODE SNIPPETS: Whenever illustrating syntax, coercion, closures, concurrency, or gotchas, provide a concise, clean codeSnippet and codeLanguage.\\n' +
    '4. TIER ACCURACY: Calibrate cards to the section tier (' + (section.difficultyTier || 'intermediate') + ').\\n' +
    '5. OUTPUT JSON ONLY matching this structure:\\n' +
    '{\\n' +
    '  "sectionId": "' + (section.id || 'sec-1-1') + '",\\n' +
    '  "docsGrounded": ["' + (docsList || 'Official Documentation') + '"],\\n' +
    '  "flashcards": [\\n' +
    '    {\\n' +
    '      "id": "fc-1",\\n' +
    '      "tier": "' + (section.difficultyTier || 'intermediate') + '",\\n' +
    '      "front": "Targeted question or scenario prompt",\\n' +
    '      "back": "Precise, deep technical explanation citing the exact rule/behavior",\\n' +
    '      "codeSnippet": "optional code example or gotcha",\\n' +
    '      "codeLanguage": "javascript",\\n' +
    '      "category": "Subtopic Name",\\n' +
    '      "sourceCitation": "MDN Web Docs / Spec Section"\\n' +
    '    }\\n' +
    '  ]\\n' +
    '}';

  userPrompt = 'Generate an exhaustive, deep flashcard deck covering all subtopics of Section ' + (section.code || '') + ': ' + (section.title || subject);
} else if (action === 'generate_section_quiz') {
  const section = body.section || {};
  const branchTitle = body.branchTitle || 'Curriculum Branch';
  const subtopicsList = (section.subtopics || []).join(', ');
  const docsList = (section.officialDocs || []).map(d => d.title + (d.url ? ' (' + d.url + ')' : '')).join('; ');

  systemPrompt = 'You are the StudyLM Senior Technical Assessment Engineer.\\n' +
    'You are generating an UNCAPPED, THOROUGH diagnostic quiz for a SINGLE atomic section.\\n\\n' +
    'SECTION DETAILS:\\n' +
    '• Subject: ' + subject + '\\n' +
    '• Branch: ' + branchTitle + '\\n' +
    '• Section ' + (section.code || '1.1') + ': ' + (section.title || '') + '\\n' +
    '• Difficulty Tier: ' + (section.difficultyTier || 'intermediate') + '\\n' +
    '• Required Subtopics: ' + subtopicsList + '\\n' +
    '• Grounding Documentation: ' + docsList + '\\n\\n' +
    'MANDATORY RULES:\\n' +
    '1. PRIORITIZE OFFICIAL DOCUMENTATION: Test exact specification behavior, runtime outcomes, trade-offs, and gotchas.\\n' +
    '2. DIAGNOSTIC MCQs: Provide exactly 4 distinct options per question. Only ONE is correct. Distractors must represent common developer misconceptions or invalid assumptions.\\n' +
    '3. CODE EXAMPLES: Include codeSnippet for questions testing output order, type coercion, mutation, or architectural signatures.\\n' +
    '4. DETAILED RATIONALE: Provide a thorough explanation explaining why the correct answer is right according to documentation, and why each distractor is wrong.\\n' +
    '5. OUTPUT JSON ONLY matching this structure:\\n' +
    '{\\n' +
    '  "sectionId": "' + (section.id || 'sec-1-1') + '",\\n' +
    '  "docsGrounded": ["' + (docsList || 'Official Documentation') + '"],\\n' +
    '  "quiz": [\\n' +
    '    {\\n' +
    '      "id": "qz-1",\\n' +
    '      "tier": "' + (section.difficultyTier || 'intermediate') + '",\\n' +
    '      "question": "Question statement",\\n' +
    '      "codeSnippet": "optional code snippet",\\n' +
    '      "codeLanguage": "javascript",\\n' +
    '      "options": ["Option A", "Option B", "Option C", "Option D"],\\n' +
    '      "correctIndex": 0,\\n' +
    '      "explanation": "Detailed rationale citing official docs",\\n' +
    '      "sourceCitation": "MDN Web Docs / Spec Section"\\n' +
    '    }\\n' +
    '  ]\\n' +
    '}';

  userPrompt = 'Generate a deep, diagnostic technical quiz covering Section ' + (section.code || '') + ': ' + (section.title || subject);
} else if (action === 'elaborate_concept') {
  const mode = body.mode === 'hint' ? 'hint' : 'deep_dive';
  const conceptTitle = String(body.conceptTitle || body.subject || 'Core Concept').trim();
  const difficultyTier = body.difficultyTier || 'intermediate';
  const sectionCode = body.sectionCode || '';
  const promptOrQuestion = body.promptOrQuestion || '';
  const answerOrExplanation = body.answerOrExplanation || '';
  const codeSnippet = body.codeSnippet || '';

  if (mode === 'hint') {
    systemPrompt = 'You are the StudyLM Pedagogical Technical Tutor.\\n' +
      'Your goal is to provide a targeted pedagogical HINT and mental-model clues for a technical software engineering concept or question WITHOUT giving away the final answer.\\n\\n' +
      'RULES:\\n' +
      '1. Provide a concise, clear hint in "summary".\\n' +
      '2. Provide 2 to 3 bulletPoints focusing on invariants, evaluation order, memory allocation, or boundary conditions to inspect.\\n' +
      '3. Provide a diagnostic codeSnippet showing the condition check or invariant assertion.\\n' +
      '4. Provide a 3-step mental model flowchart in "graph" (start, decision, end) with direction, nodes, and edges.\\n' +
      '5. Provide authoritative documentation links in "officialDocs".\\n' +
      '6. Output STRICT JSON ONLY matching this format:\\n' +
      '{\\n' +
      '  "mode": "hint",\\n' +
      '  "conceptTitle": "' + conceptTitle.replace(/"/g, '\\\\"') + '",\\n' +
      '  "summary": "1-2 sentence pedagogical clue focusing on specification behavior",\\n' +
      '  "bulletPoints": [\\n' +
      '    "First invariant to inspect...",\\n' +
      '    "Second runtime queue or memory behavior to test..."\\n' +
      '  ],\\n' +
      '  "codeSnippet": {\\n' +
      '    "code": "// Diagnostic check\\n...",\\n' +
      '    "language": "typescript",\\n' +
      '    "filename": "diagnostic-hint.ts",\\n' +
      '    "explanation": "Why this assertion tests the invariant"\\n' +
      '  },\\n' +
      '  "graph": {\\n' +
      '    "title": "Mental Model: ' + conceptTitle.replace(/"/g, '\\\\"') + '",\\n' +
      '    "description": "Step-by-step diagnostic reasoning",\\n' +
      '    "direction": "vertical",\\n' +
      '    "nodes": [\\n' +
      '      { "id": "1", "label": "Inspect Inputs", "subtext": "Value vs Reference check", "type": "start", "badge": "Step 1" },\\n' +
      '      { "id": "2", "label": "Evaluate Boundary Invariant", "subtext": "Queue scheduling or prototype lookup", "type": "decision", "badge": "Step 2" },\\n' +
      '      { "id": "3", "label": "Expected Specification Result", "subtext": "Matches official contract", "type": "end", "badge": "Outcome" }\\n' +
      '    ],\\n' +
      '    "edges": [\\n' +
      '      { "from": "1", "to": "2", "label": "Evaluate" },\\n' +
      '      { "from": "2", "to": "3", "label": "Condition verified" }\\n' +
      '    ]\\n' +
      '  },\\n' +
      '  "officialDocs": [\\n' +
      '    { "title": "Official Technical Documentation", "url": "https://developer.mozilla.org/en-US/" }\\n' +
      '  ]\\n' +
      '}';

    userPrompt = 'Provide a pedagogical hint and mental model for:\\n' +
      'Subject: ' + subject + '\\n' +
      'Concept: ' + conceptTitle + '\\n' +
      'Section: ' + sectionCode + '\\n' +
      'Question / Prompt: ' + promptOrQuestion + '\\n' +
      (codeSnippet ? ('Code:\\n' + codeSnippet) : '');
  } else {
    systemPrompt = 'You are the StudyLM Principal Systems Architect and Technical Educator.\\n' +
      'Your goal is to provide an in-depth, rigorous architectural deep dive for a technical software engineering concept.\\n\\n' +
      'RULES:\\n' +
      '1. Provide an authoritative, multi-sentence architectural breakdown in "summary".\\n' +
      '2. Provide 3 to 5 detailed bulletPoints analyzing specification invariants, runtime mechanics, memory allocation, scheduling/queues, and production failure modes.\\n' +
      '3. Provide a working, production-grade codeSnippet with comments and explanations.\\n' +
      '4. Provide a rich visual architectural lifecycle flowchart in "graph" with 3 to 5 nodes (start, process, decision, highlight, end) showing data flow or state transitions, with directed edges and condition labels.\\n' +
      '5. Provide canonical official documentation links (MDN, Angular.dev, RxJS docs, ECMAScript, RFCs) in "officialDocs".\\n' +
      '6. Output STRICT JSON ONLY matching this format:\\n' +
      '{\\n' +
      '  "mode": "deep_dive",\\n' +
      '  "conceptTitle": "' + conceptTitle.replace(/"/g, '\\\\"') + '",\\n' +
      '  "summary": "Authoritative architectural breakdown of the concept and its runtime mechanics",\\n' +
      '  "bulletPoints": [\\n' +
      '    "Specification Invariant: ...",\\n' +
      '    "Runtime & Scheduling: ...",\\n' +
      '    "Memory & Lifecycle: ...",\\n' +
      '    "Production Failure Mode / Gotcha: ..."\\n' +
      '  ],\\n' +
      '  "codeSnippet": {\\n' +
      '    "code": "// Production-grade TypeScript pattern\\n...",\\n' +
      '    "language": "typescript",\\n' +
      '    "filename": "architecture-pattern.ts",\\n' +
      '    "explanation": "Detailed explanation of why this pattern is resilient"\\n' +
      '  },\\n' +
      '  "graph": {\\n' +
      '    "title": "Architectural Lifecycle: ' + conceptTitle.replace(/"/g, '\\\\"') + '",\\n' +
      '    "description": "State transition and execution pipeline",\\n' +
      '    "direction": "vertical",\\n' +
      '    "nodes": [\\n' +
      '      { "id": "1", "label": "Method Invocation", "subtext": "Cold creation", "type": "start", "badge": "Step 1" },\\n' +
      '      { "id": "2", "label": "Subscription Pipeline", "subtext": "Instantiates handler", "type": "process", "badge": "Step 2" },\\n' +
      '      { "id": "3", "label": "Async I/O / Dispatch", "subtext": "Network / Task execution", "type": "decision", "badge": "Step 3" },\\n' +
      '      { "id": "4", "label": "Emission & Completion", "subtext": "next() and complete()", "type": "highlight", "badge": "Terminal" }\\n' +
      '    ],\\n' +
      '    "edges": [\\n' +
      '      { "from": "1", "to": "2", "label": "subscribe()" },\\n' +
      '      { "from": "2", "to": "3", "label": "Dispatch" },\\n' +
      '      { "from": "3", "to": "4", "label": "Success" }\\n' +
      '    ],\\n' +
      '    "rawMermaid": "graph TD\\\\n A[Step 1] --> B[Step 2]\\\\n B --> C[Step 3]\\\\n C --> D[Step 4]"\\n' +
      '  },\\n' +
      '  "officialDocs": [\\n' +
      '    { "title": "Official Guide", "url": "https://..." }\\n' +
      '  ]\\n' +
      '}';

    userPrompt = 'Provide an in-depth architectural breakdown and diagram for:\\n' +
      'Subject: ' + subject + '\\n' +
      'Concept: ' + conceptTitle + '\\n' +
      'Section: ' + sectionCode + '\\n' +
      'Question / Prompt: ' + promptOrQuestion + '\\n' +
      'Explanation / Grounding: ' + answerOrExplanation + '\\n' +
      (codeSnippet ? ('Code:\\n' + codeSnippet) : '');
  }
} else {
  systemPrompt = 'You are StudyLM pedagogical synthesizer. Synthesize study cards and quiz from the provided sources. Output valid JSON with overview, flashcards, quiz.';
  userPrompt = 'Subject: ' + subject + '\\n\\nSources: ' + JSON.stringify(body.sources || []);
}

return [{
  json: {
    action,
    subject,
    domain,
    sectionId: body.section?.id || '',
    groqPrimaryBody: {
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    },
    groqFailoverBody: {
      model: 'qwen/qwen3.8-27b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    }
  }
}];
`
        },
        id: "format-study-prompt",
        name: "Format Multi-AI Prompts",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [320, 300]
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true },
            conditions: [
              {
                leftValue: "={{ $json.action }}",
                rightValue: "ping",
                operator: { type: "string", operation: "equals" }
              }
            ],
            combinator: "and"
          }
        },
        id: "check-if-ping",
        name: "Is Ping Action?",
        type: "n8n-nodes-base.if",
        typeVersion: 2,
        position: [540, 300]
      },
      {
        parameters: {
          method: "POST",
          url: "https://api.groq.com/openai/v1/chat/completions",
          authentication: "predefinedCredentialType",
          nodeCredentialType: "groqApi",
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={{ JSON.stringify($json.groqPrimaryBody) }}",
          options: { timeout: 45000 }
        },
        id: "primary-groq-call",
        name: "Primary AI: Groq 120B",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [760, 200],
        onError: "continueErrorOutput",
        credentials: {
          groqApi: { id: "jVafRHRNVmsszaE8", name: "Groq" }
        }
      },
      {
        parameters: {
          method: "POST",
          url: "https://api.groq.com/openai/v1/chat/completions",
          authentication: "predefinedCredentialType",
          nodeCredentialType: "groqApi",
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={{ JSON.stringify($('Format Multi-AI Prompts').item.json.groqFailoverBody) }}",
          options: { timeout: 45000 }
        },
        id: "failover-groq-call",
        name: "Failover AI: Groq Qwen",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [980, 420],
        onError: "continueRegularOutput",
        credentials: {
          groqApi: { id: "jVafRHRNVmsszaE8", name: "Groq" }
        }
      },
      {
        parameters: {
          jsCode: `
const promptItem = $('Format Multi-AI Prompts').first()?.json || {};
const action = promptItem.action;

if (promptItem.isPing) {
  return [{ json: { ok: true, success: true, action: 'ping', latencyMs: 25, providers: promptItem.providers } }];
}

let rawOutput = '';
let providerUsed = 'Groq LPU (openai/gpt-oss-120b)';

// Check Primary AI output
try {
  if ($('Primary AI: Groq 120B').isExecuted) {
    const res = $('Primary AI: Groq 120B').first()?.json;
    if (res && res.choices && res.choices[0]?.message?.content) {
      rawOutput = res.choices[0].message.content;
    }
  }
} catch (e) {
  // Ignored, proceed to failover
}

// Check Failover AI if Primary failed
if (!rawOutput.trim()) {
  try {
    if ($('Failover AI: Groq Qwen').isExecuted) {
      const res = $('Failover AI: Groq Qwen').first()?.json;
      if (res && res.choices && res.choices[0]?.message?.content) {
        rawOutput = res.choices[0].message.content;
        providerUsed = 'Groq LPU (qwen/qwen3.8-27b)';
      }
    }
  } catch (e) {
    // Failover also errored
  }
}

if (!rawOutput.trim()) {
  throw new Error('All AI models temporarily unavailable or returned empty output.');
}

// Strip markdown fences if present
let cleanJson = rawOutput.trim();
if (cleanJson.startsWith('\`\`\`')) {
  cleanJson = cleanJson.replace(/^\`\`\`(?:json)?\\s*/i, '').replace(/\`\`\`\\s*$/, '');
}
const firstB = cleanJson.indexOf('{');
const lastB = cleanJson.lastIndexOf('}');
if (firstB !== -1 && lastB !== -1) {
  cleanJson = cleanJson.substring(firstB, lastB + 1);
}

const parsed = JSON.parse(cleanJson);

return [{
  json: {
    success: true,
    provider: providerUsed,
    timestamp: new Date().toISOString(),
    ...parsed
  }
}];
`
        },
        id: "parse-and-normalize",
        name: "Parse & Normalize Response",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [1200, 300]
      },
      {
        parameters: {
          respondWith: "json",
          responseBody: "={{ $json }}",
          options: {
            responseCode: 200,
            responseHeaders: {
              entries: [
                { name: "Access-Control-Allow-Origin", value: "*" },
                { name: "Access-Control-Allow-Headers", value: "*" },
                { name: "Access-Control-Allow-Methods", value: "POST, OPTIONS" }
              ]
            }
          }
        },
        id: "respond-webhook",
        name: "Respond Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1.1,
        position: [1420, 300]
      }
    ],
    connections: {
      "Webhook Ingest": {
        main: [[{ node: "Format Multi-AI Prompts", type: "main", index: 0 }]]
      },
      "Format Multi-AI Prompts": {
        main: [[{ node: "Is Ping Action?", type: "main", index: 0 }]]
      },
      "Is Ping Action?": {
        main: [
          [{ node: "Parse & Normalize Response", type: "main", index: 0 }],
          [{ node: "Primary AI: Groq 120B", type: "main", index: 0 }]
        ]
      },
      "Primary AI: Groq 120B": {
        main: [
          [{ node: "Parse & Normalize Response", type: "main", index: 0 }],
          [{ node: "Failover AI: Groq Qwen", type: "main", index: 0 }]
        ]
      },
      "Failover AI: Groq Qwen": {
        main: [[{ node: "Parse & Normalize Response", type: "main", index: 0 }]]
      },
      "Parse & Normalize Response": {
        main: [[{ node: "Respond Webhook", type: "main", index: 0 }]]
      }
    }
  }
];

writeFileSync('tools/scripts/studylm_workflow.json', JSON.stringify(workflow, null, 2));
console.log('Generated tools/scripts/studylm_workflow.json successfully.');
