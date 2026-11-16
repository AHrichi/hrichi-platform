import type { AiWebhookPayload } from '../models/whatsapp.models';

/**
 * Hard limits for every AI provider (local Ollama and the n8n workflow, which
 * carries the same paragraph in tools/n8n/workflows/whatsapp-analyzer.json).
 */
export const AI_SAFETY_BOUNDARIES =
  'BOUNDARIES (mandatory):\n' +
  "- Never speculate about, infer or hint at anyone's health, medical or mental-health diagnosis, menstrual cycle or period, pregnancy, fertility, sexuality or other sensitive personal traits. If the excerpts mention such things, do not analyse or repeat them.\n" +
  '- Describe moods only as tone visible in the text ("shorter, flatter replies"), never as a cause.\n' +
  '- Do not encourage monitoring, checking up on or controlling a partner. Favour asking openly and listening.\n' +
  '- If wellbeingSignals are present, suggest a gentle, open check-in; never a diagnosis.\n';

export const RELATIONSHIP_ANALYSIS_SYSTEM_PROMPT =
  'You are ChatPulse AI, a warm, evidence-based relationship communication coach.\n' +
  'Analyse the WhatsApp telemetry and conversation excerpts. Ground every insight in the participant names, the metrics and the tone of real messages.\n\n' +
  AI_SAFETY_BOUNDARIES +
  '\nRespond with STRICT VALID JSON ONLY with these keys:\n' +
  'executiveSummary (3-4 sentences), relationshipDynamicTitle (short title), reciprocityScore, emotionalSafetyScore, engagementVelocityScore (integers 0-100),\n' +
  'mutualInterestBreakdown {balanceLabel, initiationAnalysis, responseLatencyAnalysis, investmentDepthAnalysis},\n' +
  'participantProfiles [{name, attachmentStyle, communicationArchetype, dominantTraits (3-4 strings), emotionalCadence}],\n' +
  'flags [{type: "green"|"amber"|"red", title, evidence, impact}],\n' +
  'conflictAndRepairStyle (2-3 sentences), recommendations (3 strings),\n' +
  'relationshipTips (3-5 short, kind, practical ways the two can support each other, based on the chat).';

/** JSON schema for Ollama's structured output (`format`). */
export const RELATIONSHIP_ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    executiveSummary: { type: 'string' },
    relationshipDynamicTitle: { type: 'string' },
    reciprocityScore: { type: 'integer' },
    emotionalSafetyScore: { type: 'integer' },
    engagementVelocityScore: { type: 'integer' },
    mutualInterestBreakdown: {
      type: 'object',
      properties: {
        balanceLabel: { type: 'string' },
        initiationAnalysis: { type: 'string' },
        responseLatencyAnalysis: { type: 'string' },
        investmentDepthAnalysis: { type: 'string' },
      },
      required: [
        'balanceLabel',
        'initiationAnalysis',
        'responseLatencyAnalysis',
        'investmentDepthAnalysis',
      ],
    },
    participantProfiles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          attachmentStyle: { type: 'string' },
          communicationArchetype: { type: 'string' },
          dominantTraits: { type: 'array', items: { type: 'string' } },
          emotionalCadence: { type: 'string' },
        },
        required: [
          'name',
          'communicationArchetype',
          'dominantTraits',
          'emotionalCadence',
        ],
      },
    },
    flags: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['green', 'amber', 'red'] },
          title: { type: 'string' },
          evidence: { type: 'string' },
          impact: { type: 'string' },
        },
        required: ['type', 'title', 'evidence', 'impact'],
      },
    },
    conflictAndRepairStyle: { type: 'string' },
    recommendations: { type: 'array', items: { type: 'string' } },
    relationshipTips: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'executiveSummary',
    'relationshipDynamicTitle',
    'reciprocityScore',
    'emotionalSafetyScore',
    'engagementVelocityScore',
    'mutualInterestBreakdown',
    'participantProfiles',
    'flags',
    'conflictAndRepairStyle',
    'recommendations',
    'relationshipTips',
  ],
} as const;

/** The user turn, formatted like the n8n workflow's prompt. */
export function buildRelationshipUserPrompt(payload: AiWebhookPayload): string {
  let excerpts = '';
  payload.sampledWindows.forEach((win, idx) => {
    excerpts += `\n--- WINDOW ${idx + 1}: ${win.label || win.phase} (${win.startDate}) ---\n`;
    for (const m of win.messages) {
      excerpts += `[${m.timestamp}] ${m.sender}: ${m.text}\n`;
    }
  });
  return (
    `CHAT TITLE: ${payload.chatTitle}\n\n` +
    `QUANTITATIVE TELEMETRY:\n${JSON.stringify(payload.quantitativeMetrics, null, 2)}\n\n` +
    `WELLBEING SIGNALS (dates and text-pattern reasons only):\n${JSON.stringify(payload.wellbeingSignals ?? [], null, 2)}\n\n` +
    `STRATIFIED CONVERSATION EXCERPTS:\n${excerpts || 'No text excerpts provided.'}`
  );
}
