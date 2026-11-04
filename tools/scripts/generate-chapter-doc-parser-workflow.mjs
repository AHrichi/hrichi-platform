import * as fs from 'node:fs';
import * as path from 'node:path';

const workflow = {
  id: '1nT7usBnNIeNWKP4',
  name: 'Chapter Syllabus & Document Parser for Nightly Alarm Engine',
  active: true,
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'parse-chapter-doc',
        responseMode: 'responseNode',
        options: {
          responseHeaders: {
            entries: [
              { name: 'Access-Control-Allow-Origin', value: '*' },
              { name: 'Access-Control-Allow-Headers', value: '*' },
              { name: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
            ],
          },
        },
      },
      id: 'webhook-doc-in',
      name: 'Webhook Ingest',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [100, 300],
      webhookId: 'chapter-doc-parser-webhook-id',
    },
    {
      parameters: {
        jsCode: `
const item = $input.item;
const json = item.json || {};
const binary = item.binary || {};
const body = json.body || json;

// Handle CORS Preflight / Ping
if (json.headers && (json.headers['x-http-method-override'] === 'OPTIONS' || json.method === 'OPTIONS')) {
  return [{
    json: {
      ok: true,
      isOptions: true,
      service: 'Universal AI Chapter Doc Parser'
    }
  }];
}

if (body.action === 'ping' || body.ping === true) {
  return [{
    json: {
      ok: true,
      isPing: true,
      service: 'Universal AI Chapter Doc Parser',
      version: '3.0.0',
      aiEngine: 'Groq (qwen/qwen3.8-27b / gpt-oss-120b) + Pure JS Fallback',
      supportedFormats: [
        '.md', '.markdown', '.pdf', '.docx', '.doc', '.xlsx', '.xls',
        '.pptx', '.ppt', '.csv', '.tsv', '.txt', '.rtf', '.json',
        '.html', '.xml', 'any file (*/*)'
      ]
    }
  }];
}

let fileName = body.fileName || 'document.txt';
let mimeType = body.mimeType || 'text/plain';
let userPrompt = String(body.userPrompt || body.instruction || body.prompt || '').trim();
let docText = '';

// 1. Check for rawText payload
if (body.rawText || body.text || body.content || body.syllabus) {
  docText = String(body.rawText || body.text || body.content || body.syllabus).trim();
}

// 2. Check for binary file
if (!docText) {
  const binaryKeys = Object.keys(binary);
  if (binaryKeys.length > 0) {
    const bin = binary[binaryKeys[0]];
    fileName = bin.fileName || fileName;
    mimeType = bin.mimeType || mimeType;
    userPrompt = userPrompt || String(body.userPrompt || '').trim();
    const buf = Buffer.from(bin.data, 'base64');
    
    // Pure JS text / string extraction without disallowed native modules like zlib
    const raw = buf.toString('utf8');
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    
    if (ext === 'rtf' || raw.startsWith('{\\\\rtf')) {
      docText = raw
        .replace(/\\\\(?:[a-zA-Z]+-?\\d*|[^\\r\\n])/g, ' ')
        .replace(/[{}]/g, ' ');
    } else if (ext === 'html' || ext === 'htm' || raw.includes('<html') || raw.includes('</div>')) {
      docText = raw
        .replace(/<script[\\s\\S]*?<\\/script>/gi, '')
        .replace(/<style[\\s\\S]*?<\\/style>/gi, '')
        .replace(/<[^>]+>/g, '\\n');
    } else {
      // Check if predominantly text or binary
      let nonPrintable = 0;
      const sample = Math.min(buf.length, 500);
      for (let i = 0; i < sample; i++) {
        const b = buf[i];
        if (b < 9 || (b > 13 && b < 32)) nonPrintable++;
      }
      
      if (nonPrintable / sample > 0.15) {
        // Binary file: extract clean printable text chunks
        const strings = [];
        let cur = '';
        for (let i = 0; i < buf.length; i++) {
          const b = buf[i];
          if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b >= 160) {
            cur += String.fromCharCode(b);
          } else {
            if (cur.trim().length >= 3) strings.push(cur.trim());
            cur = '';
          }
        }
        if (cur.trim().length >= 3) strings.push(cur.trim());
        docText = strings.filter(s => s.length >= 3 && !s.match(/^[^\\w\\s]+$/) && !s.startsWith('<?xml')).join('\\n');
      } else {
        docText = raw;
      }
    }
  } else if (body.fileBase64) {
    const rawB64 = String(body.fileBase64);
    const cleanB64 = rawB64.includes(',') ? rawB64.split(',')[1] : rawB64;
    const buf = Buffer.from(cleanB64, 'base64');
    docText = buf.toString('utf8');
  }
}

docText = (docText || '').trim();

// Prepare AI Prompt Payload
const promptInstruction = userPrompt
  ? ('User specific instruction: ' + userPrompt + '\\nFollow this instruction strictly when extracting and filtering chapters.\\n\\n')
  : '';

const groqPayload = {
  model: 'qwen/qwen3.8-27b',
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content: 'You are an expert curriculum assistant for the Nightly Alarm Engine study system. Extract the course/topic title (topicName), a concise 1-2 sentence overview (topicDescription), and an array of progressive study chapters (each with chapterNumber: integer, title: string, and optional errorNotes for key focus areas). Return strictly a valid JSON object matching: { \\"topicName\\": string, \\"topicDescription\\": string, \\"chapters\\": [{ \\"chapterNumber\\": number, \\"title\\": string, \\"errorNotes\\": string }] }'
    },
    {
      role: 'user',
      content: promptInstruction + 'Document Content (' + fileName + '):\\n' + (docText.slice(0, 15000) || 'Empty document')
    }
  ]
};

return [{
  json: {
    fileName,
    userPrompt,
    docText,
    topicNameHint: body.topicName || '',
    topicDescriptionHint: body.topicDescription || '',
    groqPayload
  }
}];
`,
      },
      id: 'prepare-ai-prompt',
      name: 'Extract Text & Prepare AI',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [340, 300],
    },
    {
      parameters: {
        method: 'POST',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        authentication: 'predefinedCredentialType',
        nodeCredentialType: 'groqApi',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify($json.groqPayload) }}',
        options: {
          timeout: 25000,
        },
      },
      id: 'ai-curriculum-groq',
      name: 'AI Curriculum Extraction (Groq)',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [580, 300],
      onError: 'continueRegularOutput',
      credentials: {
        groqApi: {
          id: 'jVafRHRNVmsszaE8',
          name: 'Groq',
        },
      },
    },
    {
      parameters: {
        jsCode: `
const prepItem = $('Extract Text & Prepare AI').first()?.json || {};
const aiItem = $input.first()?.json || {};

// Check if this was OPTIONS or ping
if (prepItem.isOptions || prepItem.isPing) {
  return [{ json: prepItem }];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const todayStr = new Date().toISOString().split('T')[0];
let topicName = prepItem.topicNameHint || '';
let topicDescription = prepItem.topicDescriptionHint || '';
let parsedChapters = [];
let aiUsed = false;

// 1. Try parsing Groq AI Response
try {
  let content = null;
  if (aiItem && aiItem.choices && aiItem.choices[0] && aiItem.choices[0].message) {
    content = aiItem.choices[0].message.content;
  }
  
  if (content) {
    const aiJson = typeof content === 'object' ? content : JSON.parse(content);
    if (aiJson && Array.isArray(aiJson.chapters) && aiJson.chapters.length > 0) {
      topicName = aiJson.topicName || topicName;
      topicDescription = aiJson.topicDescription || topicDescription;
      parsedChapters = aiJson.chapters.map((c, idx) => ({
        chapterNumber: c.chapterNumber || (idx + 1),
        title: (c.title || ('Chapter ' + (idx + 1))).trim(),
        subtopics: Array.isArray(c.subtopics) ? c.subtopics : [],
        errorNotes: c.errorNotes || ''
      }));
      aiUsed = true;
    }
  }
} catch (e) {
  // Fall through to regex rule-based parser
}

// 2. Fallback Rule-based Parser if AI was not usable or returned empty
if (parsedChapters.length === 0) {
  const text = prepItem.docText || '';
  const lines = text.split(/\\r?\\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  if (!topicName) {
    for (const line of lines.slice(0, 10)) {
      const courseMatch = line.match(/^(?:course|subject|topic|syllabus|book|module|title)\\s*[:\\-–—]\\s*(.+)$/i);
      if (courseMatch) {
        topicName = courseMatch[1].trim();
        break;
      }
    }
  }
  if (!topicName) {
    topicName = (prepItem.fileName || 'Technical Course').replace(/\\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  }

  const CHAPTER_REGEXES = [
    /^(?:chapter|ch\\.?|chap\\.?|module|unit|lecture|part|section|week|day|slide|topic)\\s*(\\d+|[IVXLCDM]+)[\\s:.\-–—]+(.*)$/i,
    /^(\\d{1,3})[\\.\\)\\:\\-–—\\s]\\s*(.*)$/,
    /^#{1,4}\\s+(?:(?:chapter|ch\\.?|slide|module|lecture)\\s*(\\d+)[\\s:.\-–—]+)?(.*)$/i
  ];

  let autoIndex = 1;
  for (const line of lines) {
    if (line.match(/^(?:table of contents|contents|index|syllabus|overview|description|abstract)$/i)) continue;
    if (line.match(/^page\\s*\\d+/i)) continue;
    if (line.match(/^(?:chapter|ch|id|no|#|num|number)\\s*[,;\\t]\\s*(?:title|name|topic)/i)) continue;
    if (topicName && line.toLowerCase() === topicName.toLowerCase()) continue;

    let cleanLine = line.replace(/^#{1,6}\\s+/, '').replace(/^[-*•+]\\s+/, '').replace(/^["']|["']$/g, '').trim();
    let matched = false;
    let chNum = autoIndex;
    let chTitle = '';

    for (const re of CHAPTER_REGEXES) {
      const m = cleanLine.match(re);
      if (m) {
        if (m.length === 3) {
          const num = parseInt(m[1], 10);
          chNum = isNaN(num) ? autoIndex : num;
          chTitle = m[2].trim();
        } else {
          chNum = autoIndex;
          chTitle = m[1].trim();
        }
        matched = true;
        break;
      }
    }

    if (matched && chTitle.length >= 2) {
      chTitle = chTitle.replace(/^[:.\\-–—)]\\s*/, '').replace(/^["']|["']$/g, '').trim();
      parsedChapters.push({
        chapterNumber: chNum,
        title: chTitle,
        subtopics: [],
        errorNotes: ''
      });
      autoIndex = chNum + 1;
    }
  }

  // Fallback to non-empty lines
  if (parsedChapters.length === 0) {
    let fallbackIndex = 1;
    for (const line of lines) {
      const clean = line.replace(/^[-*•#\\d.\\s]+/, '').replace(/^["']|["']$/g, '').trim();
      if (clean.length > 3 && clean.length < 120 && !clean.match(/^(?:table of contents|contents|syllabus|overview)/i)) {
        parsedChapters.push({
          chapterNumber: fallbackIndex++,
          title: clean,
          subtopics: [],
          errorNotes: ''
        });
      }
    }
  }

  if (!topicDescription && parsedChapters.length > 0) {
    const sample = parsedChapters.slice(0, 3).map(c => c.title).join(', ');
    topicDescription = 'Curriculum covering ' + parsedChapters.length + ' chapters including ' + sample + '.';
  }
}

// Format outline text
const outlineText = parsedChapters
  .map(c => c.chapterNumber + '. ' + c.title)
  .join('\\n');

// Format complete domain chapters for Alarm Engine
const finalChapters = parsedChapters.map((c) => {
  const studyDate = todayStr;
  return {
    chapterNumber: c.chapterNumber,
    title: c.title,
    topicName: topicName || 'Technical Course',
    originalStudyDate: studyDate,
    d3Date: addDays(studyDate, 3),
    d7Date: addDays(studyDate, 7),
    d14Date: addDays(studyDate, 14),
    d3Completed: false,
    d7Completed: false,
    d14Completed: false,
    quizScorePercent: 85,
    quizQuestionsMissed: 0,
    isWeak: false,
    codingCarryover: false,
    errorNotes: c.errorNotes || ''
  };
});

if (finalChapters.length === 0) {
  return [{
    json: {
      success: false,
      error: 'Could not extract chapters from the document. Please provide readable text or refine prompt.',
      totalChapters: 0,
      chapters: [],
      outlineText: ''
    }
  }];
}

return [{
  json: {
    success: true,
    aiUsed,
    userPrompt: prepItem.userPrompt || '',
    topicName: topicName || 'Technical Course',
    topicDescription,
    totalChapters: finalChapters.length,
    outlineText,
    chapters: finalChapters,
    fileName: prepItem.fileName,
    parsedAt: new Date().toISOString()
  }
}];
`,
      },
      id: 'format-ai-response',
      name: 'Format & Normalize Curriculum',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [820, 300],
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
              { name: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
              { name: 'Content-Type', value: 'application/json' },
            ],
          },
        },
      },
      id: 'respond-webhook',
      name: 'Return Structured Chapters',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.1,
      position: [1060, 300],
    },
  ],
  connections: {
    'Webhook Ingest': {
      main: [[{ node: 'Extract Text & Prepare AI', type: 'main', index: 0 }]],
    },
    'Extract Text & Prepare AI': {
      main: [[{ node: 'AI Curriculum Extraction (Groq)', type: 'main', index: 0 }]],
    },
    'AI Curriculum Extraction (Groq)': {
      main: [[{ node: 'Format & Normalize Curriculum', type: 'main', index: 0 }]],
    },
    'Format & Normalize Curriculum': {
      main: [[{ node: 'Return Structured Chapters', type: 'main', index: 0 }]],
    },
  },
};

const outputDir = path.resolve('tools/n8n/workflows');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'chapter-doc-parser.json');
const workflowJsonString = JSON.stringify([workflow], null, 2);
fs.writeFileSync(outputPath, workflowJsonString, 'utf8');
console.log('✓ n8n AI Chapter Doc Parser workflow generated successfully at:', outputPath);

// Also sync with the domain bundled raw file for 1-click in-app download
const rawTsPath = path.resolve('libs/products/alarm-engine/domain/src/lib/n8n-workflow-raw.ts');
fs.writeFileSync(
  rawTsPath,
  `export const CHAPTER_DOC_PARSER_RAW_JSON = ${JSON.stringify(workflowJsonString)};\n`,
  'utf8',
);
console.log('✓ n8n Chapter Doc Parser bundled raw TS updated at:', rawTsPath);
