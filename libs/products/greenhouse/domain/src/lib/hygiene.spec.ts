import {
  checkHygieneItem,
  checklist,
  checkStatus,
  hygieneProgress,
  itemLabel,
  STANDARD_HYGIENE_ITEMS,
  withAnswer,
} from './hygiene';
import type { HygieneItem } from './models';

const item = (id: string, over: Partial<HygieneItem> = {}): HygieneItem => ({
  id,
  label: { ar: `ع ${id}`, fr: `fr ${id}`, en: `en ${id}` },
  photoRequired: false,
  sortOrder: 0,
  active: true,
  ...over,
});

describe('the checklist', () => {
  it('keeps active items in order, and speaks the reader’s language', () => {
    const items = [
      item('b', { sortOrder: 2 }),
      item('a', { sortOrder: 1 }),
      item('old', { active: false }),
    ];
    expect(checklist(items).map((i) => i.id)).toEqual(['a', 'b']);
    expect(itemLabel(item('a'), 'ar')).toBe('ع a');
    expect(itemLabel(item('a'), 'de')).toBe('fr a');
    expect(
      itemLabel(item('a', { label: { ar: 'ع', fr: '', en: '' } }), 'fr'),
    ).toBe('ع');
  });

  it('replaces an item’s answer', () => {
    const first = { itemId: 'a', ok: true, photoPaths: [] };
    const second = { itemId: 'a', ok: false, note: 'dirty', photoPaths: [] };
    expect(withAnswer([first], second)).toEqual([second]);
  });
});

describe('hygieneProgress', () => {
  const items = [item('a'), item('b', { photoRequired: true })];

  it('is complete once every item is answered with its photos', () => {
    expect(hygieneProgress(items, [])).toMatchObject({
      total: 2,
      answered: 0,
      complete: false,
    });
    const answers = [
      { itemId: 'a', ok: false, note: 'no soap', photoPaths: [] },
      { itemId: 'b', ok: true, photoPaths: [] },
    ];
    expect(hygieneProgress(items, answers)).toMatchObject({
      answered: 2,
      failed: 1,
      missingPhotos: ['b'],
      complete: false,
    });
    expect(
      hygieneProgress(
        items,
        withAnswer(answers, { itemId: 'b', ok: true, photoPaths: ['p.jpg'] }),
      ).complete,
    ).toBe(true);
  });

  it('ignores answers to items no longer on the list, and an empty list', () => {
    expect(
      hygieneProgress(
        [item('a')],
        [{ itemId: 'gone', ok: false, photoPaths: [] }],
      ).answered,
    ).toBe(0);
    expect(hygieneProgress([], []).complete).toBe(false);
  });

  it('tells missing, open and signed checks apart', () => {
    expect(checkStatus(null)).toBe('missing');
    expect(checkStatus({ signedAt: null })).toBe('open');
    expect(checkStatus({ signedAt: '2026-11-23T08:00:00Z' })).toBe('signed');
  });
});

describe('checkHygieneItem', () => {
  it('fills empty languages from the first wording given', () => {
    expect(
      checkHygieneItem({ ar: '', fr: '  Caisses  propres ', en: '' }),
    ).toEqual({
      ok: true,
      value: {
        ar: 'Caisses propres',
        fr: 'Caisses propres',
        en: 'Caisses propres',
      },
    });
  });

  it('wants one wording at least, none too long', () => {
    expect(checkHygieneItem({ ar: '', fr: '', en: ' ' })).toEqual({
      ok: false,
      errors: { fr: 'required' },
    });
    expect(checkHygieneItem({ ar: 'x'.repeat(201), fr: 'ok', en: '' })).toEqual(
      { ok: false, errors: { ar: 'invalid' } },
    );
  });

  it('ships a standard list with every language filled in', () => {
    for (const standard of STANDARD_HYGIENE_ITEMS) {
      expect(checkHygieneItem(standard.label)).toEqual({
        ok: true,
        value: standard.label,
      });
    }
  });
});
