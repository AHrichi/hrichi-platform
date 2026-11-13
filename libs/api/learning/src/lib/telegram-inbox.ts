import { Logger } from '@nestjs/common';
import * as v from 'valibot';
import {
  captureFromInbox,
  type EdgeInboxItem,
  EdgeInboxItemSchema,
  SERVER_TOKEN_SUBJECT,
  SERVER_TOKEN_TTL_MS,
  signDeviceToken,
} from '@ah/learning/domain';
import type { CapturePipeline } from './capture-pipeline';
import type { EdgeDeviceSync } from './edge-devices';

type Fetch = typeof fetch;

export interface TelegramInboxOptions {
  /** The edge Worker's URL; without it there is no Telegram capture. */
  edgeUrl: string | null;
  /** To fetch voice notes from Telegram; without it they wait. */
  botToken: string | null;
  /** Signs the API's token for the Worker (the device-token secret). */
  tokenSecret: string;
}

const ItemsSchema = v.object({ items: v.array(v.unknown()) });

/**
 * Pulls what the owner sent the bot (design §9) from the edge Worker and
 * turns each message into a capture, the ADR-0010 backstop pattern: the
 * Worker keeps an item until the API acknowledges it, so nothing is lost
 * while Render sleeps. A voice note is fetched from Telegram by its
 * `file_id` and transcribed; one that fails stays in the Worker and is
 * tried again on the next pull. Pulls repeat safely: the capture id is
 * fixed when the message arrives.
 */
export class TelegramInbox {
  private readonly logger = new Logger(TelegramInbox.name);
  private readonly base: string | null;
  private running: Promise<number> | null = null;

  constructor(
    private readonly options: TelegramInboxOptions,
    private readonly pipeline: CapturePipeline,
    private readonly now: () => Date = () => new Date(),
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
    private readonly edgeDevices: EdgeDeviceSync | null = null,
  ) {
    this.base = options.edgeUrl?.replace(/\/+$/, '') || null;
  }

  get configured(): boolean {
    return !!this.base;
  }

  /** One pull at a time; a second call joins the running one. */
  pull(): Promise<number> {
    this.running ??= this.pullOnce().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async pullOnce(): Promise<number> {
    if (!this.base) return 0;
    if (this.edgeDevices?.configured) {
      await this.edgeDevices.pullRevocations();
    }
    const token = await signDeviceToken(this.options.tokenSecret, {
      deviceId: SERVER_TOKEN_SUBJECT,
      expiresAt: new Date(this.now().getTime() + SERVER_TOKEN_TTL_MS),
    });
    const headers = { authorization: `Bearer ${token}` };
    const response = await this.fetchFn(`${this.base}/inbox`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`The edge Worker answered ${response.status}`);
    }
    const body = v.safeParse(ItemsSchema, await response.json());
    if (!body.success) throw new Error('The edge inbox reply is malformed.');

    const done: string[] = [];
    for (const raw of body.output.items) {
      const parsed = v.safeParse(EdgeInboxItemSchema, raw);
      if (!parsed.success) continue;
      try {
        if (await this.take(parsed.output)) done.push(parsed.output.key);
      } catch (error) {
        this.logger.warn(
          `Telegram message ${parsed.output.updateId} waits: ${String(error)}`,
        );
      }
    }
    if (done.length) {
      const ack = await this.fetchFn(`${this.base}/inbox/ack`, {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ keys: done }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!ack.ok) throw new Error(`The ack answered ${ack.status}`);
    }
    if (this.edgeDevices?.configured) {
      await this.edgeDevices.pushDevices();
    }
    return done.length;
  }

  /** True when the item is a capture now and can leave the Worker. */
  private async take(item: EdgeInboxItem): Promise<boolean> {
    const capture = await this.pipeline.addCapture(
      captureFromInbox(item, this.now()),
    );
    if (!item.voice || capture.transcript) return true;
    if (!this.options.botToken) return false;
    const audio = await this.download(item.voice.fileId);
    await this.pipeline.receiveAudio(capture.id, {
      bytes: audio,
      mimeType: item.voice.mimeType,
    });
    return true;
  }

  /** A voice note's bytes, from Telegram (getFile, then the file URL). */
  private async download(fileId: string): Promise<Uint8Array> {
    const api = `https://api.telegram.org/bot${this.options.botToken}`;
    const meta = await this.fetchFn(
      `${api}/getFile?file_id=${encodeURIComponent(fileId)}`,
      { signal: AbortSignal.timeout(15_000) },
    );
    const payload = (await meta.json().catch(() => null)) as {
      ok?: boolean;
      result?: { file_path?: string };
    } | null;
    const path = payload?.result?.file_path;
    if (!meta.ok || !payload?.ok || !path) {
      throw new Error(`Telegram getFile answered ${meta.status}`);
    }
    const file = await this.fetchFn(
      `https://api.telegram.org/file/bot${this.options.botToken}/${path}`,
      { signal: AbortSignal.timeout(30_000) },
    );
    if (!file.ok) throw new Error(`Telegram file answered ${file.status}`);
    return new Uint8Array(await file.arrayBuffer());
  }
}
