import {
  INPUT_METHODS,
  type MethodKind,
  type PhenomenonId,
} from '@ah/products/serracalc/domain';
import type { SerraCopy } from '../i18n/copy.en';

/** What the ⓘ beside a field says: how to get its value and where to read. */
export interface FieldInfo {
  readonly title: string;
  readonly kind: MethodKind;
  readonly method: string;
  readonly methodHint: string;
  readonly instrument: { id: string; name: string; how: string } | null;
  readonly topic: { id: PhenomenonId; title: string } | null;
}

/** A field's advice in the reader's language; generic fields take `fallback`. */
export function fieldInfo(
  t: SerraCopy,
  key: string,
  label: string,
  fallback: PhenomenonId | undefined,
): FieldInfo | null {
  const method = INPUT_METHODS[key];
  if (!method) return null;
  const topicId = method.topic ?? fallback;
  const instrument = method.instrument
    ? { id: method.instrument, ...t.science.instruments[method.instrument] }
    : null;
  return {
    title: t.science.howToGet(label),
    kind: method.kind,
    method: t.science.methods[method.kind],
    methodHint: t.science.methodHints[method.kind],
    instrument,
    topic: topicId
      ? { id: topicId, title: t.science.topics[topicId].title }
      : null,
  };
}
