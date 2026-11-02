import { toJsonSchema } from '@valibot/to-json-schema';
import type * as v from 'valibot';

/** A JSON Schema node, as plain data. */
export type JsonSchema = { [key: string]: unknown };

/**
 * The keywords every strict structured-output mode accepts (OpenAI and
 * Groq strict mode, Claude, Gemini). Size limits, patterns and ranges are
 * dropped here: their descriptions state them, and the validators enforce
 * them on the reply.
 */
const KEPT = new Set([
  'type',
  'properties',
  'required',
  'additionalProperties',
  'items',
  'enum',
  'const',
  'anyOf',
  'description',
]);

/** The deepest nesting of objects a strict schema may have. */
export const MAX_OBJECT_DEPTH = 5;

function tighten(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(tighten);
  if (node === null || typeof node !== 'object') return node;
  const out: JsonSchema = {};
  for (const [key, value] of Object.entries(node as JsonSchema)) {
    if (key === 'oneOf') {
      // Valibot writes variants as oneOf; strict modes only take anyOf.
      out['anyOf'] = tighten(value);
    } else if (key === 'properties') {
      out['properties'] = Object.fromEntries(
        Object.entries(value as JsonSchema).map(([name, schema]) => [
          name,
          tighten(schema),
        ]),
      );
    } else if (KEPT.has(key)) {
      out[key] = tighten(value);
    }
  }
  if (out['type'] === 'object') {
    // Every key required (null stands for "absent"); nothing else allowed.
    out['required'] = Object.keys((out['properties'] as JsonSchema) ?? {});
    out['additionalProperties'] = false;
  }
  return out;
}

/** A valibot schema as JSON Schema in the strict structured-output subset. */
export function strictJsonSchema(schema: v.GenericSchema): JsonSchema {
  return tighten(toJsonSchema(schema, { errorMode: 'throw' })) as JsonSchema;
}

/**
 * What would make a provider's strict mode refuse the schema: unknown
 * keywords, optional keys, open objects, references, or nesting too deep.
 */
export function strictnessProblems(schema: JsonSchema): string[] {
  const problems: string[] = [];
  const walk = (node: unknown, path: string, depth: number) => {
    if (node === null || typeof node !== 'object' || Array.isArray(node))
      return;
    const record = node as JsonSchema;
    for (const key of Object.keys(record)) {
      if (!KEPT.has(key))
        problems.push(`${path}: keyword "${key}" is not allowed`);
    }
    let level = depth;
    if (record['type'] === 'object') {
      level = depth + 1;
      if (level > MAX_OBJECT_DEPTH) {
        problems.push(
          `${path}: objects nest ${level} deep (at most ${MAX_OBJECT_DEPTH})`,
        );
      }
      const properties = (record['properties'] as JsonSchema) ?? {};
      const required = (record['required'] as string[]) ?? [];
      if (record['additionalProperties'] !== false) {
        problems.push(`${path}: additionalProperties must be false`);
      }
      for (const name of Object.keys(properties)) {
        if (!required.includes(name))
          problems.push(`${path}: "${name}" is not required`);
        walk(properties[name], `${path}/${name}`, level);
      }
    }
    if (record['items']) walk(record['items'], `${path}[]`, level);
    if (Array.isArray(record['anyOf'])) {
      (record['anyOf'] as unknown[]).forEach((option, i) =>
        walk(option, `${path}|${i}`, level),
      );
    }
  };
  walk(schema, '', 0);
  return problems;
}
