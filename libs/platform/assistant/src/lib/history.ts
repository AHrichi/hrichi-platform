import { ASSISTANT_LIMITS, type ChatMessage } from '@ah/shared/assistant';

/**
 * The most recent part of a conversation that still makes sense on its
 * own: at most `max` messages, starting with one of the reader's, so a
 * tool result is never sent without the call it answers.
 */
export function trimHistory(
  messages: readonly ChatMessage[],
  max = ASSISTANT_LIMITS.messages,
): ChatMessage[] {
  if (messages.length <= max) return [...messages];
  let start = messages.length - max;
  while (start < messages.length && messages[start].role !== 'user') start++;
  return messages.slice(start);
}

/** A tool's result as the model reads it, cut to what a round can carry. */
export function resultText(value: unknown, max = 3000): string {
  const text = JSON.stringify(value ?? null) ?? 'null';
  if (text.length <= max) return text;
  return JSON.stringify({
    truncated: true,
    partial: text.slice(0, max - 60),
  });
}
