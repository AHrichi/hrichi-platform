import type { JsonSchema } from './strict-schema';

/**
 * Reading a model's reply against a strict schema (the subset that
 * strictJsonSchema writes). The same rules run in StudyLM's n8n workflow
 * (tools/scripts/update-studylm-workflow.mjs), which embeds its own copy
 * because n8n Code nodes can't import modules.
 */

/** The reply as JSON, tolerating thinking tags and code fences; null if it won't parse. */
export function parseReply(text: string): unknown {
  let clean = String(text ?? '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }
  const first = clean.indexOf('{');
  const last = clean.lastIndexOf('}');
  if (first === -1 || last <= first) return null;
  try {
    return JSON.parse(clean.substring(first, last + 1));
  } catch {
    return null;
  }
}

/** True when a value fits a strict JSON Schema. */
export function conforms(value: unknown, schema: JsonSchema): boolean {
  if (Array.isArray(schema['anyOf'])) {
    return (schema['anyOf'] as JsonSchema[]).some((option) =>
      conforms(value, option),
    );
  }
  if ('const' in schema) return value === schema['const'];
  if (Array.isArray(schema['enum']) && !schema['enum'].includes(value)) {
    return false;
  }
  switch (schema['type']) {
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
      }
      const record = value as Record<string, unknown>;
      const properties =
        (schema['properties'] as Record<string, JsonSchema>) ?? {};
      const required = (schema['required'] as string[]) ?? [];
      return (
        Object.keys(record).every((key) => key in properties) &&
        required.every((key) => key in record) &&
        Object.entries(properties).every(
          ([key, property]) =>
            !(key in record) || conforms(record[key], property),
        )
      );
    }
    case 'array':
      return (
        Array.isArray(value) &&
        value.every((item) =>
          conforms(item, (schema['items'] as JsonSchema) ?? {}),
        )
      );
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    default:
      return true;
  }
}

function isNullable(property: JsonSchema): boolean {
  return (
    property['type'] === 'null' ||
    (Array.isArray(property['anyOf']) &&
      (property['anyOf'] as JsonSchema[]).some(
        (option) => option['type'] === 'null',
      ))
  );
}

/**
 * Fixes the near-misses that need no model: keys the schema doesn't have
 * are dropped, and a missing field that may be null becomes null.
 */
export function tidy(value: unknown, schema: JsonSchema): unknown {
  if (Array.isArray(schema['anyOf'])) {
    const options = schema['anyOf'] as JsonSchema[];
    if (options.some((option) => conforms(value, option))) return value;
    for (const option of options) {
      const tidied = tidy(value, option);
      if (conforms(tidied, option)) return tidied;
    }
    return value;
  }
  if (
    schema['type'] === 'object' &&
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    const record = value as Record<string, unknown>;
    const tidied: Record<string, unknown> = {};
    const properties =
      (schema['properties'] as Record<string, JsonSchema>) ?? {};
    for (const [key, property] of Object.entries(properties)) {
      if (key in record) tidied[key] = tidy(record[key], property);
      else if (isNullable(property)) tidied[key] = null;
    }
    return tidied;
  }
  if (schema['type'] === 'array' && Array.isArray(value)) {
    return value.map((item) =>
      tidy(item, (schema['items'] as JsonSchema) ?? {}),
    );
  }
  return value;
}
