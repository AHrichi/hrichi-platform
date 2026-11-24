import { Injectable } from '@angular/core';
import { GreenhouseAuth } from '@ah/products/greenhouse/data-access';

/** The manager's (or HR's) Supabase session, kept apart from the field app's. */
@Injectable({ providedIn: 'root' })
export class DashboardAuth extends GreenhouseAuth {
  protected readonly storageKey = 'greenhouse-dashboard-auth';
}
