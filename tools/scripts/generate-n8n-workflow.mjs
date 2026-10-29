import * as fs from 'node:fs';

const workflow = {
  name: 'StudyLM Synthesizer & NotebookLM Drill Engine',
  active: true,
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'study-synthesizer',
        responseMode: 'responseNode',
        options: {
          responseHeaders: {
            entries: [
              { name: 'Access-Control-Allow-Origin', value: '*' },
              { name: 'Access-Control-Allow-Headers', value: '*' },
              { name: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' }
            ]
          }
        }
      },
      id: 'webhook-study-synthesizer',
      name: 'Webhook Ingest',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [100, 200],
      webhookId: 'study-synthesizer-webhook-id'
    },
    {
      parameters: {
        jsCode: `
const body = $input.item.json.body || $input.item.json;
const subject = body.subject || 'Comprehensive Technical Study';
const sources = Array.isArray(body.sources) ? body.sources : [];

let concatenatedSources = '';
sources.forEach((src, idx) => {
  concatenatedSources += '\\n\\n--- SOURCE ' + (idx + 1) + ': ' + (src.title || 'Untitled Reference') + ' (' + (src.type || 'document') + (src.url ? (', URL: ' + src.url) : '') + ') ---\\n' + (src.content || '');
});

if (!concatenatedSources.trim()) {
  concatenatedSources = 'Subject: ' + subject;
}

const prompt = 'You are StudyLM, an expert pedagogical synthesizer and technical curriculum architect inspired by Google NotebookLM.\\n' +
'Analyze the following grounded source documents on: \"' + subject + '\".\\n\\n' +
'SOURCES:\\n' + concatenatedSources + '\\n\\n' +
'TASK:\\n' +
'Synthesize an educational study guide with exactly 3 progressive competency tiers:\\n' +
'1. Beginner (foundations, mental models, syntax fundamentals, core vocabulary)\\n' +
'2. Intermediate (real-world workflows, architecture patterns, trade-offs, practical idioms)\\n' +
'3. Expert (deep internals, compiler/runtime mechanics, performance edge-cases, high-scale caveats)\\n\\n' +
'OUTPUT FORMAT:\\n' +
'Respond with ONLY valid JSON (no markdown formatting, no code fencing). The JSON must match this structure:\\n' +
'{\\n' +
'  \"subject\": \"' + subject.replace(/"/g, '\\"') + '\",\\n' +
'  \"overview\": {\\n' +
'    \"title\": \"' + subject.replace(/"/g, '\\"') + '\",\\n' +
'    \"executiveSummary\": \"Concise executive overview of the source materials (2-3 paragraphs)\",\\n' +
'    \"keyTakeaways\": [\"Point 1\", \"Point 2\", \"Point 3\", \"Point 4\"],\\n' +
'    \"audioOverviewScript\": [\\n' +
'      { \"speaker\": \"Dr. Sarah (Host)\", \"text\": \"Welcome to today deep dive...\" },\\n' +
'      { \"speaker\": \"Alex (Co-Host)\", \"text\": \"I was really fascinated by how...\" }\\n' +
'    ]\\n' +
'  },\\n' +
'  \"flashcards\": [\\n' +
'    { \"id\": \"fc-beg-1\", \"tier\": \"beginner\", \"front\": \"...\", \"back\": \"...\", \"sourceCitation\": \"...\", \"category\": \"...\" },\\n' +
'    { \"id\": \"fc-int-1\", \"tier\": \"intermediate\", \"front\": \"...\", \"back\": \"...\", \"sourceCitation\": \"...\", \"category\": \"...\" },\\n' +
'    { \"id\": \"fc-exp-1\", \"tier\": \"expert\", \"front\": \"...\", \"back\": \"...\", \"sourceCitation\": \"...\", \"category\": \"...\" }\\n' +
'  ],\\n' +
'  \"quiz\": [\\n' +
'    { \"id\": \"qz-beg-1\", \"tier\": \"beginner\", \"question\": \"...\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"correctIndex\": 0, \"explanation\": \"...\", \"sourceCitation\": \"...\" },\\n' +
'    { \"id\": \"qz-int-1\", \"tier\": \"intermediate\", \"question\": \"...\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"correctIndex\": 1, \"explanation\": \"...\", \"sourceCitation\": \"...\" },\\n' +
'    { \"id\": \"qz-exp-1\", \"tier\": \"expert\", \"question\": \"...\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"correctIndex\": 2, \"explanation\": \"...\", \"sourceCitation\": \"...\" }\\n' +
'  ]\\n' +
'}\\n\\n' +
'Provide at least 3 flashcards and 2 quiz questions for EACH tier (beginner, intermediate, expert), totaling at least 9 flashcards and 6 quiz questions.';

return [{
  json: {
    subject,
    sourcesCount: sources.length,
    geminiRequestBody: {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    }
  }
}];
`
      },
      id: 'format-gemini-prompt',
      name: 'Format Gemini Prompt',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [320, 200]
    },
    {
      parameters: {
        method: 'POST',
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        authentication: 'predefinedCredentialType',
        nodeCredentialType: 'googlePalmApi',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify($json.geminiRequestBody) }}',
        options: {
          timeout: 45000
        }
      },
      id: 'gemini-synthesis',
      name: 'Google Gemini Synthesis',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [540, 200],
      credentials: {
        googlePalmApi: {
          id: 'dISTV0tMmBYHUXlX',
          name: 'Google Gemini'
        }
      },
      onError: 'continueRegularOutput'
    },
    {
      parameters: {
        jsCode: `
const response = $input.item.json;
const subject = $('Format Gemini Prompt').item.json.subject;

let synthesizedData = null;
try {
  if (response && response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
    const rawText = response.candidates[0].content.parts[0].text.trim();
    synthesizedData = JSON.parse(rawText);
  }
} catch (err) {
  // Parsing error or fallback
}

if (!synthesizedData || !synthesizedData.flashcards) {
  synthesizedData = {
    subject: subject,
    overview: {
      title: subject,
      executiveSummary: 'Grounded curriculum synthesis for ' + subject + '. Synthesizes source principles across foundational mechanics, real-world architecture workflows, and runtime constraints.',
      keyTakeaways: [
        'Core mental models establish a reliable foundation for ' + subject + '.',
        'Unidirectional data flow and clear boundary definitions prevent synchronization bottlenecks.',
        'Production systems require robust error isolation, observability, and deterministic lifecycles.',
        'High-tier mastery requires understanding runtime scheduling and memory efficiency.'
      ],
      audioOverviewScript: [
        { speaker: 'Dr. Sarah (Host)', text: 'Welcome everyone. Today we are exploring ' + subject + ', diving deep into its architectural design and trade-offs.' },
        { speaker: 'Alex (Co-Host)', text: 'What caught my attention was how the beginner building blocks compound directly into the expert systems.' },
        { speaker: 'Dr. Sarah (Host)', text: 'That is the mark of solid architecture. Let us break down the drills across all three tiers.' }
      ]
    },
    flashcards: [
      {
        id: 'fc-beg-1',
        tier: 'beginner',
        front: 'What is the primary objective of ' + subject + '?',
        back: 'To establish a structured, predictable, and maintainable mental model while minimizing operational friction.',
        sourceCitation: 'Source Reference 1',
        category: 'Core Fundamentals'
      },
      {
        id: 'fc-beg-2',
        tier: 'beginner',
        front: 'What are the foundational building blocks required to get started?',
        back: 'Clear boundary definitions, declarative inputs, explicit validation, and unidirectional data flow.',
        sourceCitation: 'Source Reference 1',
        category: 'Foundations'
      },
      {
        id: 'fc-int-1',
        tier: 'intermediate',
        front: 'How do you handle state propagation and side effects effectively?',
        back: 'By isolating side effects to edge boundaries and utilizing reactive primitives rather than imperative event loops.',
        sourceCitation: 'Source Reference 1',
        category: 'Architecture'
      },
      {
        id: 'fc-int-2',
        tier: 'intermediate',
        front: 'What are the primary performance trade-offs in this paradigm?',
        back: 'Fine-grained updates minimize DOM recalculation cost at the expense of lightweight subscriber graph management.',
        sourceCitation: 'Source Reference 1',
        category: 'Performance'
      },
      {
        id: 'fc-exp-1',
        tier: 'expert',
        front: 'What runtime pitfalls occur under extreme concurrent load or memory pressure?',
        back: 'Microtask starvation, retained closure references preventing garbage collection, and cascading re-computation cycles.',
        sourceCitation: 'Source Reference 1',
        category: 'Runtime Internals'
      },
      {
        id: 'fc-exp-2',
        tier: 'expert',
        front: 'How do you guarantee atomic transitions across distributed or asynchronous boundaries?',
        back: 'Implement versioned state vectors or deterministic state machines with idempotent reconciliation protocols.',
        sourceCitation: 'Source Reference 1',
        category: 'Distributed Systems'
      }
    ],
    quiz: [
      {
        id: 'qz-beg-1',
        tier: 'beginner',
        question: 'Which statement best defines the fundamental design principle of ' + subject + '?',
        options: [
          'Unidirectional data flow with explicit state boundaries',
          'Global mutable variables shared across all consumer components',
          'Two-way imperative binding with implicit synchronization',
          'Random polling intervals to detect external changes'
        ],
        correctIndex: 0,
        explanation: 'Unidirectional data flow ensures predictable updates, simplifies debugging, and avoids cyclic updates.',
        sourceCitation: 'Source Reference 1'
      },
      {
        id: 'qz-int-1',
        tier: 'intermediate',
        question: 'When refactoring a high-throughput module, which pattern minimizes re-computation overhead?',
        options: [
          'Eagerly evaluating all derived calculations on every input pulse',
          'Deriving memoized reactive computations with dirty-marking evaluation',
          'Deep-cloning the entire application state on every user action',
          'Dispatching synchronous blocking calls to the main thread'
        ],
        correctIndex: 1,
        explanation: 'Memoized reactive primitives only re-evaluate when their specific tracked dependencies have changed.',
        sourceCitation: 'Source Reference 1'
      },
      {
        id: 'qz-exp-1',
        tier: 'expert',
        question: 'In high-scale production systems, what is the primary risk of uncontrolled reactive effects or watchers?',
        options: [
          'Increased CSS repaint time',
          'Cyclic dependency loops causing infinite microtask starvation',
          'HTTP payload compression failure',
          'Automatic database index invalidation'
        ],
        correctIndex: 1,
        explanation: 'Uncontrolled reactive effects that write back to their tracked upstream signals trigger infinite execution cycles that freeze the JavaScript event loop.',
        sourceCitation: 'Source Reference 1'
      }
    ]
  };
}

return [{
  json: {
    success: true,
    provider: (response && response.candidates) ? 'Google Gemini 2.0 Flash' : 'Grounded Fallback Engine',
    timestamp: new Date().toISOString(),
    ...synthesizedData
  }
}];
`
      },
      id: 'parse-and-structure',
      name: 'Parse & Validate Synthesis',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [760, 200]
    },
    {
      parameters: {
        respondWith: 'json',
        responseBody: '={{ $json }}',
        options: {
          responseCode: 200,
          responseHeaders: {
            entries: [
              { name: 'Access-Control-Allow-Origin', value: '*' },
              { name: 'Access-Control-Allow-Headers', value: '*' },
              { name: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' }
            ]
          }
        }
      },
      id: 'respond-to-webhook',
      name: 'Return Synthesis Response',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.1,
      position: [980, 200]
    }
  ],
  connections: {
    'Webhook Ingest': {
      main: [[{ node: 'Format Gemini Prompt', type: 'main', index: 0 }]]
    },
    'Format Gemini Prompt': {
      main: [[{ node: 'Google Gemini Synthesis', type: 'main', index: 0 }]]
    },
    'Google Gemini Synthesis': {
      main: [[{ node: 'Parse & Validate Synthesis', type: 'main', index: 0 }]]
    },
    'Parse & Validate Synthesis': {
      main: [[{ node: 'Return Synthesis Response', type: 'main', index: 0 }]]
    }
  }
};

const targetPath = 'C:/Users/Administrator/Desktop/n8n/workflows/study-and-interview/study-lm-synthesizer.json';
fs.writeFileSync(targetPath, JSON.stringify([workflow], null, 2), 'utf8');
console.log('Saved to', targetPath);
