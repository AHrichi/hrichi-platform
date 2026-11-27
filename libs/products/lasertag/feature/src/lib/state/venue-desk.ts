import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiError } from '@ah/products/lasertag/data-access';
import {
  FIRST_VENUE_SLUG,
  type GuestCreated,
  type RecoveryIssued,
  type SessionView,
  type VenueView,
} from '@ah/products/lasertag/domain';
import { BarqSession, type Problem, problemOf } from './barq-session';

export type DeskState = 'loading' | 'signed-out' | 'not-staff' | 'ready';

/**
 * The venue counter: the venue, its open sessions and the one being worked
 * on, and every staff action. One per staff screen.
 */
@Injectable()
export class VenueDesk {
  private readonly session = inject(BarqSession);

  readonly slug = FIRST_VENUE_SLUG;
  readonly state = signal<DeskState>('loading');
  readonly venue = signal<VenueView | null>(null);
  readonly sessions = signal<readonly SessionView[]>([]);
  readonly currentId = signal<string | null>(null);
  readonly current = computed(
    () =>
      this.sessions().find((s) => s.session.id === this.currentId()) ??
      this.sessions()[0] ??
      null,
  );
  readonly busy = signal(false);
  readonly problem = signal<Problem | null>(null);

  readonly readyVests = computed(
    () =>
      this.venue()?.gear.filter(
        (g) => g.kind === 'vest' && g.status === 'ready',
      ).length ?? 0,
  );
  readonly allVests = computed(
    () => this.venue()?.gear.filter((g) => g.kind === 'vest').length ?? 0,
  );

  private async run<T>(action: () => Promise<T>): Promise<T | null> {
    this.busy.set(true);
    this.problem.set(null);
    try {
      return await action();
    } catch (error) {
      this.problem.set(problemOf(error));
      return null;
    } finally {
      this.busy.set(false);
    }
  }

  async load(): Promise<void> {
    if (!this.session.player()) {
      this.state.set('signed-out');
      return;
    }
    const api = await this.session.api();
    try {
      const [venue, sessions] = await Promise.all([
        api.venue(this.slug),
        api.openSessions(this.slug),
      ]);
      this.venue.set(venue);
      this.sessions.set(sessions);
      this.state.set('ready');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'FORBIDDEN') {
        this.state.set('not-staff');
      } else {
        this.problem.set(problemOf(error));
        this.state.set('not-staff');
      }
    }
  }

  async claimVenue(code: string): Promise<void> {
    const done = await this.run(async () =>
      (await this.session.api()).staffClaim(this.slug, code),
    );
    if (done) {
      await this.session.refresh();
      await this.load();
    }
  }

  private replace(view: SessionView): void {
    const others = this.sessions().filter(
      (s) => s.session.id !== view.session.id,
    );
    this.sessions.set(view.session.closedAt ? others : [view, ...others]);
    this.currentId.set(view.session.closedAt ? null : view.session.id);
  }

  async openSession(): Promise<void> {
    const mapId = this.venue()?.maps[0]?.id;
    if (!mapId) return;
    const view = await this.run(async () =>
      (await this.session.api()).openSession(this.slug, mapId),
    );
    if (view) this.replace(view);
  }

  async closeSession(id: string): Promise<void> {
    const view = await this.run(async () =>
      (await this.session.api()).closeSession(id),
    );
    if (view) this.replace(view);
  }

  /** Check a wearer in; true when it worked. */
  async checkIn(
    sessionId: string,
    who: { badge: string } | { guestId: string },
    gear: string,
  ): Promise<boolean> {
    const view = await this.run(async () =>
      (await this.session.api()).checkIn(sessionId, { ...who, gear }),
    );
    if (view) this.replace(view);
    return view !== null;
  }

  async release(checkInId: string): Promise<void> {
    const view = await this.run(async () =>
      (await this.session.api()).release(checkInId),
    );
    if (view) this.replace(view);
  }

  createGuest(nickname: string): Promise<GuestCreated | null> {
    return this.run(async () =>
      (await this.session.api()).createGuest(this.slug, nickname),
    );
  }

  issueRecovery(handle: string): Promise<RecoveryIssued | null> {
    return this.run(async () =>
      (await this.session.api()).issueRecovery(this.slug, handle),
    );
  }
}
