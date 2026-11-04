import { describe, expect, it } from 'vitest';
import { parseChapterOutline } from './outline-parser';

describe('parseChapterOutline', () => {
  it('returns empty array on empty or whitespace text', () => {
    expect(parseChapterOutline('')).toEqual([]);
    expect(parseChapterOutline('   \n  \t  ')).toEqual([]);
  });

  it('parses numbered lines with dots or parentheses', () => {
    const raw = `
1. Introduction to Distributed Systems
2) Remote Procedure Calls (RPC)
3: Primary-Backup Replication
4 - Raft Consensus Algorithm
    `.trim();

    const items = parseChapterOutline(raw);
    expect(items.length).toBe(4);
    expect(items[0]).toEqual({
      chapterNumber: 1,
      title: 'Introduction to Distributed Systems',
    });
    expect(items[1]).toEqual({
      chapterNumber: 2,
      title: 'Remote Procedure Calls (RPC)',
    });
    expect(items[2]).toEqual({
      chapterNumber: 3,
      title: 'Primary-Backup Replication',
    });
    expect(items[3]).toEqual({
      chapterNumber: 4,
      title: 'Raft Consensus Algorithm',
    });
  });

  it('parses "Chapter X:" and "Ch. X -" prefixes', () => {
    const raw = `
Chapter 1: Network Primitives
Ch. 2 - Memory Layout & Cache Lines
ch 3: Concurrency Basics
    `.trim();

    const items = parseChapterOutline(raw);
    expect(items.length).toBe(3);
    expect(items[0]).toEqual({ chapterNumber: 1, title: 'Network Primitives' });
    expect(items[1]).toEqual({
      chapterNumber: 2,
      title: 'Memory Layout & Cache Lines',
    });
    expect(items[2]).toEqual({ chapterNumber: 3, title: 'Concurrency Basics' });
  });

  it('auto-numbers lines without numbers starting from given chapterNumber', () => {
    const raw = `
- Distributed Locking
* Event Sourcing
• Log-Structured Merge Trees
    `.trim();

    const items = parseChapterOutline(raw, 5);
    expect(items.length).toBe(3);
    expect(items[0]).toEqual({
      chapterNumber: 5,
      title: 'Distributed Locking',
    });
    expect(items[1]).toEqual({ chapterNumber: 6, title: 'Event Sourcing' });
    expect(items[2]).toEqual({
      chapterNumber: 7,
      title: 'Log-Structured Merge Trees',
    });
  });

  it('ignores comments and blank lines', () => {
    const raw = `
# Syllabus Outline
// Module 1
1. Basic Syntax

2. Functions
    `.trim();

    const items = parseChapterOutline(raw);
    expect(items.length).toBe(2);
    expect(items[0].title).toBe('Basic Syntax');
    expect(items[1].title).toBe('Functions');
  });
});
