import { textKey } from '@ah/learning/client';
import { lessonReviewItems, MAX_REVIEW_ITEMS, pageLink } from './review-items';

const cards = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    front: `Front ${i}`,
    back: `Back ${i}`,
  }));

describe('lessonReviewItems', () => {
  it('turns each card into a capture item sourced from the lesson', () => {
    const items = lessonReviewItems(
      { id: 'request-journey', cards: cards(2) },
      { title: 'One Request, End to End' },
      'https://sd.example/learn/request-journey/11',
    );

    expect(items).toEqual([
      {
        text: 'Front 0\nBack 0',
        source: {
          app: 'system-design',
          objectType: 'lesson-card',
          objectId: `request-journey:${textKey('Front 0')}`,
          deepLink: 'https://sd.example/learn/request-journey/11',
          excerpt: 'One Request, End to End',
        },
      },
      expect.objectContaining({ text: 'Front 1\nBack 1' }),
    ]);
  });

  it(`keeps at most ${MAX_REVIEW_ITEMS} cards`, () => {
    const items = lessonReviewItems(
      { id: 'big', cards: cards(14) },
      { title: 'Big' },
      null,
    );
    expect(items).toHaveLength(MAX_REVIEW_ITEMS);
    expect(items.at(-1)?.text).toBe('Front 9\nBack 9');
    expect(items[0]?.source?.deepLink).toBeNull();
  });
});

describe('pageLink', () => {
  it('keeps absolute http(s) URLs and drops the rest', () => {
    expect(pageLink('http://localhost:4312/learn/a/1')).toBe(
      'http://localhost:4312/learn/a/1',
    );
    expect(pageLink('https://x.dev/')).toBe('https://x.dev/');
    expect(pageLink('file:///C:/index.html')).toBeNull();
    expect(pageLink('')).toBeNull();
  });
});
