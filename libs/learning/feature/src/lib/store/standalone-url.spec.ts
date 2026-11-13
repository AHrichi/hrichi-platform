import { describe, expect, it } from 'vitest';
import {
  LEARNING_STANDALONE_ORIGINS,
  resolveStandaloneLearningUrl,
} from './standalone-url';

describe('resolveStandaloneLearningUrl', () => {
  it('returns the production workers origin outside localhost', () => {
    expect(resolveStandaloneLearningUrl(false)).toBe(
      LEARNING_STANDALONE_ORIGINS.prod,
    );
  });

  it('returns the local static server origin on localhost', () => {
    expect(resolveStandaloneLearningUrl(true)).toBe(
      LEARNING_STANDALONE_ORIGINS.dev,
    );
  });
});
