import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildAiProviders, type N8nRelayOptions } from '@ah/api/ai';
import { FIXTURE_IDS, sampleCapture } from '@ah/learning/domain';
import { CapturePipeline } from '../capture-pipeline';
import { GradingService } from '../grading.service';
import { InMemoryLearningRepository } from '../testing/in-memory-learning.repository';
import { WriteLock } from '../write-lock';

/**
 * The pipeline against real models through the n8n relay (ADR-0024):
 *
 *   LEARNING_RELAY_LIVE=1 pnpm nx test api-learning -- relay-live
 *
 * LEARNING_N8N_URL and LEARNING_N8N_SECRET come from the environment or
 * from .env.render (tools/n8n/install-learning-ai.mjs writes them).
 * LEARNING_RELAY_LOCAL=1 calls n8n on localhost instead of the tunnel.
 */
function envRender(): Record<string, string> {
  for (let dir = process.cwd(); ; dir = dirname(dir)) {
    const file = join(dir, '.env.render');
    if (existsSync(file)) {
      return Object.fromEntries(
        readFileSync(file, 'utf8')
          .split(/\r?\n/)
          .filter((line) => /^[A-Z0-9_]+=/.test(line))
          .map((line) => [
            line.slice(0, line.indexOf('=')),
            line.slice(line.indexOf('=') + 1),
          ]),
      );
    }
    if (dirname(dir) === dir) return {};
  }
}

function relayOptions(): N8nRelayOptions | null {
  const saved = envRender();
  const value = (name: string) => process.env[name]?.trim() || saved[name];
  const secret = value('LEARNING_N8N_SECRET');
  const url =
    process.env['LEARNING_RELAY_LOCAL'] === '1'
      ? 'http://localhost:5678'
      : value('LEARNING_N8N_URL');
  return url && secret ? { url, secret } : null;
}

const live = process.env['LEARNING_RELAY_LIVE'] === '1';

describe.skipIf(!live)('n8n relay, live (real models)', () => {
  const options = relayOptions();
  const ai = buildAiProviders({
    groq: null,
    gemini: null,
    typesafe: null,
    n8n: options,
  });

  it('reaches n8n', async () => {
    expect(options).not.toBeNull();
    expect(await ai.reachable()).toBe(true);
  });

  it('turns a capture into a draft concept', async () => {
    const repository = new InMemoryLearningRepository();
    const pipeline = new CapturePipeline(
      repository,
      new WriteLock(),
      ai,
      () => new Date(),
    );
    const capture = sampleCapture({
      text: 'Spaced repetition: reviewing something just before you would forget it makes the memory last longer, so each review can come later than the one before.',
    });
    await repository.putMutable({
      kind: 'capture',
      id: capture.id,
      seq: await repository.nextSeq(),
      by: FIXTURE_IDS.deviceA,
      updatedAt: capture.updatedAt,
      data: capture,
    });
    await pipeline.runOnce();
    const after = (await repository.getRecord('capture', capture.id))?.data;
    const drafts = [...repository.records.values()].filter(
      (record) => record.kind === 'concept',
    );
    console.log(
      `capture ${after?.status}${after?.error ? ` (${after.error})` : ''}; drafts: ${drafts
        .map((record) => (record.data as { title: string }).title)
        .join(', ')}`,
    );
    expect(['ready', 'needs_look']).toContain(after?.status);
    expect(drafts.length).toBeGreaterThan(0);
  }, 300_000);

  it('judges a teach-back', async () => {
    const grading = new GradingService(ai.decisions, ai.transcriber);
    const result = await grading.teachBack({
      title: 'Opportunity cost',
      points: ['the next best alternative', 'what you give up by choosing'],
      transcript:
        'When you choose one thing, the cost is the best other option you gave up for it.',
    });
    console.log(
      `teach-back: ${result.clarity ?? 'no band'}; covered ${result.covered.length}, gaps ${result.gaps.length}; by ${result.provider}`,
    );
    expect(result.covered.length + result.gaps.length).toBeGreaterThan(0);
  }, 120_000);
});
