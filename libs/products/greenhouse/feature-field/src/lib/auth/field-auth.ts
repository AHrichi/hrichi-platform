import { Injectable } from '@angular/core';
import {
  type GreenhouseAccount,
  GreenhouseAuth,
} from '@ah/products/greenhouse/data-access';

export type FieldAccount = GreenhouseAccount;

/**
 * The supervisor's Supabase session. A phone signed in once stays signed
 * in offline (see `GreenhouseAuth`).
 */
@Injectable({ providedIn: 'root' })
export class FieldAuth extends GreenhouseAuth {
  protected readonly storageKey = 'greenhouse-field-auth';
}
