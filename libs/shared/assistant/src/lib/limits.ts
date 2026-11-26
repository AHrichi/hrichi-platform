/**
 * Sizes the assistant's endpoint accepts. They keep each round inside the
 * free tiers' token budgets (Groq allows about 8,000 tokens a minute per
 * model) and an open endpoint from being a free general-purpose model.
 */
export const ASSISTANT_LIMITS = {
  /** A whole request, in bytes. */
  bodyBytes: 48_000,
  /** Messages in one request: the client keeps the most recent. */
  messages: 24,
  userChars: 2_000,
  assistantChars: 4_000,
  /** One tool result, as JSON text. */
  toolResultChars: 6_000,
  toolCallsPerTurn: 4,
  /** The app's state sent with each request, as JSON, in bytes. */
  contextBytes: 4_000,
  /** Model rounds the client runs for one message of the user's. */
  roundsPerUserMessage: 5,
  /** What a model may write in one round. */
  maxOutputTokens: 700,
} as const;
