import { Injectable } from '@angular/core';
import { GreenhouseAuth } from '@ah/products/greenhouse/data-access';

/**
 * The supervisor's Supabase session. A phone signed in once stays signed
 * in offline (see `GreenhouseAuth`).
 */
@Injectable({ providedIn: 'root' })
export class FieldAuth extends GreenhouseAuth {
  protected readonly storageKey = 'greenhouse-field-auth';
}
