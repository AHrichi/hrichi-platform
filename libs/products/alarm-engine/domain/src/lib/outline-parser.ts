import type { ParsedChapterOutlineItem } from './models';

/**
 * Parses a multiline text containing chapter titles, outlines, or course syllabi.
 * Supports flexible formats across any document type:
 * - Word / Plain Text: "Chapter 1: Memory Alignment", "Ch 2 - File Systems", "1. TCP Primitives", "4) Storage"
 * - Presentations: "Slide 1: Operating System Concepts", "Slide 2: Process Scheduling"
 * - Lectures / Modules: "Module 1: Concurrency", "Lecture 3: Raft Consensus", "Week 2 - Caching"
 * - Markdown: "## Chapter 1: Foundations", "### 2. Performance", "- Bullet points"
 * - CSV / Delimited: '1, "Database Internals", "Notes"' or '1\tNetworking\tActive'
 * - Plain lines without numbers (automatically assigned starting from startingChapterNumber)
 */
export function parseChapterOutline(
  rawText: string,
  startingChapterNumber = 1,
): ParsedChapterOutlineItem[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const lines = rawText.split(/\r?\n/);
  const items: ParsedChapterOutlineItem[] = [];
  let nextSequential = Math.max(1, startingChapterNumber);

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Ignore comment lines, top-level markdown document titles (# Title), or section dividers
    if (
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.startsWith('# ') ||
      line === '---' ||
      line === '***'
    ) {
      continue;
    }

    // Ignore CSV column header rows like "Chapter,Title", "Number,Name,Description"
    if (
      line.match(
        /^(?:chapter|ch|id|no|#|num|number|session|module|slide)\s*[,;\t]\s*(?:title|name|topic|description|content|subject)/i,
      )
    ) {
      continue;
    }

    // Strip CSV delimiters if line is structured like '1, "Title", ...'
    if (line.includes(',') || line.includes('\t') || line.includes(';')) {
      const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
      const parts = line.split(sep).map((p) =>
        p
          .trim()
          .replace(/^["']|["']$/g, '')
          .trim(),
      );
      if (parts.length >= 2) {
        // If first part is a number and second part has text
        const numPart = parseInt(parts[0], 10);
        if (!isNaN(numPart) && parts[1].length >= 2) {
          line = `${numPart}. ${parts[1]}`;
        } else if (
          parts[0].match(/^(?:chapter|ch\.?|module|lecture|slide)\s*\d+/i)
        ) {
          line = parts.join(' - ');
        }
      }
    }

    // Strip sub-level markdown header hashes like '## ', '### '
    line = line.replace(/^#{2,6}\s+/, '').trim();

    // Remove leading markdown bullet markers like '* ', '- ', '• ', '+ '
    line = line.replace(/^[-*•+]\s+/, '').trim();
    if (!line) continue;

    // Strip surrounding quotes
    line = line.replace(/^["']|["']$/g, '').trim();

    // Regex 1: Chapter / Module / Lecture / Unit / Slide / Week / Section / Part prefix
    // e.g. "Chapter 1: Title", "Ch. 2 - Title", "Slide 3: Title", "Module 4 - Title", "Lecture 5: Title"
    const prefixWordMatch = line.match(
      /^(?:chapter|ch\.?|chap\.?|module|unit|lecture|part|section|week|day|slide|presentation|topic|session|step)\s*(\d+)(?:[:.)\-–—]|\s*[:.\-–—]|\s+)\s*(.*)$/i,
    );
    if (prefixWordMatch) {
      const num = parseInt(prefixWordMatch[1], 10);
      let title = prefixWordMatch[2].trim();
      title =
        title
          .replace(/^[:.\-–—)]\s*/, '')
          .replace(/^["']|["']$/g, '')
          .trim() || `Chapter ${num}`;
      items.push({
        chapterNumber: num,
        title,
      });
      nextSequential = Math.max(nextSequential, num + 1);
      continue;
    }

    // Regex 2: Number prefix: e.g. "1. Title", "1) Title", "1 - Title", "1: Title"
    const numberPrefixMatch = line.match(
      /^(\d+)(?:[:.)\-–—]|\s*[:.\-–—]|\s+)\s*(.*)$/,
    );
    if (numberPrefixMatch) {
      const num = parseInt(numberPrefixMatch[1], 10);
      let title = numberPrefixMatch[2].trim();
      title =
        title
          .replace(/^[:.\-–—)]\s*/, '')
          .replace(/^["']|["']$/g, '')
          .trim() || `Chapter ${num}`;
      items.push({
        chapterNumber: num,
        title,
      });
      nextSequential = Math.max(nextSequential, num + 1);
      continue;
    }

    // Plain line without leading number
    items.push({
      chapterNumber: nextSequential,
      title: line,
    });
    nextSequential++;
  }

  return items;
}
