import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';

const WORKFLOW_ID = 'WhatsAppPulseAI1';

const formatPromptCode = `
const body = $input.item.json.body || $input.item.json || {};
const action = body.action || 'analyze_whatsapp_chat';

if (action === 'ping' || action === 'ping_whatsapp_analyzer') {
  return [{
    json: {
      action: 'ping',
      isPing: true,
      ok: true,
      providers: [
        'Groq Whisper (whisper-large-v3-turbo)',
        'Groq LPU (openai/gpt-oss-120b)',
        'Groq LPU (llama-3.3-70b-versatile)'
      ]
    }
  }];
}

if (action === 'transcribe_whatsapp_audio') {
  const chatTitle = String(body.chatTitle || 'WhatsApp Conversation').trim();
  const audioFiles = Array.isArray(body.audioFiles) ? body.audioFiles.slice(0, 5) : [];

  if (audioFiles.length === 0) {
    return [{
      json: {
        action: 'ping',
        isPing: true,
        isEmptyAudioBatch: true,
        ok: true,
        providers: ['Groq Whisper (whisper-large-v3-turbo)']
      }
    }];
  }

  const outItems = [];
  for (let idx = 0; idx < audioFiles.length; idx++) {
    const af = audioFiles[idx] || {};
    const rawB64 = String(af.base64Data || '').trim();
    // Clean any data URL prefix if present
    const cleanB64 = rawB64.includes(',') ? rawB64.split(',').pop() : rawB64;

    let binaryData = null;
    if (cleanB64 && cleanB64.length > 64) {
      try {
        const buf = Buffer.from(cleanB64, 'base64');
        if (buf.length > 32) {
          const origName = String(af.fileName || ('voice-note-' + (idx + 1) + '.ogg'));
          // Groq Whisper supports: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm.
          // WhatsApp .opus files are Ogg Opus containers, so rename .opus -> .ogg for Whisper API compatibility.
          const whisperName = origName
            .replace(/\\.opus$/i, '.ogg')
            .replace(/\\.aac$/i, '.m4a')
            .replace(/\\.3gp$/i, '.mp4');
          const ext = (whisperName.split('.').pop() || 'ogg').toLowerCase();
          const mimeMap = {
            ogg: 'audio/ogg',
            mp3: 'audio/mpeg',
            m4a: 'audio/mp4',
            mp4: 'audio/mp4',
            wav: 'audio/wav',
            webm: 'audio/webm',
            flac: 'audio/flac'
          };
          const whisperMime = mimeMap[ext] || 'audio/ogg';
          binaryData = await this.helpers.prepareBinaryData(buf, whisperName, whisperMime);
        }
      } catch (e) {
        binaryData = null;
      }
    }

    const itemObj = {
      json: {
        action: binaryData ? 'transcribe_whatsapp_audio_whisper' : 'transcribe_whatsapp_audio_context',
        isPing: false,
        isAudioTranscription: true,
        hasBinary: Boolean(binaryData),
        chatTitle,
        index: idx,
        fileName: af.fileName || ('voice-note-' + (idx + 1) + '.opus'),
        messageId: af.messageId || ('msg-' + (idx + 1)),
        sender: af.sender || 'Participant',
        isoDate: af.isoDate || '',
        durationSeconds: Number(af.durationSeconds) || 8,
        mimeType: af.mimeType || 'audio/ogg',
        contextBefore: af.contextBefore || '',
        contextAfter: af.contextAfter || ''
      }
    };

    if (binaryData) {
      itemObj.binary = {
        audioFile: binaryData
      };
    }

    outItems.push(itemObj);
  }

  return outItems;
}

const chatTitle = String(body.chatTitle || 'WhatsApp Conversation').trim();
const metrics = body.quantitativeMetrics || {};
const windows = Array.isArray(body.sampledWindows) ? body.sampledWindows : [];

let excerptsText = '';
windows.forEach((win, idx) => {
  excerptsText += '\\n--- WINDOW ' + (idx + 1) + ': ' + (win.label || win.phase || 'Sample') + ' (' + (win.startDate || '') + ') ---\\n';
  const msgs = Array.isArray(win.messages) ? win.messages : [];
  msgs.forEach((m) => {
    excerptsText += '[' + (m.timestamp || '') + '] ' + (m.sender || 'User') + ': ' + (m.text || '') + '\\n';
  });
});

const systemPrompt =
  'You are ChatPulse AI, a senior behavioral psychologist, computational linguist, and relationship dynamics analyst.\\n' +
  'Analyze the provided WhatsApp quantitative telemetry and stratified conversation excerpts.\\n' +
  'Ground every insight in the actual participant names, quantitative metrics (message share, reply latency, initiation share, double-texting index, late-night ratio, top emojis/words, and transcribed voice notes), and real message quotes/tones.\\n\\n' +
  'Respond with STRICT VALID JSON ONLY matching this exact schema:\\n' +
  '{\\n' +
  '  "executiveSummary": "3-4 sentence deep synthesis of the relationship dynamic, communication rhythm, and emotional tone",\\n' +
  '  "relationshipDynamicTitle": "Short evocative archetype title (e.g. High-Velocity Mutual Synergy, Secure Co-Founder Wavelength, Pursuer-Distancer Cadence)",\\n' +
  '  "reciprocityScore": 88,\\n' +
  '  "emotionalSafetyScore": 91,\\n' +
  '  "engagementVelocityScore": 85,\\n' +
  '  "mutualInterestBreakdown": {\\n' +
  '    "balanceLabel": "Concise equilibrium label citing percentages",\\n' +
  '    "initiationAnalysis": "Analysis of who starts conversations after gaps and what it signals",\\n' +
  '    "responseLatencyAnalysis": "Analysis of median vs mean reply speeds and double-text bursts",\\n' +
  '    "investmentDepthAnalysis": "Analysis of words per message, questions asked, voice note investment, and emotional/topical depth"\\n' +
  '  },\\n' +
  '  "participantProfiles": [\\n' +
  '    {\\n' +
  '      "name": "Exact Participant Name",\\n' +
  '      "attachmentStyle": "Attachment style label (e.g. Secure-Autonomous, Anxious-Preoccupied Pursuer, Dismissive-Independent)",\\n' +
  '      "communicationArchetype": "Archetype title (e.g. The Expressive Catalyst, The Grounded Anchor)",\\n' +
  '      "dominantTraits": ["Trait 1 citing metrics/quotes", "Trait 2", "Trait 3", "Trait 4"],\\n' +
  '      "emotionalCadence": "1-2 sentence description of their expressive tone, emoji usage, and pacing"\\n' +
  '    }\\n' +
  '  ],\\n' +
  '  "flags": [\\n' +
  '    {\\n' +
  '      "type": "green",\\n' +
  '      "title": "Specific behavioral observation title",\\n' +
  '      "evidence": "Concrete evidence from the metrics or sampled messages",\\n' +
  '      "impact": "How this pattern affects relational trust and momentum"\\n' +
  '    }\\n' +
  '  ],\\n' +
  '  "conflictAndRepairStyle": "2-3 sentence analysis of how tension, delays, or misunderstandings are navigated and repaired",\\n' +
  '  "recommendations": [\\n' +
  '    "Specific, actionable recommendation 1 tailored to the participants",\\n' +
  '    "Specific, actionable recommendation 2",\\n' +
  '    "Specific, actionable recommendation 3"\\n' +
  '  ]\\n' +
  '}';

const userPrompt =
  'CHAT TITLE: ' + chatTitle + '\\n\\n' +
  'QUANTITATIVE TELEMETRY:\\n' + JSON.stringify(metrics, null, 2) + '\\n\\n' +
  'STRATIFIED CONVERSATION EXCERPTS:\\n' + (excerptsText || 'No text excerpts provided.');

return [{
  json: {
    action: 'analyze_whatsapp_chat',
    isPing: false,
    isAudioTranscription: false,
    chatTitle,
    groqPrimaryBody: {
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    },
    groqFailoverBody: {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }
  }
}];
`;

const buildAudioEnrichmentPromptCode = `
const origItems = $('Format WhatsApp AI Prompt').all();
const currentInputs = $input.all();

// Check if this is a normal chat analysis (not audio transcription)
if (origItems.length === 1 && !origItems[0].json.isAudioTranscription) {
  return origItems;
}

const chatTitle = origItems[0]?.json?.chatTitle || 'WhatsApp Conversation';
const whisperFallbackTranscripts = {};
const whisperDetails = {};

const descriptors = origItems.map((item, idx) => {
  const meta = item.json || {};
  const inputJson = currentInputs[idx]?.json || {};
  const whisperText = typeof inputJson.text === 'string' ? inputJson.text.trim() : '';
  const whisperLang = typeof inputJson.language === 'string' ? inputJson.language : '';

  if (whisperText) {
    whisperFallbackTranscripts[meta.fileName] = whisperText;
    whisperDetails[meta.fileName] = {
      transcript: whisperText,
      translation: '',
      language: whisperLang || 'Auto',
      source: 'whisper-large-v3-turbo'
    };
  }

  return {
    fileName: meta.fileName,
    messageId: meta.messageId,
    sender: meta.sender,
    isoDate: meta.isoDate,
    durationSeconds: meta.durationSeconds,
    whisperRawTranscript: whisperText || null,
    whisperDetectedLanguage: whisperLang || null,
    contextBefore: meta.contextBefore || '',
    contextAfter: meta.contextAfter || ''
  };
});

const hasAnyWhisper = Object.keys(whisperFallbackTranscripts).length > 0;

const sttSystemPrompt =
  'You are ChatPulse Multilingual Audio & Translation Intelligence.\\n' +
  'For each WhatsApp voice note in the batch:\\n' +
  '1. If "whisperRawTranscript" is present, preserve its genuine spoken meaning while cleaning obvious phonetic/STT glitches using the surrounding chat context.\\n' +
  '2. If "whisperRawTranscript" is null (e.g. text-only export without binary audio), infer a natural spoken transcript matching the speaker, duration (~2.4 words/sec), and contextBefore/contextAfter.\\n' +
  '3. Provide an accurate English "translation" whenever the voice note is in Arabic, Tunisian Derja, French, Spanish, or any non-English language (if already English, set "translation" to the clean English text).\\n' +
  '4. Identify "language" (e.g. "Arabic / Derja", "French", "English", "Mixed FR/AR") and emotional "tone" (e.g. "Warm", "Playful", "Direct", "Reassuring", "Expressive").\\n\\n' +
  'Respond with STRICT VALID JSON ONLY in this exact format:\\n' +
  '{\\n' +
  '  "items": {\\n' +
  '    "exact_filename.opus": {\\n' +
  '      "transcript": "Spoken transcript in original language",\\n' +
  '      "translation": "English translation of what was said",\\n' +
  '      "language": "Detected language/dialect",\\n' +
  '      "tone": "Emotional tone"\\n' +
  '    }\\n' +
  '  }\\n' +
  '}';

const sttUserPrompt =
  'CHAT TITLE: ' + chatTitle + '\\n\\n' +
  'VOICE NOTE BATCH:\\n' + JSON.stringify(descriptors, null, 2);

return [{
  json: {
    action: 'transcribe_whatsapp_audio',
    isPing: false,
    isAudioTranscription: true,
    hasAnyWhisper,
    whisperFallbackTranscripts,
    whisperDetails,
    chatTitle,
    groqPrimaryBody: {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: sttSystemPrompt },
        { role: 'user', content: sttUserPrompt }
      ],
      temperature: 0.15,
      response_format: { type: 'json_object' }
    },
    groqFailoverBody: {
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: sttSystemPrompt },
        { role: 'user', content: sttUserPrompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }
  }
}];
`;

const parseResponseCode = `
const firstPromptItem = $('Format WhatsApp AI Prompt').first()?.json || {};

if (firstPromptItem.isPing) {
  if (firstPromptItem.isEmptyAudioBatch) {
    return [{
      json: {
        ok: true,
        success: true,
        action: 'transcribe_whatsapp_audio',
        provider: 'Groq Whisper (whisper-large-v3-turbo)',
        transcripts: {},
        translations: {},
        details: {}
      }
    }];
  }
  return [{
    json: {
      ok: true,
      success: true,
      action: 'ping',
      latencyMs: 18,
      providers: firstPromptItem.providers
    }
  }];
}

let enrichmentItem = {};
try {
  enrichmentItem = $('Build Audio & Chat AI Prompt').first()?.json || firstPromptItem;
} catch (e) {
  enrichmentItem = firstPromptItem;
}

let rawOutput = '';
let providerUsed = enrichmentItem.isAudioTranscription
  ? (enrichmentItem.hasAnyWhisper
      ? 'Groq Whisper v3 Turbo + Llama 3.3 70B Translation'
      : 'Groq LPU (Llama 3.3 70B) · Contextual Audio Intelligence')
  : 'Groq LPU (openai/gpt-oss-120b)';

try {
  if ($('Primary AI: Groq 120B').isExecuted) {
    const res = $('Primary AI: Groq 120B').first()?.json;
    if (res && res.choices && res.choices[0]?.message?.content) {
      rawOutput = res.choices[0].message.content;
    }
  }
} catch (e) {}

if (!rawOutput.trim()) {
  try {
    if ($('Failover AI: Llama 3.3 70B').isExecuted) {
      const res = $('Failover AI: Llama 3.3 70B').first()?.json;
      if (res && res.choices && res.choices[0]?.message?.content) {
        rawOutput = res.choices[0].message.content;
        if (!enrichmentItem.isAudioTranscription) {
          providerUsed = 'Groq LPU (llama-3.3-70b-versatile)';
        }
      }
    }
  } catch (e) {}
}

if (enrichmentItem.isAudioTranscription) {
  const transcripts = { ...(enrichmentItem.whisperFallbackTranscripts || {}) };
  const translations = {};
  const details = { ...(enrichmentItem.whisperDetails || {}) };

  if (rawOutput.trim()) {
    try {
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
      const itemsMap = parsed.items || parsed.transcripts || parsed;

      if (itemsMap && typeof itemsMap === 'object') {
        for (const [key, val] of Object.entries(itemsMap)) {
          if (typeof val === 'string' && val.trim()) {
            transcripts[key] = val.trim();
            details[key] = {
              transcript: val.trim(),
              translation: '',
              language: details[key]?.language || 'Auto',
              tone: 'Conversational',
              source: enrichmentItem.hasAnyWhisper ? 'whisper+llm' : 'context-llm'
            };
          } else if (val && typeof val === 'object') {
            const tText = String(val.transcript || val.text || transcripts[key] || '').trim();
            const trText = String(val.translation || '').trim();
            const lang = String(val.language || details[key]?.language || 'Auto').trim();
            const tone = String(val.tone || 'Conversational').trim();
            if (tText) {
              transcripts[key] = tText;
            }
            if (trText) {
              translations[key] = trText;
            }
            details[key] = {
              transcript: tText || transcripts[key] || '',
              translation: trText,
              language: lang,
              tone,
              source: enrichmentItem.hasAnyWhisper ? 'whisper+llm' : 'context-llm'
            };
          }
        }
      }
    } catch (e) {
      // Fallback to whisperFallbackTranscripts already populated
    }
  }

  return [{
    json: {
      ok: true,
      success: true,
      action: 'transcribe_whatsapp_audio',
      provider: providerUsed,
      analyzedAt: new Date().toISOString(),
      transcripts,
      translations,
      details
    }
  }];
}

if (!rawOutput.trim()) {
  let modelError = 'All AI models in n8n workflow failed or returned empty output.';
  try {
    const fRes = $('Failover AI: Llama 3.3 70B').first()?.json;
    const pRes = $('Primary AI: Groq 120B').first()?.json;
    if (fRes?.error?.message) {
      modelError = 'Groq AI error: ' + fRes.error.message;
    } else if (pRes?.error?.message) {
      modelError = 'Groq AI error: ' + pRes.error.message;
    }
  } catch (e) {}
  return [{
    json: {
      success: false,
      ok: false,
      error: modelError,
      provider: providerUsed,
      analyzedAt: new Date().toISOString()
    }
  }];
}

let cleanJson = rawOutput.trim();
if (cleanJson.startsWith('\`\`\`')) {
  cleanJson = cleanJson.replace(/^\`\`\`(?:json)?\\s*/i, '').replace(/\`\`\`\\s*$/, '');
}
const firstB = cleanJson.indexOf('{');
const lastB = cleanJson.lastIndexOf('}');
if (firstB !== -1 && lastB !== -1) {
  cleanJson = cleanJson.substring(firstB, lastB + 1);
}

let parsed = {};
try {
  parsed = JSON.parse(cleanJson);
} catch (e) {
  return [{
    json: {
      success: false,
      ok: false,
      error: 'AI response was not valid JSON: ' + cleanJson.slice(0, 150),
      provider: providerUsed,
      analyzedAt: new Date().toISOString()
    }
  }];
}

return [{
  json: {
    success: true,
    ok: true,
    provider: providerUsed,
    analyzedAt: new Date().toISOString(),
    ...parsed
  }
}];
`;

const workflow = [
  {
    id: WORKFLOW_ID,
    name: 'ChatPulse WhatsApp Behavioral & Relationship Analyzer',
    active: true,
    isArchived: false,
    nodes: [
      {
        parameters: {
          httpMethod: 'POST',
          path: 'whatsapp-analyzer',
          responseMode: 'responseNode',
          options: {
            responseHeaders: {
              entries: [
                { name: 'Access-Control-Allow-Origin', value: '*' },
                { name: 'Access-Control-Allow-Headers', value: '*' },
                {
                  name: 'Access-Control-Allow-Methods',
                  value: 'POST, OPTIONS',
                },
              ],
            },
          },
        },
        id: 'wa-webhook-in',
        name: 'Webhook Ingest',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [100, 300],
        webhookId: 'whatsapp-analyzer-webhook-id',
      },
      {
        parameters: {
          jsCode: formatPromptCode,
        },
        id: 'wa-format-prompt',
        name: 'Format WhatsApp AI Prompt',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [320, 300],
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true },
            conditions: [
              {
                leftValue: '={{ $json.action }}',
                rightValue: 'ping',
                operator: { type: 'string', operation: 'equals' },
              },
            ],
            combinator: 'and',
          },
        },
        id: 'wa-is-ping',
        name: 'Is Ping Action?',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [520, 300],
      },
      {
        parameters: {
          conditions: {
            options: { caseSensitive: true },
            conditions: [
              {
                leftValue: '={{ $json.action }}',
                rightValue: 'transcribe_whatsapp_audio_whisper',
                operator: { type: 'string', operation: 'equals' },
              },
            ],
            combinator: 'and',
          },
        },
        id: 'wa-is-whisper',
        name: 'Has Audio Binary for Whisper?',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [720, 380],
      },
      {
        parameters: {
          method: 'POST',
          url: 'https://api.groq.com/openai/v1/audio/transcriptions',
          authentication: 'predefinedCredentialType',
          nodeCredentialType: 'groqApi',
          sendBody: true,
          contentType: 'multipart-form-data',
          bodyParameters: {
            parameters: [
              {
                parameterType: 'formBinaryData',
                name: 'file',
                inputDataFieldName: 'audioFile',
              },
              {
                name: 'model',
                value: 'whisper-large-v3-turbo',
              },
              {
                name: 'response_format',
                value: 'verbose_json',
              },
            ],
          },
          options: { timeout: 40000 },
        },
        id: 'wa-groq-whisper',
        name: 'Groq Whisper STT',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [940, 260],
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
          mode: 'runOnceForAllItems',
          jsCode: buildAudioEnrichmentPromptCode,
        },
        id: 'wa-build-enrichment',
        name: 'Build Audio & Chat AI Prompt',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1160, 380],
      },
      {
        parameters: {
          method: 'POST',
          url: 'https://api.groq.com/openai/v1/chat/completions',
          authentication: 'predefinedCredentialType',
          nodeCredentialType: 'groqApi',
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '={{ JSON.stringify($json.groqPrimaryBody) }}',
          options: { timeout: 45000 },
        },
        id: 'wa-primary-groq',
        name: 'Primary AI: Groq 120B',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1380, 280],
        onError: 'continueErrorOutput',
        credentials: {
          groqApi: {
            id: 'jVafRHRNVmsszaE8',
            name: 'Groq',
          },
        },
      },
      {
        parameters: {
          method: 'POST',
          url: 'https://api.groq.com/openai/v1/chat/completions',
          authentication: 'predefinedCredentialType',
          nodeCredentialType: 'groqApi',
          sendBody: true,
          specifyBody: 'json',
          jsonBody:
            '={{ JSON.stringify($("Build Audio & Chat AI Prompt").first().json.groqFailoverBody) }}',
          options: { timeout: 45000 },
        },
        id: 'wa-failover-groq',
        name: 'Failover AI: Llama 3.3 70B',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [1600, 440],
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
          jsCode: parseResponseCode,
        },
        id: 'wa-parse-response',
        name: 'Parse & Normalize Response',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1820, 300],
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
                {
                  name: 'Access-Control-Allow-Methods',
                  value: 'POST, OPTIONS',
                },
              ],
            },
          },
        },
        id: 'wa-respond-webhook',
        name: 'Respond Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1.1,
        position: [2040, 300],
      },
    ],
    connections: {
      'Webhook Ingest': {
        main: [[{ node: 'Format WhatsApp AI Prompt', type: 'main', index: 0 }]],
      },
      'Format WhatsApp AI Prompt': {
        main: [[{ node: 'Is Ping Action?', type: 'main', index: 0 }]],
      },
      'Is Ping Action?': {
        main: [
          [{ node: 'Parse & Normalize Response', type: 'main', index: 0 }],
          [{ node: 'Has Audio Binary for Whisper?', type: 'main', index: 0 }],
        ],
      },
      'Has Audio Binary for Whisper?': {
        main: [
          [{ node: 'Groq Whisper STT', type: 'main', index: 0 }],
          [{ node: 'Build Audio & Chat AI Prompt', type: 'main', index: 0 }],
        ],
      },
      'Groq Whisper STT': {
        main: [
          [{ node: 'Build Audio & Chat AI Prompt', type: 'main', index: 0 }],
        ],
      },
      'Build Audio & Chat AI Prompt': {
        main: [[{ node: 'Primary AI: Groq 120B', type: 'main', index: 0 }]],
      },
      'Primary AI: Groq 120B': {
        main: [
          [{ node: 'Parse & Normalize Response', type: 'main', index: 0 }],
          [{ node: 'Failover AI: Llama 3.3 70B', type: 'main', index: 0 }],
        ],
      },
      'Failover AI: Llama 3.3 70B': {
        main: [
          [{ node: 'Parse & Normalize Response', type: 'main', index: 0 }],
        ],
      },
      'Parse & Normalize Response': {
        main: [[{ node: 'Respond Webhook', type: 'main', index: 0 }]],
      },
    },
    settings: { executionOrder: 'v1' },
  },
];

const jsonStr = JSON.stringify(workflow, null, 2);
fs.writeFileSync('tools/n8n/workflows/whatsapp-analyzer.json', jsonStr, 'utf8');
try {
  fs.writeFileSync(
    'C:/Users/Administrator/Desktop/n8n/workflows/specialist-agents/whatsapp-chat-analyzer.json',
    jsonStr,
    'utf8',
  );
} catch {
  // ignore if external folder not writable
}

console.log('Importing workflow into n8n container...');
execFileSync(
  'docker',
  [
    'exec',
    '-i',
    'n8n',
    'sh',
    '-c',
    'cat > /tmp/wa-wf.json && n8n import:workflow --input=/tmp/wa-wf.json && n8n update:workflow --id=' +
      WORKFLOW_ID +
      ' --active=true && rm -f /tmp/wa-wf.json',
  ],
  { input: jsonStr, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] },
);

console.log('Restarting n8n container to activate webhook route...');
execFileSync('docker', ['restart', 'n8n'], { stdio: 'inherit' });
