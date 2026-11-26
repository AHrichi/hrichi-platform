import { InjectionToken } from '@angular/core';
import type { AssistantLocale, AssistantProfile } from '@ah/shared/assistant';

/** What running a tool came to. */
export type ToolOutcome =
  | {
      readonly ok: true;
      /** What the model reads back (kept short: it goes with the next round). */
      readonly result: unknown;
      /** A line for the reader, e.g. "Sunlight mode is on." */
      readonly note?: string;
      /** Puts a setting back, offered next to the note. */
      readonly undo?: () => void | Promise<void>;
    }
  | { readonly ok: false; readonly error: string };

/** How the app runs one of its tools. */
export interface ToolExecutor<TArgs = never> {
  /**
   * For tools that change or delete data: what makes the call impossible
   * (a project that isn't there, a value out of range), checked before
   * the reader is asked, so they never approve a change that can't run.
   */
  check?(args: TArgs): string | null;
  /**
   * For tools that change or delete data: what the confirmation card says,
   * in the reader's language. Written by the app, never by the model, so
   * what the reader approves is what runs.
   */
  describe?(args: TArgs): { heading: string; lines?: readonly string[] };
  run(args: TArgs): ToolOutcome | Promise<ToolOutcome>;
}

/** An app's assistant: its profile (shared with the server) and its tools. */
export interface AssistantSetup {
  readonly profile: AssistantProfile;
  readonly locale: () => AssistantLocale;
  /** The app's state sent with each message (its profile's `context`). */
  readonly context: () => unknown;
  /** Tools the app leaves out here (e.g. site-wide settings in a demo). */
  readonly omitTools?: () => readonly string[];
  // Arguments arrive checked against the profile's schema for that tool.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly executors: Readonly<Record<string, ToolExecutor<any>>>;
  /** Where the conversation is kept for this tab (sessionStorage). */
  readonly storageKey?: string;
}

export const ASSISTANT_SETUP = new InjectionToken<AssistantSetup>(
  'ASSISTANT_SETUP',
);

/** What the conversation shows. */
export type AssistantEntry =
  | { readonly id: number; readonly kind: 'user'; readonly text: string }
  | {
      readonly id: number;
      readonly kind: 'assistant';
      readonly text: string;
    }
  | {
      readonly id: number;
      readonly kind: 'notice';
      readonly text: string;
      readonly tone: 'default' | 'error';
      /** An Undo is offered next to it (while this page lives). */
      readonly undoable?: boolean;
    }
  | {
      readonly id: number;
      readonly kind: 'action';
      readonly heading: string;
      readonly lines: readonly string[];
      readonly tone: 'default' | 'danger';
      readonly status: 'pending' | 'applied' | 'cancelled' | 'failed';
      readonly detail?: string;
    };
