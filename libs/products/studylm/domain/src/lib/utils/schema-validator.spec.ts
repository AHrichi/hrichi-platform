import {
  validateAndParseSectionFlashcards,
  validateAndParseSectionQuiz,
} from './schema-validator';

const QUESTION = {
  question: 'What does Array.prototype.map return?',
  options: ['A new array', 'The same array', 'undefined', 'A number'],
  correctIndex: 0,
  explanation: 'map builds a new array from the callback’s results.',
};

describe('validateAndParseSectionQuiz', () => {
  it('keeps a complete question', () => {
    const parsed = validateAndParseSectionQuiz({ quiz: [QUESTION] }, 's1');
    expect(parsed.success).toBe(true);
    expect(parsed.quiz).toHaveLength(1);
    expect(parsed.quiz[0]).toMatchObject({
      options: QUESTION.options,
      correctIndex: 0,
      sectionId: 's1',
    });
  });

  it('drops questions it would have to complete, instead of inventing options or answers', () => {
    const parsed = validateAndParseSectionQuiz(
      {
        quiz: [
          { ...QUESTION, options: ['A new array', 'The same array'] },
          { ...QUESTION, correctIndex: 7 },
          { ...QUESTION, correctIndex: undefined },
          { ...QUESTION, question: '  ' },
          { ...QUESTION, options: ['A new array', '', 'undefined', 'x'] },
          QUESTION,
        ],
      },
      's1',
    );
    expect(parsed.quiz).toHaveLength(1);
    expect(JSON.stringify(parsed.quiz)).not.toContain('Option A');
  });
});

describe('validateAndParseSectionFlashcards', () => {
  it('drops cards without both sides', () => {
    const parsed = validateAndParseSectionFlashcards(
      {
        flashcards: [
          { front: 'What is a closure?', back: '' },
          { front: '', back: 'A function with its scope' },
          { front: 'What is a closure?', back: 'A function with its scope' },
        ],
      },
      's1',
    );
    expect(parsed.flashcards).toHaveLength(1);
    expect(parsed.flashcards[0].back).toBe('A function with its scope');
  });
});
