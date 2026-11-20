import type {
  Check,
  CheckResponse,
  Marked,
} from '@ah/products/system-design/domain';

export type ChoiceCheck = Extract<Check, { kind: 'choice' }>;
export type NumericCheck = Extract<Check, { kind: 'numeric' }>;
export type OrderCheck = Extract<Check, { kind: 'order' }>;

export interface CheckAnswerEvent extends Marked {
  checkId: string;
  response: CheckResponse;
}
