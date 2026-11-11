export interface RecordedRequest {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

type Reply = { status: number; json: unknown } | { throws: string };

/**
 * A fetch that answers from a script, in order, and records what it was
 * asked, so tests check both the request shapes and the failover.
 */
export class FakeFetch {
  readonly requests: RecordedRequest[] = [];
  private readonly replies: Reply[] = [];

  reply(status: number, json: unknown): this {
    this.replies.push({ status, json });
    return this;
  }

  fail(message = 'network down'): this {
    this.replies.push({ throws: message });
    return this;
  }

  readonly fetch: typeof fetch = async (input, init) => {
    const headers = Object.fromEntries(
      Object.entries((init?.headers as Record<string, string>) ?? {}),
    );
    const raw = init?.body;
    const body =
      typeof raw === 'string'
        ? JSON.parse(raw)
        : raw instanceof FormData
          ? Object.fromEntries(
              [...raw.entries()].map(([key, value]) => [
                key,
                typeof value === 'string' ? value : `[file ${value.type}]`,
              ]),
            )
          : raw;
    this.requests.push({ url: String(input), headers, body });
    const next = this.replies.shift();
    if (!next) throw new Error(`No scripted reply for ${String(input)}`);
    if ('throws' in next) throw new TypeError(next.throws);
    return new Response(JSON.stringify(next.json), {
      status: next.status,
      headers: { 'content-type': 'application/json' },
    });
  };
}

/** A Groq chat completion whose message is `content`. */
export function groqReply(content: unknown): unknown {
  return {
    choices: [
      {
        message: {
          content:
            typeof content === 'string' ? content : JSON.stringify(content),
        },
      },
    ],
  };
}

/** A Gemini generateContent reply, with a thought part to skip. */
export function geminiReply(content: unknown): unknown {
  return {
    candidates: [
      {
        content: {
          parts: [
            { text: 'thinking…', thought: true },
            {
              text:
                typeof content === 'string' ? content : JSON.stringify(content),
            },
          ],
        },
      },
    ],
  };
}
