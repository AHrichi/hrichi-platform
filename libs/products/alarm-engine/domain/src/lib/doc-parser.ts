import { DocParseResult } from './models';
import { parseChapterOutline } from './outline-parser';

/**
 * Decompresses raw deflate data using standard Web DecompressionStream API.
 */
async function decompressDeflateRaw(
  compressedBytes: Uint8Array,
): Promise<string> {
  if (typeof DecompressionStream === 'undefined') {
    return '';
  }
  try {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    // In some environments, Uint8Array slice or buffer is required
    await writer.write(compressedBytes as unknown as BufferSource);
    await writer.close();
    const response = new Response(ds.readable);
    return await response.text();
  } catch {
    return '';
  }
}

/**
 * Universal text extraction from ANY binary or text file buffer:
 * - Documents: .docx, .doc, .rtf, .odt, .pages
 * - Presentations: .pptx, .ppt, .odp
 * - Spreadsheets: .xlsx, .xls, .csv, .tsv, .ods
 * - Documents: .pdf
 * - Text / Structured: .md, .txt, .json, .xml, .html
 * - Any generic / binary file: scans printable string runs
 */
export async function extractUniversalTextFromBuffer(
  buffer: ArrayBuffer | Uint8Array,
  fileName = '',
): Promise<string> {
  if (
    !buffer ||
    (buffer instanceof ArrayBuffer
      ? buffer.byteLength === 0
      : buffer.length === 0)
  ) {
    return '';
  }

  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const len = u8.length;

  // 1. Check for PKZip archive (DOCX, PPTX, XLSX, ODT, ODS, ODP)
  // Magic bytes: 0x50 0x4B 0x03 0x04 ("PK\x03\x04")
  if (
    len > 30 &&
    u8[0] === 0x50 &&
    u8[1] === 0x4b &&
    u8[2] === 0x03 &&
    u8[3] === 0x04
  ) {
    try {
      const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      let offset = 0;
      const textParts: string[] = [];
      const slides: { slideNum: number; text: string[] }[] = [];
      const decoder = new TextDecoder('utf-8', { fatal: false });

      while (offset < len - 30) {
        if (view.getUint32(offset, true) === 0x04034b50) {
          const compMethod = view.getUint16(offset + 8, true);
          const compSize = view.getUint32(offset + 18, true);
          const nameLen = view.getUint16(offset + 26, true);
          const extraLen = view.getUint16(offset + 28, true);

          const nameBytes = u8.subarray(offset + 30, offset + 30 + nameLen);
          const entryName = decoder.decode(nameBytes);
          const dataOffset = offset + 30 + nameLen + extraLen;

          const isDocx = entryName === 'word/document.xml';
          const isPptx =
            entryName.startsWith('ppt/slides/slide') &&
            entryName.endsWith('.xml');
          const isXlsx =
            entryName === 'xl/sharedStrings.xml' ||
            (entryName.startsWith('xl/worksheets/sheet') &&
              entryName.endsWith('.xml'));
          const isOdt = entryName === 'content.xml';

          if (isDocx || isPptx || isXlsx || isOdt) {
            const compData = u8.subarray(dataOffset, dataOffset + compSize);
            let xml = '';

            if (compMethod === 0) {
              xml = decoder.decode(compData);
            } else if (compMethod === 8) {
              xml = await decompressDeflateRaw(compData);
            }

            if (xml) {
              if (isDocx) {
                const paras = xml.split(/<\/w:p>/);
                for (const p of paras) {
                  const m = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
                  const line = m
                    .map((t) => t.replace(/<[^>]+>/g, ''))
                    .join('')
                    .trim();
                  if (line) textParts.push(line);
                }
              } else if (isPptx) {
                const numMatch = entryName.match(/slide(\d+)\.xml/);
                const slideNum = numMatch ? parseInt(numMatch[1], 10) : 999;
                const m = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
                const lines = m
                  .map((t) => t.replace(/<[^>]+>/g, '').trim())
                  .filter(Boolean);
                if (lines.length > 0) {
                  slides.push({ slideNum, text: lines });
                }
              } else if (isXlsx) {
                const m = xml.match(/<t[^>]*>([^<]*)<\/t>/g) || [];
                for (const t of m) {
                  const val = t.replace(/<[^>]+>/g, '').trim();
                  if (val && !textParts.includes(val)) textParts.push(val);
                }
              } else if (isOdt) {
                const m =
                  xml.match(/<text:[ph][^>]*>([^<]*)<\/text:[ph]>/g) || [];
                for (const t of m) {
                  const val = t.replace(/<[^>]+>/g, '').trim();
                  if (val) textParts.push(val);
                }
              }
            }
          }

          offset = dataOffset + compSize;
        } else {
          offset++;
        }
      }

      if (slides.length > 0) {
        slides.sort((a, b) => a.slideNum - b.slideNum);
        for (const s of slides) {
          textParts.push(`Slide ${s.slideNum}: ${s.text[0]}`);
          for (let i = 1; i < s.text.length; i++) {
            textParts.push(`  - ${s.text[i]}`);
          }
        }
      }

      if (textParts.length > 0) {
        return textParts.join('\n');
      }
    } catch {
      // Fall through to generic scanner
    }
  }

  // 2. Check for PDF (%PDF- header or .pdf extension)
  const isPdf =
    ext === 'pdf' ||
    (len >= 4 &&
      u8[0] === 0x25 &&
      u8[1] === 0x50 &&
      u8[2] === 0x44 &&
      u8[3] === 0x46);
  if (isPdf) {
    const rawBinary = Array.from(u8)
      .map((b) => String.fromCharCode(b))
      .join('');
    const textPieces: string[] = [];

    // Extract text in parentheses (text) Tj or ' or "
    const tjMatches = rawBinary.match(/\(([^)]{2,})\)\s*(?:Tj|'|")/g) || [];
    for (const m of tjMatches) {
      const str = m
        .replace(/^\(/, '')
        .replace(/\)\s*(?:Tj|'|")$/, '')
        .trim();
      if (
        str &&
        str.length >= 2 &&
        !str.startsWith('/') &&
        !str.startsWith('%')
      ) {
        textPieces.push(str);
      }
    }

    // Extract TJ array chunks [(text)] TJ
    const tjArrayMatches = rawBinary.match(/\[([\s\S]*?)\]\s*TJ/g) || [];
    for (const arr of tjArrayMatches) {
      const inner = arr.match(/\(([^)]+)\)/g) || [];
      const joined = inner
        .map((s) => s.slice(1, -1))
        .join('')
        .trim();
      if (joined && joined.length >= 2) {
        textPieces.push(joined);
      }
    }

    if (textPieces.length > 0) {
      return textPieces.join('\n');
    }
  }

  // 3. Decode as UTF-8
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const rawStr = decoder.decode(u8);

  // RTF file
  if (ext === 'rtf' || rawStr.startsWith('{\\rtf')) {
    return rawStr
      .replace(/\\(?:[a-zA-Z]+-?\d*|[^\r\n])/g, ' ')
      .replace(/[{}]/g, ' ')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n');
  }

  // CSV / TSV
  if (ext === 'csv' || ext === 'tsv') {
    const sep = ext === 'tsv' || rawStr.includes('\t') ? '\t' : ',';
    const lines = rawStr.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const parsed = lines.map((line) => {
      const cols = line
        .split(sep)
        .map((c) => c.replace(/^["']|["']$/g, '').trim());
      if (cols.length >= 2 && cols[0].match(/^\d+$/)) {
        return `${cols[0]}. ${cols[1]}`;
      }
      return cols.find((c) => c.length > 2) || line;
    });
    return parsed.join('\n');
  }

  // JSON
  if (
    ext === 'json' ||
    (rawStr.trim().startsWith('{') && rawStr.trim().endsWith('}')) ||
    (rawStr.trim().startsWith('[') && rawStr.trim().endsWith(']'))
  ) {
    try {
      const parsed = JSON.parse(rawStr);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item, idx) => {
            if (typeof item === 'string') return `${idx + 1}. ${item}`;
            if (typeof item === 'object' && item) {
              const title =
                item.title ||
                item.name ||
                item.chapter ||
                item.topic ||
                JSON.stringify(item);
              return `${item.chapterNumber || idx + 1}. ${title}`;
            }
            return String(item);
          })
          .join('\n');
      }
      if (parsed && typeof parsed === 'object') {
        const list =
          parsed.chapters || parsed.syllabus || parsed.outline || parsed.topics;
        if (Array.isArray(list)) {
          return list
            .map((c, i) =>
              typeof c === 'string'
                ? `${i + 1}. ${c}`
                : `${c.chapterNumber || i + 1}. ${c.title || c.name}`,
            )
            .join('\n');
        }
      }
    } catch {
      // Fall through
    }
  }

  // HTML / XML
  if (
    ext === 'html' ||
    ext === 'htm' ||
    rawStr.includes('<html') ||
    rawStr.includes('<body') ||
    rawStr.includes('</div>')
  ) {
    return rawStr
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .join('\n');
  }

  // 4. Binary check for legacy formats (.doc, .ppt, .xls) or arbitrary binary files
  let nonPrintableCount = 0;
  const sampleSize = Math.min(len, 1000);
  for (let i = 0; i < sampleSize; i++) {
    const b = u8[i];
    if (b < 9 || (b > 13 && b < 32)) {
      nonPrintableCount++;
    }
  }

  if (nonPrintableCount / sampleSize > 0.15) {
    // Binary fallback: extract all printable ASCII/UTF-8 character sequences
    const strings: string[] = [];
    let cur = '';
    for (let i = 0; i < len; i++) {
      const b = u8[i];
      if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b >= 160) {
        cur += String.fromCharCode(b);
      } else {
        if (cur.trim().length >= 3) {
          strings.push(cur.trim());
        }
        cur = '';
      }
    }
    if (cur.trim().length >= 3) {
      strings.push(cur.trim());
    }
    return strings
      .filter(
        (s) =>
          s.length >= 3 && !s.match(/^[^\w\s]+$/) && !s.startsWith('<?xml'),
      )
      .join('\n');
  }

  return rawStr;
}

/**
 * Parses raw text extracted from ANY document type (Markdown, Word, PowerPoint,
 * Excel, PDF, CSV, Text notes, Syllabus) into a structured DocParseResult
 * with detected topic name, description, and chapters.
 */
export function parseDocumentText(
  rawText: string,
  fileName?: string,
  userPrompt?: string,
): DocParseResult {
  const text = (rawText || '').trim();
  if (!text) {
    return {
      success: false,
      totalChapters: 0,
      outlineText: '',
      error: 'Empty document content',
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Detect candidate topic name
  let detectedTitle = '';
  for (const line of lines.slice(0, 10)) {
    const courseMatch = line.match(
      /^(?:course|subject|topic|syllabus|book|module|title)\s*[:\-–—]\s*(.+)$/i,
    );
    if (courseMatch) {
      detectedTitle = courseMatch[1].trim();
      break;
    }
  }

  if (!detectedTitle && lines.length > 0) {
    const firstLine = lines[0].replace(/^#+\s*/, '').trim();
    const isChapterOrMeta = firstLine.match(
      /^(?:chapter|ch\.?|slide|module|lecture|unit|\d+[:.)\-–—\s]|table of contents|contents|index|overview|summary)/i,
    );
    if (firstLine.length > 2 && firstLine.length < 80 && !isChapterOrMeta) {
      detectedTitle = firstLine;
    }
  }

  if (!detectedTitle && fileName) {
    detectedTitle = fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();
  }

  if (!detectedTitle) {
    detectedTitle = 'Technical Course';
  }

  // Filter out course metadata, title, and header lines before outline extraction
  const syllabusLines = lines.filter((l) => {
    const isMeta = l.match(
      /^(?:course|subject|topic|syllabus|description|overview|summary|abstract|table of contents|contents|index)\s*[:\-–—]?.*$/i,
    );
    if (isMeta) return false;

    // Filter out top-level title line if matched
    const stripped = l.replace(/^#+\s*/, '').trim();
    if (
      detectedTitle &&
      (stripped.toLowerCase() === detectedTitle.toLowerCase() ||
        l.startsWith('# '))
    ) {
      return false;
    }

    return true;
  });

  // 2. Parse chapters using domain outline parser
  let parsedItems = parseChapterOutline(syllabusLines.join('\n'));

  // 2b. Apply userPrompt filters if specified
  if (userPrompt && userPrompt.trim()) {
    const promptLower = userPrompt.toLowerCase();
    // Range filter: e.g. "chapter 3 to 7", "from 3 to 6", "3 to 5"
    const rangeMatch = promptLower.match(
      /(?:chapters?|ch\.?|from)\s*(\d+)\s*(?:to|through|-|–)\s*(\d+)/i,
    );
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        const filtered = parsedItems.filter(
          (c) => c.chapterNumber >= start && c.chapterNumber <= end,
        );
        if (filtered.length > 0) {
          parsedItems = filtered;
        }
      }
    }
  }

  // 3. Detect candidate topic description
  let detectedDesc = '';
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    const descMatch = line.match(
      /^(?:description|overview|summary|abstract)\s*[:\-–—]\s*(.+)$/i,
    );
    if (descMatch) {
      detectedDesc = descMatch[1].trim();
      break;
    }
  }

  if (!detectedDesc && parsedItems.length > 0) {
    const sampleTitles = parsedItems
      .slice(0, 3)
      .map((c) => c.title)
      .join(', ');
    detectedDesc = `Covers ${parsedItems.length} chapters including ${sampleTitles}.`;
  }

  const outlineText = parsedItems
    .map((item) => `${item.chapterNumber}. ${item.title}`)
    .join('\n');

  return {
    success: parsedItems.length > 0,
    topicName: detectedTitle,
    topicDescription: detectedDesc,
    totalChapters: parsedItems.length,
    outlineText,
  };
}
