import { ModelCallError } from './models';

type Fetch = typeof fetch;

export interface AudioClip {
  bytes: Uint8Array;
  /** e.g. `audio/webm;codecs=opus`. */
  mimeType: string;
}

export interface Transcriber {
  readonly label: string;
  transcribe(clip: AudioClip): Promise<string>;
}

function fileName(mimeType: string): string {
  const subtype = mimeType.split('/')[1]?.split(';')[0] ?? 'webm';
  const extension =
    subtype === 'mpeg' ? 'mp3' : subtype === 'x-m4a' ? 'm4a' : subtype;
  return `capture.${extension}`;
}

/**
 * Groq's Whisper (OpenAI-compatible `audio/transcriptions`). The free tier
 * allows about 2,000 requests a day and 7,200 audio seconds an hour, far
 * above a person's voice notes (design §12).
 */
export class GroqWhisperTranscriber implements Transcriber {
  readonly label: string;

  constructor(
    private readonly apiKey: string,
    private readonly model = 'whisper-large-v3-turbo',
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
  ) {
    this.label = `Groq (${model})`;
  }

  async transcribe(clip: AudioClip): Promise<string> {
    const form = new FormData();
    form.append(
      'file',
      new Blob([clip.bytes as Uint8Array<ArrayBuffer>], {
        type: clip.mimeType,
      }),
      fileName(clip.mimeType),
    );
    form.append('model', this.model);
    form.append('response_format', 'json');
    form.append('language', 'en');
    let response: Response;
    try {
      response = await this.fetchFn(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: { authorization: `Bearer ${this.apiKey}` },
          body: form,
          signal: AbortSignal.timeout(60_000),
        },
      );
    } catch (error) {
      throw new ModelCallError(
        this.label,
        error instanceof Error ? error.message : 'no response',
      );
    }
    if (!response.ok) {
      throw new ModelCallError(
        this.label,
        `HTTP ${response.status}`,
        response.status,
      );
    }
    const payload = (await response.json().catch(() => null)) as {
      text?: unknown;
    } | null;
    return String(payload?.text ?? '').trim();
  }
}

/** Gemini listening to the clip inline, asked for a verbatim transcript. */
export class GeminiTranscriber implements Transcriber {
  readonly label: string;

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gemini-flash-latest',
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
  ) {
    this.label = `Gemini (${model})`;
  }

  async transcribe(clip: AudioClip): Promise<string> {
    let binary = '';
    for (const byte of clip.bytes) binary += String.fromCharCode(byte);
    let response: Response;
    try {
      response = await this.fetchFn(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inline_data: {
                      mime_type: clip.mimeType.split(';')[0],
                      data: btoa(binary),
                    },
                  },
                  {
                    text: 'Transcribe this voice note word for word in English. Reply with the transcript only.',
                  },
                ],
              },
            ],
          }),
          signal: AbortSignal.timeout(60_000),
        },
      );
    } catch (error) {
      throw new ModelCallError(
        this.label,
        error instanceof Error ? error.message : 'no response',
      );
    }
    if (!response.ok) {
      throw new ModelCallError(
        this.label,
        `HTTP ${response.status}`,
        response.status,
      );
    }
    const payload = (await response.json().catch(() => null)) as {
      candidates?: {
        content?: { parts?: { text?: string; thought?: boolean }[] };
      }[];
    } | null;
    return (payload?.candidates?.[0]?.content?.parts ?? [])
      .filter((part) => !part.thought)
      .map((part) => part.text ?? '')
      .join('')
      .trim();
  }
}

/** Tries each transcriber in turn; an empty transcript counts as a failure. */
export class FallbackTranscriber implements Transcriber {
  readonly label = 'transcription ladder';

  constructor(private readonly transcribers: readonly Transcriber[]) {}

  get configured(): boolean {
    return this.transcribers.length > 0;
  }

  async transcribe(clip: AudioClip): Promise<string> {
    const failures: string[] = [];
    for (const transcriber of this.transcribers) {
      try {
        const text = await transcriber.transcribe(clip);
        if (text) return text;
        failures.push(`${transcriber.label}: empty transcript`);
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
    }
    throw new Error(
      failures.length
        ? `Transcription failed: ${failures.join('; ')}`
        : 'No transcription model is configured.',
    );
  }
}
