import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  email,
  form,
  FormField,
  FormRoot,
  maxLength,
  required,
} from '@angular/forms/signals';
import { type LeadIntent, leadLimits } from '@ah/shared/contracts';
import { type Audience, profile } from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { AhButton } from '@ah/ui';
import { LeadError, prewarm, sendLead } from './lead-client';
import { SiteConfigService } from './site-config';
import { TurnstileService, type TurnstileWidget } from './turnstile';

type Status =
  | 'loading'
  | 'ready'
  | 'unavailable'
  | 'sending'
  | 'waking'
  | 'sent'
  | 'failed'
  | 'rejected';

/** What a visitor most likely wants, from the audience they picked. */
const audienceIntents: Record<Audience, LeadIntent> = {
  recruiter: 'role',
  client: 'project',
  engineer: 'other',
};

const intentSubjects: Record<LeadIntent, string> = {
  role: 'Opportunity for Ahmed Hrichi',
  project: 'Project enquiry',
  other: 'Hello from your portfolio',
};

/**
 * The contact form (ADR-0010). It is prerendered, then wires Turnstile and the
 * API in the browser. Whenever the API can't be used, the same form hands the
 * message to the visitor's email app instead.
 */
@Component({
  selector: 'ah-contact-form',
  imports: [AhButton, FormField, FormRoot],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss',
})
export class ContactForm {
  private readonly preferences = inject(PreferencesStore);
  private readonly siteConfig = inject(SiteConfigService);
  private readonly turnstile = inject(TurnstileService);
  private readonly widgetHost =
    viewChild.required<ElementRef<HTMLElement>>('turnstile');

  protected readonly intents: { value: LeadIntent; label: string }[] = [
    { value: 'role', label: 'A full-time role' },
    { value: 'project', label: 'A project' },
    { value: 'other', label: 'Something else' },
  ];

  protected readonly model = signal({
    name: '',
    email: '',
    message: '',
    intent: 'project' as LeadIntent,
    website: '',
  });
  protected readonly form = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Please enter your name.' });
      maxLength(path.name, leadLimits.name, {
        message: `Please keep it under ${leadLimits.name} characters.`,
      });
      required(path.email, { message: 'Please enter your email address.' });
      email(path.email, { message: 'That email address doesn’t look right.' });
      maxLength(path.email, leadLimits.email);
      required(path.message, { message: 'Tell me a little about it.' });
      maxLength(path.message, leadLimits.message, {
        message: `Please keep it under ${leadLimits.message} characters.`,
      });
    },
    // formRoot runs this on submit, once every field is valid.
    { submission: { action: () => this.deliver() } },
  );

  protected readonly status = signal<Status>('loading');
  protected readonly token = signal<string | null>(null);
  protected readonly busy = computed(
    () => this.status() === 'sending' || this.status() === 'waking',
  );
  /** The same message as an email, for when the API can't be reached. */
  protected readonly mailtoFallback = computed(() => {
    const { name, email, message, intent } = this.model();
    const body = `${message}\n\n${name}${email ? ` <${email}>` : ''}`.slice(
      0,
      1800,
    );
    return `mailto:${profile.email}?subject=${encodeURIComponent(intentSubjects[intent])}&body=${encodeURIComponent(body)}`;
  });

  private apiUrl: string | null = null;
  private idempotencyKey = '';
  private widget?: TurnstileWidget;

  constructor() {
    afterNextRender(() => void this.connect());
    inject(DestroyRef).onDestroy(() => this.widget?.remove());
  }

  private async deliver(): Promise<undefined> {
    const token = this.token();
    if (!this.apiUrl || !token || this.busy()) {
      return undefined;
    }
    const { website, ...fields } = this.model();
    this.status.set('sending');
    try {
      await sendLead(
        this.apiUrl,
        {
          ...fields,
          audience: this.preferences.audience(),
          idempotencyKey: this.idempotencyKey,
          turnstileToken: token,
          ...(website ? { website } : {}),
        },
        { onRetry: () => this.status.set('waking') },
      );
      this.status.set('sent');
    } catch (error) {
      const rejected =
        error instanceof LeadError && error.reason === 'rejected';
      this.status.set(rejected ? 'rejected' : 'failed');
      // The token may be spent. The idempotency key stays, so a retry of a
      // lead the API did store returns it instead of storing it twice.
      this.widget?.reset();
    }
    return undefined;
  }

  protected startOver(): void {
    // Keeps name and email, and clears touched so the empty message isn't an error.
    this.form().reset({ ...this.model(), message: '' });
    this.idempotencyKey = crypto.randomUUID();
    this.widget?.reset();
    this.status.set('ready');
  }

  /** Browser only: config, a wake-up ping for the API and the Turnstile widget. */
  private async connect(): Promise<void> {
    this.idempotencyKey = crypto.randomUUID();
    const { apiUrl, turnstileSiteKey } = await this.siteConfig.load();
    // After the await, so the shell has restored the visitor's audience.
    const intent = audienceIntents[this.preferences.audience()];
    this.model.update((model) => ({ ...model, intent }));
    if (!apiUrl || !turnstileSiteKey) {
      this.status.set('unavailable');
      return;
    }
    this.apiUrl = apiUrl;
    prewarm(apiUrl);
    try {
      this.widget = await this.turnstile.render(
        this.widgetHost().nativeElement,
        turnstileSiteKey,
        (token) => this.token.set(token),
      );
      this.status.set('ready');
    } catch {
      this.status.set('unavailable');
    }
  }
}
