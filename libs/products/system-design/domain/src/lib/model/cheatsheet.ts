import type { ModuleId } from './course';

export type CheatSection =
  | {
      kind: 'numbers';
      title: string;
      /** label, value, optional note */
      rows: readonly (readonly [string, string, string?])[];
    }
  | {
      kind: 'table';
      title: string;
      columns: readonly string[];
      rows: readonly (readonly string[])[];
    }
  | { kind: 'list'; title: string; items: readonly string[] }
  | {
      kind: 'pattern';
      title: string;
      when: string;
      how: string;
      watch: string;
      /** The lesson id that teaches it. */
      lesson?: string;
    };

export interface Cheatsheet {
  module: ModuleId;
  intro: string;
  sections: readonly CheatSection[];
}
