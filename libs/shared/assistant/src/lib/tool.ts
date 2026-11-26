import { toJsonSchema } from '@valibot/to-json-schema';
import * as v from 'valibot';

/** A JSON Schema node, as plain data. */
export type JsonSchema = { [key: string]: unknown };

/**
 * What a tool does, which decides how the app runs it:
 * - `read`: looks something up; runs at once.
 * - `navigate`: opens a screen or a project; runs at once.
 * - `setting`: changes a preference; runs at once, with Undo.
 * - `write`: creates or changes data; waits for the user's Apply.
 * - `destructive`: deletes data; waits for Apply, shown as a warning.
 */
export type ToolEffect =
  'read' | 'navigate' | 'setting' | 'write' | 'destructive';

/** Effects a weaker model may still be offered: it can't touch data. */
export const READ_ONLY_EFFECTS: readonly ToolEffect[] = ['read', 'navigate'];

/** A tool the app runs when a model asks for it. */
export interface AssistantTool<
  TArgs extends v.GenericSchema = v.GenericSchema,
> {
  /** snake_case, as models expect. */
  readonly name: string;
  /** What it does and when to use it, written for the model. */
  readonly description: string;
  readonly effect: ToolEffect;
  /** Its arguments: always an object schema. */
  readonly args: TArgs;
}

/** A tool as a model provider sees it (OpenAI's function format). */
export interface ToolSpec {
  readonly name: string;
  readonly description: string;
  readonly parameters: JsonSchema;
}

const NAME = /^[a-z][a-z0-9_]{1,47}$/;

export function defineTool<TArgs extends v.GenericSchema>(
  tool: AssistantTool<TArgs>,
): AssistantTool<TArgs> {
  if (!NAME.test(tool.name)) {
    throw new Error(`Tool name "${tool.name}" must be snake_case`);
  }
  return tool;
}

/**
 * The keywords every provider's function schema accepts: Gemini takes a
 * restricted OpenAPI subset, so ranges, patterns and lengths are left out
 * (descriptions state them; the app's validator enforces them).
 */
const PORTABLE = new Set([
  'type',
  'properties',
  'required',
  'items',
  'enum',
  'description',
]);

const PORTABLE_TYPES = new Set([
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
]);

function portable(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(portable);
  if (node === null || typeof node !== 'object') return node;
  const out: JsonSchema = {};
  for (const [key, value] of Object.entries(node as JsonSchema)) {
    if (key === 'properties') {
      out[key] = Object.fromEntries(
        Object.entries(value as JsonSchema).map(([name, schema]) => [
          name,
          portable(schema),
        ]),
      );
    } else if (key === 'const') {
      // A single allowed value: an enum of one, which every provider reads.
      out['enum'] = [value];
    } else if (PORTABLE.has(key)) {
      out[key] = portable(value);
    }
  }
  if (out['type'] === 'object' && !out['properties']) out['properties'] = {};
  return out;
}

/** A tool's spec for a provider, in the portable subset. */
export function toolSpec(tool: AssistantTool): ToolSpec {
  return {
    name: tool.name,
    description: tool.description,
    parameters: portable(
      toJsonSchema(tool.args, { errorMode: 'throw' }),
    ) as JsonSchema,
  };
}

/**
 * What would make a provider refuse a spec: keywords outside the subset,
 * types it doesn't know, unions, or arguments that aren't an object.
 */
export function portabilityProblems(spec: ToolSpec): string[] {
  const problems: string[] = [];
  if (spec.parameters['type'] !== 'object') {
    problems.push(`${spec.name}: arguments must be an object`);
  }
  const walk = (node: unknown, path: string) => {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) {
      return;
    }
    const record = node as JsonSchema;
    for (const key of Object.keys(record)) {
      if (!PORTABLE.has(key)) problems.push(`${path}: "${key}"`);
    }
    if (record['type'] && !PORTABLE_TYPES.has(String(record['type']))) {
      problems.push(`${path}: type ${JSON.stringify(record['type'])}`);
    }
    for (const [name, child] of Object.entries(
      (record['properties'] as JsonSchema) ?? {},
    )) {
      walk(child, `${path}.${name}`);
    }
    if (record['items']) walk(record['items'], `${path}[]`);
  };
  walk(spec.parameters, spec.name);
  return problems;
}
