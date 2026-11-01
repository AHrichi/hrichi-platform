import type {
  ArchiveExtractionResult,
  MediaCategory,
  ZipMediaEntry,
} from '../models/whatsapp.models';

const INVISIBLE_FORMAT_REGEX =
  /[\uFEFF\u200B\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069]/g;
const SPECIAL_SPACE_REGEX = /[\u00A0\u202F\u2007]/g;

const AUDIO_EXTENSIONS = new Set([
  '.opus',
  '.ogg',
  '.mp3',
  '.m4a',
  '.aac',
  '.wav',
  '.amr',
  '.flac',
]);

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.heic',
  '.avif',
  '.bmp',
]);

const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.3gp',
  '.webm',
]);

const DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.csv',
  '.zip',
  '.rar',
]);

/**
 * Classifies a filename into a WhatsApp MediaCategory and resolves its MIME type.
 */
export function classifyMediaFileName(fileName: string): {
  category: MediaCategory;
  extension: string;
  mimeType: string;
} {
  const base = (fileName.split('/').pop() ?? fileName).trim();
  const lower = base.toLowerCase();
  const dotIdx = lower.lastIndexOf('.');
  const ext = dotIdx !== -1 ? lower.slice(dotIdx) : '';

  if (
    ext === '.webp' ||
    lower.includes('sticker') ||
    lower.startsWith('stk-')
  ) {
    return {
      category: 'sticker',
      extension: ext || '.webp',
      mimeType: 'image/webp',
    };
  }

  if (ext === '.gif' || lower.includes('-gif-')) {
    return {
      category: 'gif',
      extension: '.gif',
      mimeType: 'image/gif',
    };
  }

  if (ext === '.vcf') {
    return {
      category: 'contact',
      extension: '.vcf',
      mimeType: 'text/vcard',
    };
  }

  if (
    AUDIO_EXTENSIONS.has(ext) ||
    lower.startsWith('ptt-') ||
    lower.startsWith('aud-') ||
    lower.includes('-audio-')
  ) {
    const mimeMap: Record<string, string> = {
      '.opus': 'audio/ogg; codecs=opus',
      '.ogg': 'audio/ogg',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.wav': 'audio/wav',
      '.amr': 'audio/amr',
      '.flac': 'audio/flac',
    };
    return {
      category: 'audio',
      extension: ext || '.opus',
      mimeType: mimeMap[ext] ?? 'audio/ogg',
    };
  }

  if (
    IMAGE_EXTENSIONS.has(ext) ||
    lower.startsWith('img-') ||
    lower.includes('-photo-')
  ) {
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.heic': 'image/heic',
      '.avif': 'image/avif',
    };
    return {
      category: 'image',
      extension: ext || '.jpg',
      mimeType: mimeMap[ext] ?? 'image/jpeg',
    };
  }

  if (
    VIDEO_EXTENSIONS.has(ext) ||
    lower.startsWith('vid-') ||
    lower.includes('-video-')
  ) {
    const mimeMap: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.3gp': 'video/3gpp',
    };
    return {
      category: 'video',
      extension: ext || '.mp4',
      mimeType: mimeMap[ext] ?? 'video/mp4',
    };
  }

  if (DOCUMENT_EXTENSIONS.has(ext) || lower.startsWith('doc-')) {
    return {
      category: 'document',
      extension: ext || '.pdf',
      mimeType: ext === '.pdf' ? 'application/pdf' : 'application/octet-stream',
    };
  }

  return {
    category: 'generic_media',
    extension: ext,
    mimeType: 'application/octet-stream',
  };
}

/**
 * Computes exact or estimated audio duration in seconds from raw binary audio bytes.
 * - For Ogg/Opus (.opus, .ogg): reads the last OggS page's 64-bit granule position (48,000 Hz).
 * - For RIFF WAV (.wav): reads byteRate from fmt chunk and data chunk size.
 * - Fallback: estimates from byte size using typical WhatsApp voice note bitrate (~18 kbps).
 */
export function computeAudioDurationFromBytes(
  bytes: Uint8Array,
  extension: string,
): number {
  const len = bytes.byteLength;
  if (len === 0) return 0;

  // 1. Ogg / Opus container ("OggS" magic = 0x4F 0x67 0x67 0x53)
  if (
    extension === '.opus' ||
    extension === '.ogg' ||
    (len >= 4 &&
      bytes[0] === 0x4f &&
      bytes[1] === 0x67 &&
      bytes[2] === 0x67 &&
      bytes[3] === 0x53)
  ) {
    const searchStart = Math.max(0, len - 65536);
    for (let i = len - 14; i >= searchStart; i--) {
      if (
        bytes[i] === 0x4f &&
        bytes[i + 1] === 0x67 &&
        bytes[i + 2] === 0x67 &&
        bytes[i + 3] === 0x53
      ) {
        // Granule position is 64-bit little-endian at i + 6..i + 13
        const view = new DataView(bytes.buffer, bytes.byteOffset + i + 6, 8);
        const low = view.getUint32(0, true);
        const high = view.getInt32(4, true);
        if (high >= 0) {
          const totalSamples = high * 4294967296 + low;
          if (totalSamples > 0) {
            // Opus always uses 48,000 Hz granule rate
            return Math.max(1, Math.round((totalSamples / 48000) * 10) / 10);
          }
        }
      }
    }
  }

  // 2. RIFF WAV container ("RIFF" magic)
  if (
    len >= 44 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, len);
    const byteRate = view.getUint32(28, true);
    if (byteRate > 0) {
      return Math.max(1, Math.round(((len - 44) / byteRate) * 10) / 10);
    }
  }

  // 3. Bitrate estimation fallback (~2,200 bytes/sec for WhatsApp voice notes)
  return Math.max(1, Math.round((len / 2200) * 10) / 10);
}

/**
 * Encodes a Uint8Array into a standard Base64 string in memory.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...sub);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return '';
}

/**
 * Strips invisible Unicode directional marks (LRM/RLM/Bidi isolates/BOM)
 * and normalizes non-breaking spaces (such as U+202F used by iOS before AM/PM).
 */
export function cleanInvisibleFormatting(raw: string): {
  text: string;
  cleanedText: string;
  strippedCount: number;
} {
  let strippedCount = 0;
  const withoutInvisible = raw.replace(INVISIBLE_FORMAT_REGEX, () => {
    strippedCount++;
    return '';
  });
  const normalizedSpaces = withoutInvisible.replace(SPECIAL_SPACE_REGEX, ' ');
  const normalizedNewlines = normalizedSpaces.replace(/\r\n?/g, '\n');
  return {
    text: normalizedNewlines,
    cleanedText: normalizedNewlines,
    strippedCount,
  };
}

/**
 * Ingests a plain text string (e.g. from a .txt file upload) and cleans formatting characters.
 */
export function ingestPlainTextTranscript(
  rawContent: string,
  fileName: string,
  sourceType: 'txt' | 'demo' = 'txt',
): ArchiveExtractionResult {
  const { text, strippedCount } = cleanInvisibleFormatting(rawContent);
  return {
    fileName,
    sourceType,
    transcriptFileName: fileName,
    rawText: text,
    cleanedCharCount: text.length,
    strippedInvisibleChars: strippedCount,
    skippedMediaFiles: [],
    skippedMediaCount: 0,
    totalZipEntries: 1,
    mediaEntries: [],
    extractedAudioFiles: [],
    totalMediaBytes: 0,
  };
}

interface ZipEntryMeta {
  fileName: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  nextOffsetBoundary?: number;
}

/**
 * Checks whether an ArrayBuffer starts with the standard PKZIP magic signature (0x04034b50).
 */
export function isZipBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const view = new DataView(buffer);
  const sig = view.getUint32(0, true);
  return sig === 0x04034b50 || sig === 0x06054b50;
}

function readUint64LE(view: DataView, offset: number): number {
  const low = view.getUint32(offset, true);
  const high = view.getUint32(offset + 4, true);
  return high * 4294967296 + low;
}

/**
 * Decompresses raw DEFLATE bytes (RFC 1951) using native Web DecompressionStream.
 * Resilient to trailing Data Descriptor bytes appended by Google Drive streaming ZIPs.
 */
async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    const writePromise = writer
      .write(new Uint8Array(compressed))
      .then(() => writer.close())
      .catch(() => undefined);

    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    let totalLen = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          totalLen += value.byteLength;
        }
      }
    } catch {
      // If a streaming ZIP includes a trailing 12/16-byte Data Descriptor after the
      // DEFLATE end-of-block marker, DecompressionStream may throw after emitting all output chunks.
      // If we already collected decompressed chunks, return them cleanly.
      if (totalLen === 0) {
        throw new Error('Failed to decompress DEFLATE stream in ZIP archive.');
      }
    }
    await writePromise;

    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }

  throw new Error('DecompressionStream is not supported in this environment.');
}

async function extractEntryBytes(
  view: DataView,
  bytes: Uint8Array,
  entry: ZipEntryMeta,
): Promise<Uint8Array> {
  const localPos = entry.localHeaderOffset;
  if (
    localPos + 30 > bytes.byteLength ||
    view.getUint32(localPos, true) !== 0x04034b50
  ) {
    throw new Error(
      `Corrupted local file header for "${entry.fileName}" in ZIP archive.`,
    );
  }

  const localNameLen = view.getUint16(localPos + 26, true);
  const localExtraLen = view.getUint16(localPos + 28, true);
  const dataStart = localPos + 30 + localNameLen + localExtraLen;

  let effectiveCompressedSize = entry.compressedSize;
  if (
    effectiveCompressedSize === 0 ||
    effectiveCompressedSize === 0xffffffff ||
    dataStart + effectiveCompressedSize > bytes.byteLength
  ) {
    const boundary = entry.nextOffsetBoundary ?? bytes.byteLength;
    effectiveCompressedSize = Math.max(0, boundary - dataStart);
  }

  const dataEnd = Math.min(
    bytes.byteLength,
    dataStart + effectiveCompressedSize,
  );
  const compressedSlice = bytes.subarray(dataStart, dataEnd);
  if (entry.compressionMethod === 0) {
    const uncompressedLen =
      entry.uncompressedSize > 0 &&
      entry.uncompressedSize !== 0xffffffff &&
      entry.uncompressedSize <= compressedSlice.byteLength
        ? entry.uncompressedSize
        : compressedSlice.byteLength;
    return compressedSlice.subarray(0, uncompressedLen);
  }
  if (entry.compressionMethod === 8) {
    return inflateRawBytes(compressedSlice);
  }
  throw new Error(
    `Unsupported ZIP compression method (${entry.compressionMethod}) for "${entry.fileName}".`,
  );
}

const MAX_EXTRACTED_AUDIO_FILES = 300;
const MAX_SINGLE_AUDIO_BYTES = 8 * 1024 * 1024; // 8 MB per voice note
const MAX_PREVIEW_IMAGES = 24;
const MAX_SINGLE_IMAGE_PREVIEW_BYTES = 1024 * 1024; // 1 MB per image preview

/**
 * Extracts the WhatsApp chat `.txt` transcript AND inspects all bundled media files
 * (.opus/.ogg/.m4a/.mp3 voice notes, .jpg/.png/.webp photos & stickers, .mp4 videos, .pdf docs)
 * from an in-memory ZIP archive ArrayBuffer (supporting standard PKZIP, Google Drive streaming ZIPs, and ZIP64).
 */
export async function extractTranscriptFromZip(
  buffer: ArrayBuffer,
  zipFileName = 'whatsapp-export.zip',
): Promise<ArchiveExtractionResult> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder('utf-8', { fatal: false });

  // Locate End of Central Directory (EOCD) signature: 0x06054b50
  let eocdOffset = -1;
  const minEocdSearch = Math.max(0, bytes.byteLength - 65557);
  for (let i = bytes.byteLength - 22; i >= minEocdSearch; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  const entries: ZipEntryMeta[] = [];
  let centralDirStartOffset = bytes.byteLength;

  if (eocdOffset !== -1) {
    let totalEntries = view.getUint16(eocdOffset + 10, true);
    let centralDirOffset = view.getUint32(eocdOffset + 16, true);

    // Check for ZIP64 End of Central Directory Locator (0x07064b50) 20 bytes before EOCD
    if (
      (totalEntries === 0xffff || centralDirOffset === 0xffffffff) &&
      eocdOffset >= 20 &&
      view.getUint32(eocdOffset - 20, true) === 0x07064b50
    ) {
      const zip64EocdOffset = readUint64LE(view, eocdOffset - 20 + 8);
      if (
        zip64EocdOffset + 56 <= bytes.byteLength &&
        view.getUint32(zip64EocdOffset, true) === 0x06064b50
      ) {
        totalEntries = readUint64LE(view, zip64EocdOffset + 32);
        centralDirOffset = readUint64LE(view, zip64EocdOffset + 48);
      }
    }

    centralDirStartOffset = centralDirOffset;
    let ptr = centralDirOffset;

    for (let i = 0; i < totalEntries && ptr + 46 <= bytes.byteLength; i++) {
      const sig = view.getUint32(ptr, true);
      if (sig !== 0x02014b50) break;

      const compressionMethod = view.getUint16(ptr + 10, true);
      let compressedSize = view.getUint32(ptr + 20, true);
      let uncompressedSize = view.getUint32(ptr + 24, true);
      const fileNameLen = view.getUint16(ptr + 28, true);
      const extraFieldLen = view.getUint16(ptr + 30, true);
      const commentLen = view.getUint16(ptr + 32, true);
      let localHeaderOffset = view.getUint32(ptr + 42, true);

      const nameBytes = bytes.subarray(ptr + 46, ptr + 46 + fileNameLen);
      const fileName = decoder.decode(nameBytes);

      // Parse ZIP64 Extended Information Extra Field (0x0001) if any field is 0xFFFFFFFF
      if (
        extraFieldLen > 0 &&
        (uncompressedSize === 0xffffffff ||
          compressedSize === 0xffffffff ||
          localHeaderOffset === 0xffffffff)
      ) {
        let extraPtr = ptr + 46 + fileNameLen;
        const extraEnd = Math.min(bytes.byteLength, extraPtr + extraFieldLen);
        while (extraPtr + 4 <= extraEnd) {
          const headerId = view.getUint16(extraPtr, true);
          const dataSize = view.getUint16(extraPtr + 2, true);
          let fieldCursor = extraPtr + 4;
          if (headerId === 0x0001) {
            if (
              uncompressedSize === 0xffffffff &&
              fieldCursor + 8 <= extraEnd
            ) {
              uncompressedSize = readUint64LE(view, fieldCursor);
              fieldCursor += 8;
            }
            if (compressedSize === 0xffffffff && fieldCursor + 8 <= extraEnd) {
              compressedSize = readUint64LE(view, fieldCursor);
              fieldCursor += 8;
            }
            if (
              localHeaderOffset === 0xffffffff &&
              fieldCursor + 8 <= extraEnd
            ) {
              localHeaderOffset = readUint64LE(view, fieldCursor);
              fieldCursor += 8;
            }
            break;
          }
          extraPtr += 4 + dataSize;
        }
      }

      if (!fileName.endsWith('/')) {
        entries.push({
          fileName,
          compressionMethod,
          compressedSize,
          uncompressedSize,
          localHeaderOffset,
        });
      }

      ptr += 46 + fileNameLen + extraFieldLen + commentLen;
    }
  } else {
    // Fallback: sequential scan of Local File Headers (0x04034b50)
    let ptr = 0;
    while (ptr + 30 <= bytes.byteLength) {
      const sig = view.getUint32(ptr, true);
      if (sig !== 0x04034b50) break;

      const flags = view.getUint16(ptr + 6, true);
      const compressionMethod = view.getUint16(ptr + 8, true);
      const compressedSize = view.getUint32(ptr + 18, true);
      const uncompressedSize = view.getUint32(ptr + 22, true);
      const fileNameLen = view.getUint16(ptr + 26, true);
      const extraLen = view.getUint16(ptr + 28, true);

      if ((flags & 0x08) !== 0 && compressedSize === 0) {
        break;
      }

      const nameBytes = bytes.subarray(ptr + 30, ptr + 30 + fileNameLen);
      const fileName = decoder.decode(nameBytes);

      if (!fileName.endsWith('/')) {
        entries.push({
          fileName,
          compressionMethod,
          compressedSize,
          uncompressedSize,
          localHeaderOffset: ptr,
        });
      }

      ptr += 30 + fileNameLen + extraLen + compressedSize;
    }
  }

  // Compute nextOffsetBoundary for each entry (sorted by localHeaderOffset) to support streaming ZIPs
  const byOffset = [...entries].sort(
    (a, b) => a.localHeaderOffset - b.localHeaderOffset,
  );
  for (let i = 0; i < byOffset.length; i++) {
    byOffset[i].nextOffsetBoundary =
      i + 1 < byOffset.length
        ? byOffset[i + 1].localHeaderOffset
        : centralDirStartOffset;
  }

  if (entries.length === 0) {
    throw new Error(
      'Invalid or empty ZIP archive: no file entries could be located.',
    );
  }

  const skippedMediaFiles: string[] = [];
  const txtCandidates: ZipEntryMeta[] = [];
  const mediaEntries: ZipMediaEntry[] = [];
  const extractedAudioFiles: ZipMediaEntry[] = [];
  let totalMediaBytes = 0;
  let extractedAudioCount = 0;
  let extractedImagePreviewCount = 0;

  for (const entry of entries) {
    const lower = entry.fileName.toLowerCase();
    if (lower.startsWith('__macosx/') || lower.endsWith('.ds_store')) {
      continue;
    }
    if (lower.endsWith('.txt')) {
      txtCandidates.push(entry);
      continue;
    }

    const baseName = entry.fileName.split('/').pop() ?? entry.fileName;
    skippedMediaFiles.push(baseName);

    const { category, extension, mimeType } = classifyMediaFileName(baseName);
    const rawUncompressed =
      entry.uncompressedSize > 0 && entry.uncompressedSize !== 0xffffffff
        ? entry.uncompressedSize
        : entry.compressedSize > 0 && entry.compressedSize !== 0xffffffff
          ? entry.compressedSize
          : 0;
    totalMediaBytes += rawUncompressed;

    const mediaItem: ZipMediaEntry = {
      fileName: baseName,
      fullPath: entry.fileName,
      category,
      extension,
      mimeType,
      sizeBytes: rawUncompressed,
      uncompressedBytes: rawUncompressed,
      compressedBytes: entry.compressedSize,
    };

    // If it's an audio file (voice note), extract bytes to compute duration & enable playback/STT
    if (category === 'audio') {
      if (
        extractedAudioCount < MAX_EXTRACTED_AUDIO_FILES &&
        (rawUncompressed === 0 || rawUncompressed <= MAX_SINGLE_AUDIO_BYTES)
      ) {
        try {
          const audioBytes = await extractEntryBytes(view, bytes, entry);
          if (rawUncompressed === 0 && audioBytes.byteLength > 0) {
            mediaItem.sizeBytes = audioBytes.byteLength;
            mediaItem.uncompressedBytes = audioBytes.byteLength;
            totalMediaBytes += audioBytes.byteLength;
          }
          const durationSeconds = computeAudioDurationFromBytes(
            audioBytes,
            extension,
          );
          mediaItem.durationSeconds = durationSeconds;
          if (audioBytes.byteLength <= MAX_SINGLE_AUDIO_BYTES) {
            const base64Data = uint8ArrayToBase64(audioBytes);
            const dataMime = mimeType.split(';')[0] || 'audio/ogg';
            if (base64Data) {
              mediaItem.base64Data = base64Data;
              mediaItem.previewUrl = `data:${dataMime};base64,${base64Data}`;
            }
            extractedAudioCount++;
            extractedAudioFiles.push(mediaItem);
          }
        } catch {
          mediaItem.durationSeconds = Math.max(
            1,
            Math.round(((rawUncompressed || 16000) / 2200) * 10) / 10,
          );
        }
      } else {
        mediaItem.durationSeconds = Math.max(
          1,
          Math.round(((rawUncompressed || 16000) / 2200) * 10) / 10,
        );
      }
    } else if (
      (category === 'image' || category === 'sticker' || category === 'gif') &&
      extractedImagePreviewCount < MAX_PREVIEW_IMAGES &&
      (rawUncompressed === 0 ||
        rawUncompressed <= MAX_SINGLE_IMAGE_PREVIEW_BYTES)
    ) {
      try {
        const imgBytes = await extractEntryBytes(view, bytes, entry);
        if (imgBytes.byteLength <= MAX_SINGLE_IMAGE_PREVIEW_BYTES) {
          const base64Data = uint8ArrayToBase64(imgBytes);
          if (base64Data) {
            mediaItem.previewUrl = `data:${mimeType};base64,${base64Data}`;
            extractedImagePreviewCount++;
          }
        }
      } catch {
        // Ignore thumbnail extraction failure
      }
    }

    mediaEntries.push(mediaItem);
  }

  if (txtCandidates.length === 0) {
    throw new Error(
      `No WhatsApp .txt transcript found inside "${zipFileName}" (scanned ${entries.length} entries, found ${skippedMediaFiles.length} media files).`,
    );
  }

  // Prioritize _chat.txt or WhatsApp Chat*.txt, then largest uncompressed size
  txtCandidates.sort((a, b) => {
    const aBase = (a.fileName.split('/').pop() ?? a.fileName).toLowerCase();
    const bBase = (b.fileName.split('/').pop() ?? b.fileName).toLowerCase();
    const aScore =
      aBase === '_chat.txt' || aBase.startsWith('whatsapp chat') ? 1 : 0;
    const bScore =
      bBase === '_chat.txt' || bBase.startsWith('whatsapp chat') ? 1 : 0;
    if (aScore !== bScore) return bScore - aScore;
    return b.uncompressedSize - a.uncompressedSize;
  });

  const target = txtCandidates[0];
  const rawTranscriptBytes = await extractEntryBytes(view, bytes, target);
  const decodedText = decoder.decode(rawTranscriptBytes);
  const { text, strippedCount } = cleanInvisibleFormatting(decodedText);
  const transcriptBaseName =
    target.fileName.split('/').pop() ?? target.fileName;

  return {
    fileName: zipFileName,
    sourceType: 'zip',
    transcriptFileName: transcriptBaseName,
    rawText: text,
    cleanedCharCount: text.length,
    strippedInvisibleChars: strippedCount,
    skippedMediaFiles,
    skippedMediaCount: skippedMediaFiles.length,
    totalZipEntries: entries.length,
    mediaEntries,
    extractedAudioFiles,
    totalMediaBytes,
  };
}

/**
 * Processes a list of raw file buffers (e.g. when a user selects multiple files or an unzipped
 * folder exported to Google Drive containing `WhatsApp Chat with X.txt` + `.opus`/`.jpg`/`.mp4` files).
 */
export function buildMediaEntriesFromFiles(
  rawFiles: ReadonlyArray<{ name: string; buffer: ArrayBuffer }>,
): {
  mediaEntries: ZipMediaEntry[];
  extractedAudioFiles: ZipMediaEntry[];
  skippedMediaFiles: string[];
  totalMediaBytes: number;
} {
  const mediaEntries: ZipMediaEntry[] = [];
  const extractedAudioFiles: ZipMediaEntry[] = [];
  const skippedMediaFiles: string[] = [];
  let totalMediaBytes = 0;
  let extractedAudioCount = 0;
  let extractedImagePreviewCount = 0;

  for (const f of rawFiles) {
    const baseName = f.name.split(/[/\\]/).pop() ?? f.name;
    const lower = baseName.toLowerCase();
    if (lower.startsWith('.') || lower.endsWith('.ds_store')) {
      continue;
    }

    skippedMediaFiles.push(baseName);
    const { category, extension, mimeType } = classifyMediaFileName(baseName);
    const fileBytes = new Uint8Array(f.buffer);
    const sizeBytes = fileBytes.byteLength;
    totalMediaBytes += sizeBytes;

    const item: ZipMediaEntry = {
      fileName: baseName,
      fullPath: f.name,
      category,
      extension,
      mimeType,
      sizeBytes,
      uncompressedBytes: sizeBytes,
      compressedBytes: sizeBytes,
    };

    if (category === 'audio') {
      const durationSeconds = computeAudioDurationFromBytes(
        fileBytes,
        extension,
      );
      item.durationSeconds = durationSeconds;
      if (
        extractedAudioCount < MAX_EXTRACTED_AUDIO_FILES &&
        sizeBytes <= MAX_SINGLE_AUDIO_BYTES
      ) {
        const base64Data = uint8ArrayToBase64(fileBytes);
        const dataMime = mimeType.split(';')[0] || 'audio/ogg';
        if (base64Data) {
          item.base64Data = base64Data;
          item.previewUrl = `data:${dataMime};base64,${base64Data}`;
        }
        extractedAudioCount++;
        extractedAudioFiles.push(item);
      }
    } else if (
      (category === 'image' || category === 'sticker' || category === 'gif') &&
      extractedImagePreviewCount < MAX_PREVIEW_IMAGES &&
      sizeBytes <= MAX_SINGLE_IMAGE_PREVIEW_BYTES
    ) {
      const base64Data = uint8ArrayToBase64(fileBytes);
      if (base64Data) {
        item.previewUrl = `data:${mimeType};base64,${base64Data}`;
        extractedImagePreviewCount++;
      }
    }

    mediaEntries.push(item);
  }

  return {
    mediaEntries,
    extractedAudioFiles,
    skippedMediaFiles,
    totalMediaBytes,
  };
}

/**
 * Appends additional media files (e.g. `.opus`, `.jpg`, `.mp4` selected from Google Drive)
 * to an already-loaded `ArchiveExtractionResult`.
 */
export function appendMediaFilesToExtraction(
  existing: ArchiveExtractionResult,
  newMediaFiles: ReadonlyArray<{ name: string; buffer: ArrayBuffer }>,
): ArchiveExtractionResult {
  const added = buildMediaEntriesFromFiles(newMediaFiles);
  const existingNames = new Set(
    (existing.mediaEntries ?? []).map((e) => e.fileName.toLowerCase()),
  );
  const mergedMedia = [
    ...(existing.mediaEntries ?? []),
    ...added.mediaEntries.filter(
      (e) => !existingNames.has(e.fileName.toLowerCase()),
    ),
  ];
  const mergedAudio = mergedMedia.filter((e) => e.category === 'audio');
  const mergedSkipped = mergedMedia.map((e) => e.fileName);
  const totalBytes = mergedMedia.reduce((s, e) => s + e.sizeBytes, 0);

  return {
    ...existing,
    sourceType: 'zip',
    skippedMediaFiles: mergedSkipped,
    skippedMediaCount: mergedSkipped.length,
    totalZipEntries: 1 + mergedSkipped.length,
    mediaEntries: mergedMedia,
    extractedAudioFiles: mergedAudio,
    totalMediaBytes: totalBytes,
  };
}

/**
 * Builds an uncompressed (STORE, method=0) ZIP archive in memory from a list of files.
 * Useful for unit testing and sample archive generation.
 */
export function buildInMemoryZipArchive(
  files: ReadonlyArray<{ name: string; content: string | Uint8Array }>,
): ArrayBuffer {
  const encoder = new TextEncoder();
  const encodedFiles = files.map((file) => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes =
      typeof file.content === 'string'
        ? encoder.encode(file.content)
        : file.content;
    return { nameBytes, dataBytes };
  });

  let localHeadersSize = 0;
  let centralDirSize = 0;
  for (const f of encodedFiles) {
    localHeadersSize += 30 + f.nameBytes.byteLength + f.dataBytes.byteLength;
    centralDirSize += 46 + f.nameBytes.byteLength;
  }

  const totalSize = localHeadersSize + centralDirSize + 22;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  let localOffset = 0;
  const offsets: number[] = [];

  for (const f of encodedFiles) {
    offsets.push(localOffset);
    view.setUint32(localOffset, 0x04034b50, true); // Local file header signature
    view.setUint16(localOffset + 4, 20, true); // Version needed
    view.setUint16(localOffset + 6, 0, true); // Flags
    view.setUint16(localOffset + 8, 0, true); // Compression method 0 (STORE)
    view.setUint16(localOffset + 10, 0, true); // Mod time
    view.setUint16(localOffset + 12, 0, true); // Mod date
    view.setUint32(localOffset + 14, 0, true); // CRC-32 (0 for test store)
    view.setUint32(localOffset + 18, f.dataBytes.byteLength, true); // Compressed size
    view.setUint32(localOffset + 22, f.dataBytes.byteLength, true); // Uncompressed size
    view.setUint16(localOffset + 26, f.nameBytes.byteLength, true); // File name length
    view.setUint16(localOffset + 28, 0, true); // Extra field length

    bytes.set(f.nameBytes, localOffset + 30);
    bytes.set(f.dataBytes, localOffset + 30 + f.nameBytes.byteLength);
    localOffset += 30 + f.nameBytes.byteLength + f.dataBytes.byteLength;
  }

  const centralDirStart = localOffset;
  let centralOffset = centralDirStart;

  for (let i = 0; i < encodedFiles.length; i++) {
    const f = encodedFiles[i];
    view.setUint32(centralOffset, 0x02014b50, true); // Central directory signature
    view.setUint16(centralOffset + 4, 20, true); // Version made by
    view.setUint16(centralOffset + 6, 20, true); // Version needed
    view.setUint16(centralOffset + 8, 0, true); // Flags
    view.setUint16(centralOffset + 10, 0, true); // Compression method 0
    view.setUint16(centralOffset + 12, 0, true); // Mod time
    view.setUint16(centralOffset + 14, 0, true); // Mod date
    view.setUint32(centralOffset + 16, 0, true); // CRC-32
    view.setUint32(centralOffset + 20, f.dataBytes.byteLength, true); // Compressed size
    view.setUint32(centralOffset + 24, f.dataBytes.byteLength, true); // Uncompressed size
    view.setUint16(centralOffset + 28, f.nameBytes.byteLength, true); // File name length
    view.setUint16(centralOffset + 30, 0, true); // Extra field length
    view.setUint16(centralOffset + 32, 0, true); // Comment length
    view.setUint16(centralOffset + 34, 0, true); // Disk number
    view.setUint16(centralOffset + 36, 0, true); // Internal attrs
    view.setUint32(centralOffset + 38, 0, true); // External attrs
    view.setUint32(centralOffset + 42, offsets[i], true); // Local header offset

    bytes.set(f.nameBytes, centralOffset + 46);
    centralOffset += 46 + f.nameBytes.byteLength;
  }

  // End of Central Directory (EOCD)
  view.setUint32(centralOffset, 0x06054b50, true);
  view.setUint16(centralOffset + 4, 0, true);
  view.setUint16(centralOffset + 6, 0, true);
  view.setUint16(centralOffset + 8, encodedFiles.length, true);
  view.setUint16(centralOffset + 10, encodedFiles.length, true);
  view.setUint32(centralOffset + 12, centralDirSize, true);
  view.setUint32(centralOffset + 16, centralDirStart, true);
  view.setUint16(centralOffset + 20, 0, true);

  return buffer;
}
