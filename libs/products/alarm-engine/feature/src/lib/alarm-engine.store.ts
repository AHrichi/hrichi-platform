import {
  computed,
  effect,
  inject,
  Injectable,
  OnDestroy,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  addDays,
  applyQuestionnaireToChapters,
  calculateSpacedRepetitionDates,
  Chapter,
  CollapsedSectionsState,
  computeNightlyDecision,
  computeSevenDayOutlook,
  createDefaultQuestionnaire,
  createDemoChapters,
  createOneWeekWalkthroughChapters,
  createStarterAppState,
  DayReviewForecast,
  DayTypeSelection,
  DEFAULT_N8N_WEBHOOK_URL,
  DEFAULT_TOPICS,
  DocParseResult,
  downloadN8nWorkflowFile,
  DueReviewItem,
  exportBackup,
  extractUniversalTextFromBuffer,
  generateAlarmIcs,
  getDueReviewsAsOfDate,
  importBackup,
  loadAppState,
  MissedGoalReason,
  NightlyAppState,
  NightlyDecisionResult,
  NightlySystemState,
  parseChapterOutline,
  parseDocumentText,
  QuestionnaireInput,
  RecallPracticePrompt,
  saveAppState,
  TodayCompletionStatus,
  todayYmd,
  Topic,
} from '@ah/products/alarm-engine/domain';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';
import { APP_MODE } from '@ah/platform/app-mode';
import {
  ALARM_DICTIONARIES,
  AlarmEngineDictionary,
  AlarmLanguage,
  enDictionary,
} from './i18n';

@Injectable()
export class AlarmEngineStore implements OnDestroy {
  private readonly document = inject(DOCUMENT, { optional: true });
  private readonly appMode = inject(APP_MODE, { optional: true });
  readonly preferences = inject(PreferencesStore, { optional: true });

  readonly isEmbedded = computed<boolean>(() => {
    if (this.appMode === 'embedded-demo') {
      return true;
    }
    if (
      typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/apps/alarm') ||
        window.location.pathname.startsWith('/apps/nightly-alarm'))
    ) {
      return true;
    }
    return false;
  });

  // Core state signals
  readonly chapters = signal<Chapter[]>([]);
  readonly systemState = signal<NightlySystemState>({
    lastConsolidationAtChapter: 0,
    checklistState: new Array(9).fill(false),
    selectedTopicId: 'all',
    topics: DEFAULT_TOPICS,
  });
  readonly questionnaire = signal<QuestionnaireInput>(
    createDefaultQuestionnaire(),
  );

  // UI state signals
  readonly activeTab = signal<'decision' | 'tracker' | 'guide' | 'reference'>(
    'decision',
  );
  readonly copiedMessage = signal<string | null>(null);
  readonly copiedSlotTime = signal<string | null>(null);
  readonly isBackupModalOpen = signal<boolean>(false);
  readonly isChapterModalOpen = signal<boolean>(false);
  readonly isNewTopicModalOpen = signal<boolean>(false);
  readonly editingTopic = signal<Topic | null>(null);
  readonly editingChapter = signal<Chapter | null>(null);
  readonly activeRecallPrompt = signal<RecallPracticePrompt | null>(null);
  readonly trackerFilter = signal<'all' | 'weak' | 'due' | 'carryover'>('all');

  // n8n Webhook & Document Parsing State
  readonly n8nWebhookUrl = signal<string>(
    this.systemState().n8nWebhookUrl || DEFAULT_N8N_WEBHOOK_URL,
  );
  readonly isParsingDoc = signal<boolean>(false);
  readonly docParseError = signal<string | null>(null);

  // Collapsible sections computed
  readonly collapsedSections = computed<CollapsedSectionsState>(() => {
    return this.systemState().collapsedSections || {};
  });

  // Push / Alarm Notifications state
  readonly notificationPermission = signal<
    NotificationPermission | 'unsupported'
  >('default');
  readonly notificationsEnabled = computed<boolean>(
    () => !!this.systemState().notificationsEnabled,
  );
  private lastAlertMinute = '';
  private notificationIntervalId: ReturnType<typeof setInterval> | null = null;

  // Fallback language & theme signals (if preferencesStore is not in test context)
  readonly localLanguage = signal<AlarmLanguage>('en');
  readonly localTheme = signal<'dark' | 'light'>('dark');

  // Active language & dictionary
  readonly activeLanguage = computed<AlarmLanguage>(() => {
    if (this.isEmbedded() && this.preferences) {
      return (this.preferences.language() as AlarmLanguage) || 'en';
    }
    return this.localLanguage();
  });

  readonly isRtl = computed<boolean>(() => {
    return this.activeLanguage() === 'ar';
  });

  readonly isDark = computed<boolean>(() => {
    if (this.isEmbedded() && this.preferences) {
      return this.preferences.isDark();
    }
    return this.localTheme() === 'dark';
  });

  readonly dict = computed<AlarmEngineDictionary>(() => {
    const lang = this.activeLanguage();
    return ALARM_DICTIONARIES[lang] || enDictionary;
  });

  // Topics computed
  readonly topics = computed<Topic[]>(() => {
    const customTopics = this.systemState().topics;
    return customTopics && customTopics.length > 0
      ? customTopics
      : DEFAULT_TOPICS;
  });

  readonly selectedTopicId = computed<string>(() => {
    return this.systemState().selectedTopicId || 'all';
  });

  readonly selectedTopic = computed<Topic | undefined>(() => {
    const id = this.selectedTopicId();
    if (id === 'all') return undefined;
    return this.topics().find((t) => t.id === id);
  });

  // Computed state
  readonly highestCompletedChapter = computed(() => {
    return this.chapters().reduce(
      (max, c) => (c.originalStudyDate ? Math.max(max, c.chapterNumber) : max),
      0,
    );
  });

  readonly dueReviewsTonight = computed<DueReviewItem[]>(() => {
    return getDueReviewsAsOfDate(
      this.chapters(),
      this.questionnaire().tonightDate,
    );
  });

  readonly decision = computed<NightlyDecisionResult>(() => {
    return computeNightlyDecision(
      this.chapters(),
      this.systemState(),
      this.questionnaire(),
    );
  });

  readonly weakChapters = computed(() => {
    return this.chapters().filter((c) => c.isWeak);
  });

  readonly carryoverChapters = computed(() => {
    return this.chapters().filter((c) => c.codingCarryover);
  });

  readonly chaptersUntilMilestone = computed(() => {
    const highest = this.highestCompletedChapter();
    const lastConsolidation = this.systemState().lastConsolidationAtChapter;
    const completedSince = Math.max(0, highest - lastConsolidation);
    const remaining = 6 - (completedSince % 6);
    return remaining === 6 && completedSince > 0 ? 0 : remaining;
  });

  // Checklist computation: reads checklistState from systemState
  readonly checklist = computed(() => {
    return this.systemState().checklistState;
  });

  readonly checklistCompletedCount = computed(() => {
    return this.checklist().filter(Boolean).length;
  });

  readonly checklistProgressPercent = computed(() => {
    return Math.round((this.checklistCompletedCount() / 9) * 100);
  });

  readonly filteredChapters = computed(() => {
    let list = this.chapters();
    const topicId = this.selectedTopicId();

    // Filter by topic if not 'all'
    if (topicId !== 'all') {
      list = list.filter((c) => c.topicId === topicId);
    }

    const filter = this.trackerFilter();
    const tonight = this.questionnaire().tonightDate;

    switch (filter) {
      case 'weak':
        return list.filter((c) => c.isWeak);
      case 'carryover':
        return list.filter((c) => c.codingCarryover);
      case 'due':
        return list.filter(
          (c) =>
            (!c.d3Completed && c.d3Date <= tonight) ||
            (!c.d7Completed && c.d7Date <= tonight) ||
            (!c.d14Completed && c.d14Date <= tonight),
        );
      case 'all':
      default:
        return list;
    }
  });

  readonly nextUpcomingAlarm = computed<{
    time: string;
    title: string;
    remainingText: string;
  } | null>(() => {
    const alarms = this.decision().alarms;
    if (!alarms || alarms.length === 0) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const alarm of alarms) {
      const parts = alarm.time.split(':');
      if (parts.length === 2) {
        const alarmMinutes =
          parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        if (alarmMinutes > currentMinutes) {
          const diffMinutes = alarmMinutes - currentMinutes;
          const h = Math.floor(diffMinutes / 60);
          const m = diffMinutes % 60;
          const remainingText = h > 0 ? `${h}h ${m}m` : `${m}m`;
          return { time: alarm.time, title: alarm.title, remainingText };
        }
      }
    }

    const first = alarms[0];
    return {
      time: first.time,
      title: first.title,
      remainingText: `Tomorrow ${first.time}`,
    };
  });

  readonly sevenDayOutlook = computed<DayReviewForecast[]>(() => {
    return computeSevenDayOutlook(
      this.chapters(),
      this.questionnaire().tonightDate,
      this.systemState().lastConsolidationAtChapter,
    );
  });

  readonly highCollisionDaysCount = computed<number>(() => {
    return this.sevenDayOutlook().filter((d) => d.hasHighLoad).length;
  });

  readonly topicSyllabusStats = computed(() => {
    const selectedId = this.selectedTopicId();
    const allCh = this.chapters();
    const filtered =
      selectedId === 'all'
        ? allCh
        : allCh.filter((c) => c.topicId === selectedId);
    const total = filtered.length;
    const completed = filtered.filter((c) => !!c.originalStudyDate).length;
    const weak = filtered.filter((c) => c.isWeak).length;
    const due = filtered.filter(
      (c) =>
        (!c.d3Completed && !!c.d3Date) ||
        (!c.d7Completed && !!c.d7Date) ||
        (!c.d14Completed && !!c.d14Date),
    ).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, weak, due, percent };
  });

  constructor() {
    this.initFromStorage();
    this.initNotifications();

    // Persist on change
    effect(() => {
      const state: NightlyAppState = {
        chapters: this.chapters(),
        systemState: this.systemState(),
        questionnaire: this.questionnaire(),
        lastDecision: this.decision(),
      };
      saveAppState(state);
    });
  }

  ngOnDestroy(): void {
    this.stopAlarmTicker();
  }

  // Collapsible section methods
  isSectionCollapsed(key: keyof CollapsedSectionsState): boolean {
    return !!this.collapsedSections()[key];
  }

  toggleSection(key: keyof CollapsedSectionsState): void {
    this.systemState.update((s) => {
      const current = s.collapsedSections || {};
      return {
        ...s,
        collapsedSections: {
          ...current,
          [key]: !current[key],
        },
      };
    });
  }

  // Push / Alarm Notifications methods
  private initNotifications(): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.notificationPermission.set('unsupported');
      return;
    }
    this.notificationPermission.set(Notification.permission);
    if (
      this.systemState().notificationsEnabled &&
      Notification.permission === 'granted'
    ) {
      this.startAlarmTicker();
    }
  }

  private startAlarmTicker(): void {
    if (this.notificationIntervalId !== null || typeof window === 'undefined')
      return;
    this.notificationIntervalId = setInterval(() => {
      this.checkScheduledAlarmNow();
    }, 30000);
    this.checkScheduledAlarmNow();
  }

  private stopAlarmTicker(): void {
    if (this.notificationIntervalId !== null && typeof window !== 'undefined') {
      clearInterval(this.notificationIntervalId);
      this.notificationIntervalId = null;
    }
  }

  private checkScheduledAlarmNow(): void {
    if (
      !this.notificationsEnabled() ||
      this.notificationPermission() !== 'granted'
    )
      return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentHhMm = `${hours}:${minutes}`;

    const dateYmd = todayYmd();
    const alertKey = `${dateYmd}_${currentHhMm}`;
    if (this.lastAlertMinute === alertKey) return;

    const matchingSlot = this.decision().alarms.find(
      (a) => a.time === currentHhMm,
    );
    if (matchingSlot) {
      this.lastAlertMinute = alertKey;
      this.sendNotification(
        `⏰ ${matchingSlot.time} Alarm: ${matchingSlot.title}`,
        matchingSlot.description,
        matchingSlot.time,
      );
    }
  }

  private sendNotification(title: string, body: string, tag?: string): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      this.playGentleChime();
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate([200, 100, 200]);
      }

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: tag || 'alarm-notification',
            });
          })
          .catch(() => {
            new Notification(title, { body, icon: '/favicon.ico' });
          });
      } else {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    } catch (err) {
      console.warn('Notification failed:', err);
    }
  }

  private playGentleChime(): void {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.8);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.8);
    } catch {
      // Audio playback restriction without gesture
    }
  }

  async toggleNotifications(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.showToast(this.dict().notifications.statusUnsupported);
      return;
    }

    if (this.notificationsEnabled()) {
      this.systemState.update((s) => ({ ...s, notificationsEnabled: false }));
      this.stopAlarmTicker();
      this.showToast(this.dict().notifications.disabledNotice);
      return;
    }

    if (Notification.permission === 'granted') {
      this.notificationPermission.set('granted');
      this.systemState.update((s) => ({ ...s, notificationsEnabled: true }));
      this.startAlarmTicker();
      this.showToast(this.dict().notifications.enabledNotice);
      return;
    }

    if (Notification.permission === 'denied') {
      this.notificationPermission.set('denied');
      this.showToast(this.dict().notifications.permissionDeniedNotice);
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      this.notificationPermission.set(perm);
      if (perm === 'granted') {
        this.systemState.update((s) => ({ ...s, notificationsEnabled: true }));
        this.startAlarmTicker();
        this.showToast(this.dict().notifications.enabledNotice);
        this.sendNotification(
          this.dict().notifications.testNotificationTitle,
          this.dict().notifications.testNotificationBody,
          'welcome-notification',
        );
      } else {
        this.showToast(this.dict().notifications.permissionDeniedNotice);
      }
    } catch {
      this.showToast(this.dict().notifications.permissionDeniedNotice);
    }
  }

  triggerTestNotification(): void {
    if (this.notificationPermission() !== 'granted') {
      this.toggleNotifications();
      return;
    }
    this.sendNotification(
      this.dict().notifications.testNotificationTitle,
      this.dict().notifications.testNotificationBody,
      'test-notification',
    );
    this.showToast(this.dict().notifications.testNotificationBody);
  }

  private initFromStorage(): void {
    const loaded = loadAppState();
    this.chapters.set(loaded.chapters);
    this.systemState.set(loaded.systemState);

    const today = todayYmd();
    const highest = loaded.chapters.reduce(
      (max, c) => (c.originalStudyDate ? Math.max(max, c.chapterNumber) : max),
      0,
    );

    this.questionnaire.set({
      ...loaded.questionnaire,
      tonightDate: today,
      targetChapterNumber: highest > 0 ? highest + 1 : 1,
      targetChapterTitle: loaded.questionnaire?.targetChapterTitle || '',
      topicId: loaded.questionnaire?.topicId || 'general',
      topicName: loaded.questionnaire?.topicName || 'General',
      completedReviewsTonight: [],
    });
  }

  private markChecklistStep(stepIndex: number, done = true): void {
    this.systemState.update((s) => {
      const next = [...s.checklistState];
      next[stepIndex] = done;
      return { ...s, checklistState: next };
    });
  }

  // Topic mutations
  setSelectedTopicId(topicId: string): void {
    this.systemState.update((s) => ({
      ...s,
      selectedTopicId: topicId,
    }));
    const found = this.topics().find((t) => t.id === topicId);
    if (found && topicId !== 'all') {
      this.questionnaire.update((q) => ({
        ...q,
        topicId: found.id,
        topicName: found.name,
      }));
    }
  }

  openCreateTopicModal(): void {
    this.editingTopic.set(null);
    this.isNewTopicModalOpen.set(true);
  }

  openEditTopicModal(topicId: string): void {
    const found = this.topics().find((t) => t.id === topicId);
    if (found) {
      this.editingTopic.set(found);
      this.isNewTopicModalOpen.set(true);
    }
  }

  addTopic(name: string, color = '#6366f1'): void {
    this.saveTopicAndSyllabus({ name, color });
  }

  saveTopicAndSyllabus(input: {
    id?: string;
    name: string;
    description?: string;
    color?: string;
    rawSyllabus?: string;
    importMode?: 'queue' | 'backfill';
  }): void {
    const trimmed = input.name.trim();
    if (!trimmed) return;
    const id = input.id || trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const color = input.color || '#6366f1';
    const description = input.description ? input.description.trim() : '';

    const newTopic: Topic = {
      id,
      name: trimmed,
      description,
      color,
    };

    this.systemState.update((s) => {
      const current = s.topics || DEFAULT_TOPICS;
      const exists = current.some((t) => t.id === id);
      const nextTopics = exists
        ? current.map((t) => (t.id === id ? newTopic : t))
        : [...current, newTopic];
      return { ...s, topics: nextTopics };
    });

    let importedCount = 0;
    if (input.rawSyllabus && input.rawSyllabus.trim()) {
      const existingInTopic = this.chapters().filter((c) => c.topicId === id);
      const highestNum = existingInTopic.reduce(
        (max, c) => Math.max(max, c.chapterNumber),
        0,
      );
      const parsed = parseChapterOutline(input.rawSyllabus, highestNum + 1);

      if (parsed.length > 0) {
        const tonight = this.questionnaire().tonightDate || todayYmd();
        const isBackfill = input.importMode === 'backfill';

        const newChapters: Chapter[] = parsed.map((item, index) => {
          const studyDate = isBackfill
            ? addDays(tonight, -Math.max(1, (parsed.length - index) * 2))
            : '';
          const dates = studyDate
            ? calculateSpacedRepetitionDates(studyDate)
            : { d3Date: '', d7Date: '', d14Date: '' };

          return {
            chapterNumber: item.chapterNumber,
            title: item.title,
            topicId: id,
            topicName: trimmed,
            originalStudyDate: studyDate,
            d3Date: dates.d3Date,
            d7Date: dates.d7Date,
            d14Date: dates.d14Date,
            d3Completed: isBackfill,
            d7Completed: isBackfill,
            d14Completed: isBackfill,
            quizScorePercent: isBackfill ? 85 : 0,
            quizQuestionsMissed: 0,
            isWeak: false,
            codingCarryover: false,
            errorNotes: '',
          };
        });

        const existingNums = new Set(
          existingInTopic.map((c) => c.chapterNumber),
        );
        const uniqueToAdd = newChapters.filter(
          (c) => !existingNums.has(c.chapterNumber),
        );

        this.chapters.update((prev) => [...prev, ...uniqueToAdd]);
        importedCount = uniqueToAdd.length;
      }
    }

    this.setSelectedTopicId(id);
    this.isNewTopicModalOpen.set(false);
    this.editingTopic.set(null);

    const msg =
      importedCount > 0
        ? `Topic "${trimmed}" saved with ${importedCount} syllabus chapters!`
        : `Topic "${trimmed}" saved.`;
    this.showToast(msg);
  }

  setN8nWebhookUrl(url: string): void {
    const trimmed = (url || '').trim() || DEFAULT_N8N_WEBHOOK_URL;
    this.n8nWebhookUrl.set(trimmed);
    this.systemState.update((s) => ({ ...s, n8nWebhookUrl: trimmed }));
  }

  downloadN8nWorkflow(): void {
    downloadN8nWorkflowFile();
    this.showToast(
      'Downloaded chapter-doc-parser.n8n.json! Import into n8n via Workflows -> Import.',
    );
  }

  async parseDocumentFile(
    file: File,
    userPrompt?: string,
  ): Promise<DocParseResult> {
    this.isParsingDoc.set(true);
    this.docParseError.set(null);

    try {
      const webhook = this.n8nWebhookUrl();

      // 1. Try n8n webhook first
      try {
        const formData = new FormData();
        formData.append('file', file, file.name);
        formData.append('fileName', file.name);
        if (userPrompt && userPrompt.trim()) {
          formData.append('userPrompt', userPrompt.trim());
        }

        // Pre-extract text using native browser APIs so n8n always has clean text
        try {
          const preExtracted = await this.readLocalFileAsText(file);
          if (preExtracted && preExtracted.trim().length > 0) {
            formData.append('rawText', preExtracted);
          }
        } catch {
          // Ignore pre-extraction error, let n8n process binary
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(webhook, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const payload = Array.isArray(data) ? data[0] : data;
          if (payload && payload.success && payload.outlineText) {
            const aiLabel = payload.aiUsed ? ' (AI Powered 🤖)' : '';
            this.showToast(
              `${this.dict().topicModal.parseSuccessNotice} (${payload.totalChapters} chapters${aiLabel})`,
            );
            return payload as DocParseResult;
          } else if (payload && payload.error) {
            this.docParseError.set(payload.error);
          }
        } else {
          let errMsg = `n8n error (${response.status}: ${response.statusText})`;
          try {
            const errData = await response.json();
            if (errData?.message) errMsg = errData.message;
            else if (errData?.errorMessage) errMsg = errData.errorMessage;
          } catch (_parseErr) {
            // Non-JSON error body fallback
          }
          console.warn('n8n error response:', errMsg);
          this.docParseError.set(errMsg);
        }
      } catch (webhookErr) {
        const msg =
          webhookErr instanceof Error
            ? webhookErr.message
            : 'n8n connection failed';
        console.warn('n8n connection warning:', msg);
        // Do not block fallback on connection error
      }

      // 2. Client-side fallback extraction
      try {
        const text = await this.readLocalFileAsText(file);
        const parsed = parseDocumentText(text, file.name, userPrompt);
        if (parsed.success) {
          this.docParseError.set(null);
          this.showToast(
            `Parsed ${parsed.totalChapters} chapters from document (direct extraction)!`,
          );
          return parsed;
        } else {
          const finalError =
            this.docParseError() || this.dict().topicModal.parseErrorNotice;
          this.docParseError.set(finalError);
          this.showToast(`⚠️ ${finalError}`);
          return {
            ...parsed,
            error: finalError,
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to read file';
        this.docParseError.set(msg);
        this.showToast(`⚠️ ${msg}`);
        return {
          success: false,
          totalChapters: 0,
          outlineText: '',
          error: msg,
        };
      }
    } finally {
      this.isParsingDoc.set(false);
    }
  }

  private async readLocalFileAsText(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const extracted = await extractUniversalTextFromBuffer(buffer, file.name);
      if (extracted && extracted.trim().length > 0) {
        return extracted;
      }
    } catch {
      // Fallback to text reader below
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }

  downloadIcsSchedule(): void {
    const decision = this.decision();
    const tonight = this.questionnaire().tonightDate;
    const tomorrow = decision.tomorrowDate || addDays(tonight, 1);
    const icsContent = generateAlarmIcs(
      tomorrow,
      decision.alarms,
      'Nightly Alarm Schedule',
    );

    if (typeof window !== 'undefined') {
      const blob = new Blob([icsContent], {
        type: 'text/calendar;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alarm-schedule-${tomorrow}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showToast(`Downloaded alarm-schedule-${tomorrow}.ics`);
    }
  }

  openRecallModal(
    chapterNumber: number,
    reviewType: 'D-3' | 'D-7' | 'D-14',
  ): void {
    const ch = this.chapters().find((c) => c.chapterNumber === chapterNumber);
    if (!ch) return;

    const topic = this.topics().find((t) => t.id === ch.topicId);
    const dict = this.dict();

    let retrievalPrompt = '';
    if (reviewType === 'D-3') {
      retrievalPrompt = dict.recallModal.d3PromptText;
    } else if (reviewType === 'D-7') {
      retrievalPrompt = dict.recallModal.d7PromptText;
    } else {
      retrievalPrompt = dict.recallModal.d14PromptText;
    }

    this.activeRecallPrompt.set({
      chapterNumber: ch.chapterNumber,
      chapterTitle: ch.title,
      topicName: ch.topicName || topic?.name || 'General',
      topicDescription: topic?.description,
      reviewType,
      previousQuizScore: ch.quizScorePercent,
      isWeak: ch.isWeak,
      errorNotes: ch.errorNotes,
      retrievalPrompt,
    });
  }

  closeRecallModal(): void {
    this.activeRecallPrompt.set(null);
  }

  completeRecallReview(mastered: boolean): void {
    const prompt = this.activeRecallPrompt();
    if (!prompt) return;

    this.toggleChapterReview(prompt.chapterNumber, prompt.reviewType);

    if (mastered) {
      this.chapters.update((chapters) =>
        chapters.map((c) =>
          c.chapterNumber === prompt.chapterNumber
            ? { ...c, isWeak: false }
            : c,
        ),
      );
      this.showToast(`Ch. ${prompt.chapterNumber} marked Mastered ✓`);
    } else {
      this.chapters.update((chapters) =>
        chapters.map((c) =>
          c.chapterNumber === prompt.chapterNumber ? { ...c, isWeak: true } : c,
        ),
      );
      this.showToast(
        `Ch. ${prompt.chapterNumber} retained for Consolidation reinforcement ⚠️`,
      );
    }

    this.closeRecallModal();
  }

  // Language & Theme methods
  setLanguage(lang: AlarmLanguage): void {
    if (this.isEmbedded() && this.preferences) {
      this.preferences.setLanguage(lang as SiteLanguage);
      return;
    }
    this.localLanguage.set(lang);
    if (this.preferences) {
      this.preferences.setLanguage(lang as SiteLanguage);
    }
    if (this.document) {
      this.document.documentElement.setAttribute('lang', lang);
      this.document.documentElement.setAttribute(
        'dir',
        lang === 'ar' ? 'rtl' : 'ltr',
      );
    }
  }

  toggleTheme(): void {
    if (this.isEmbedded() && this.preferences) {
      this.preferences.toggleTheme();
      return;
    }
    const next = this.localTheme() === 'dark' ? 'light' : 'dark';
    this.localTheme.set(next);
    if (this.preferences) {
      this.preferences.toggleTheme();
    }
    if (this.document) {
      this.document.documentElement.setAttribute('data-theme', next);
    }
  }

  // Questionnaire mutations with auto-checking of corresponding checklist steps
  setTonightDate(date: string): void {
    this.questionnaire.update((q) => ({ ...q, tonightDate: date }));
    this.markChecklistStep(0);
  }

  setTargetChapter(num: number): void {
    this.questionnaire.update((q) => ({ ...q, targetChapterNumber: num }));
    this.markChecklistStep(0);
  }

  setTargetChapterTitle(title: string): void {
    this.questionnaire.update((q) => ({ ...q, targetChapterTitle: title }));
  }

  setQuestionnaireTopic(topicId: string): void {
    const found = this.topics().find((t) => t.id === topicId);
    this.questionnaire.update((q) => ({
      ...q,
      topicId,
      topicName: found?.name || 'General',
    }));
  }

  setCompletionStatus(status: TodayCompletionStatus): void {
    this.questionnaire.update((q) => ({ ...q, completionStatus: status }));
    this.markChecklistStep(0);
    this.markChecklistStep(6);
    this.markChecklistStep(7);
  }

  setMissedReason(reason: MissedGoalReason): void {
    this.questionnaire.update((q) => ({ ...q, missedReason: reason }));
    this.markChecklistStep(5);
  }

  setQuizMissed(missed: number): void {
    const safe = Math.max(0, missed);
    this.questionnaire.update((q) => ({ ...q, quizQuestionsMissed: safe }));
    this.markChecklistStep(1);
  }

  setQuizScore(score: number): void {
    const safe = Math.min(100, Math.max(0, score));
    this.questionnaire.update((q) => ({ ...q, quizScorePercent: safe }));
    this.markChecklistStep(1);
  }

  setCodingProgress(coding: 'CLEAN' | 'CARRYOVER'): void {
    this.questionnaire.update((q) => ({ ...q, codingProgress: coding }));
  }

  setErrorNotes(notes: string): void {
    this.questionnaire.update((q) => ({ ...q, errorNotes: notes }));
  }

  setDayTypeSelection(dayType: DayTypeSelection): void {
    this.questionnaire.update((q) => ({ ...q, dayTypeSelection: dayType }));
    this.markChecklistStep(5);
  }

  toggleDueReviewChecked(reviewKey: string): void {
    this.questionnaire.update((q) => {
      const set = new Set(q.completedReviewsTonight);
      if (set.has(reviewKey)) {
        set.delete(reviewKey);
      } else {
        set.add(reviewKey);
      }
      return { ...q, completedReviewsTonight: Array.from(set) };
    });

    if (reviewKey.includes('_D3')) this.markChecklistStep(2);
    if (reviewKey.includes('_D7')) this.markChecklistStep(3);
    if (reviewKey.includes('_D14')) this.markChecklistStep(4);
  }

  acknowledgeReviewSection(type: 'D-3' | 'D-7' | 'D-14'): void {
    if (type === 'D-3') this.markChecklistStep(2);
    if (type === 'D-7') this.markChecklistStep(3);
    if (type === 'D-14') this.markChecklistStep(4);
  }

  // Checklist mutations
  toggleChecklistStep(index: number): void {
    this.systemState.update((s) => {
      const next = [...s.checklistState];
      next[index] = !next[index];
      return { ...s, checklistState: next };
    });
  }

  resetChecklist(): void {
    this.systemState.update((s) => ({
      ...s,
      checklistState: new Array(9).fill(false),
    }));
    this.showToast(this.dict().checklist.resetTooltip);
  }

  // Commit ritual to permanent database
  commitNightlyRitual(): void {
    const q = this.questionnaire();
    const current = this.chapters();

    const { updatedChapters, lastConsolidationAtChapter } =
      applyQuestionnaireToChapters(current, q);

    this.chapters.set(updatedChapters);

    if (q.completionStatus === 'CONSOLIDATION_COMPLETED_TODAY') {
      this.systemState.update((s) => ({
        ...s,
        lastConsolidationAtChapter,
      }));
    }

    // Auto-mark steps 1 to 8 as complete upon saving
    this.systemState.update((s) => {
      const next = [...s.checklistState];
      for (let i = 0; i < 8; i++) next[i] = true;
      return { ...s, checklistState: next };
    });

    // Advance questionnaire target for next night
    const nextTarget =
      q.completionStatus === 'YES'
        ? q.targetChapterNumber + 1
        : q.completionStatus === 'NO' || q.completionStatus === 'MISSED_GOALS'
          ? q.targetChapterNumber
          : updatedChapters.reduce((m, c) => Math.max(m, c.chapterNumber), 0) +
            1;

    this.questionnaire.set({
      tonightDate: q.tonightDate,
      targetChapterNumber: nextTarget,
      targetChapterTitle: '',
      topicId: q.topicId,
      topicName: q.topicName,
      completionStatus: 'YES',
      missedReason: 'OFF_TRACK',
      quizQuestionsMissed: 0,
      quizScorePercent: 100,
      codingProgress: 'CLEAN',
      completedReviewsTonight: [],
      errorNotes: '',
      dayTypeSelection: 'Auto-Detect',
    });

    this.showToast(this.dict().actions.saveAndCommit + ' ✓');
  }

  // Direct Study Tracker mutations
  toggleChapterReview(
    chapterNumber: number,
    type: 'D-3' | 'D-7' | 'D-14',
  ): void {
    this.chapters.update((list) =>
      list.map((ch) => {
        if (ch.chapterNumber !== chapterNumber) return ch;
        if (type === 'D-3') return { ...ch, d3Completed: !ch.d3Completed };
        if (type === 'D-7') return { ...ch, d7Completed: !ch.d7Completed };
        if (type === 'D-14') return { ...ch, d14Completed: !ch.d14Completed };
        return ch;
      }),
    );
  }

  toggleChapterWeak(chapterNumber: number): void {
    this.chapters.update((list) =>
      list.map((ch) =>
        ch.chapterNumber === chapterNumber ? { ...ch, isWeak: !ch.isWeak } : ch,
      ),
    );
  }

  toggleChapterCarryover(chapterNumber: number): void {
    this.chapters.update((list) =>
      list.map((ch) =>
        ch.chapterNumber === chapterNumber
          ? { ...ch, codingCarryover: !ch.codingCarryover }
          : ch,
      ),
    );
  }

  openEditChapterModal(chapter: Chapter): void {
    this.editingChapter.set({ ...chapter });
    this.isChapterModalOpen.set(true);
  }

  openAddChapterModal(): void {
    const nextNum =
      this.chapters().reduce((max, c) => Math.max(max, c.chapterNumber), 0) + 1;
    const today = todayYmd();
    const dates = calculateSpacedRepetitionDates(today);
    const activeTopic = this.selectedTopic();

    this.editingChapter.set({
      chapterNumber: nextNum,
      title: `Chapter ${nextNum}`,
      topicId: activeTopic?.id || 'general',
      topicName: activeTopic?.name || 'General',
      originalStudyDate: today,
      ...dates,
      d3Completed: false,
      d7Completed: false,
      d14Completed: false,
      quizScorePercent: 85,
      quizQuestionsMissed: 1,
      isWeak: false,
      codingCarryover: false,
      errorNotes: '',
    });
    this.isChapterModalOpen.set(true);
  }

  /**
   * Auto-fills D-3, D-7, and D-14 dates whenever the original study date is changed.
   */
  onModalStudyDateChanged(newDate: string): void {
    if (!newDate) return;
    const dates = calculateSpacedRepetitionDates(newDate);
    this.editingChapter.update((ch) => {
      if (!ch) return null;
      return {
        ...ch,
        originalStudyDate: newDate,
        d3Date: dates.d3Date,
        d7Date: dates.d7Date,
        d14Date: dates.d14Date,
      };
    });
  }

  saveChapterModal(chapter: Chapter): void {
    // Ensure D-3, D-7, D-14 are strictly synchronized with originalStudyDate
    const dates = calculateSpacedRepetitionDates(chapter.originalStudyDate);
    const finalized: Chapter = {
      ...chapter,
      d3Date: dates.d3Date,
      d7Date: dates.d7Date,
      d14Date: dates.d14Date,
      isWeak: chapter.quizQuestionsMissed >= 3 || chapter.quizScorePercent < 75,
    };

    this.chapters.update((list) => {
      const idx = list.findIndex(
        (c) => c.chapterNumber === finalized.chapterNumber,
      );
      if (idx >= 0) {
        const next = [...list];
        next[idx] = { ...finalized };
        return next;
      }
      return [...list, { ...finalized }].sort(
        (a, b) => a.chapterNumber - b.chapterNumber,
      );
    });
    this.isChapterModalOpen.set(false);
    this.editingChapter.set(null);
    this.showToast(`Chapter ${finalized.chapterNumber} saved.`);
  }

  deleteChapter(chapterNumber: number): void {
    this.chapters.update((list) =>
      list.filter((c) => c.chapterNumber !== chapterNumber),
    );
    this.showToast(`Chapter ${chapterNumber} deleted.`);
  }

  // Backup & Restore
  exportJson(): void {
    const state: NightlyAppState = {
      chapters: this.chapters(),
      systemState: this.systemState(),
      questionnaire: this.questionnaire(),
      lastDecision: this.decision(),
    };
    const json = exportBackup(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nightly-alarms-backup-${todayYmd()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Backup JSON downloaded.');
  }

  importJson(json: string): boolean {
    try {
      const restored = importBackup(json);
      this.chapters.set(restored.chapters);
      this.systemState.set(restored.systemState);
      this.questionnaire.set(
        restored.questionnaire ?? createStarterAppState().questionnaire,
      );
      this.showToast('Backup restored successfully!');
      this.isBackupModalOpen.set(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON file';
      this.showToast(`Error: ${msg}`);
      return false;
    }
  }

  loadDemoData(): void {
    const demo = createDemoChapters();
    this.chapters.set(demo);
    const highest = demo.reduce((max, c) => Math.max(max, c.chapterNumber), 0);
    this.questionnaire.update((q) => ({
      ...q,
      targetChapterNumber: highest + 1,
      targetChapterTitle: 'Distributed Transactions & 2PC',
      topicId: 'system-design',
      topicName: 'System Design',
    }));
    this.showToast('Loaded sample chapters for preview.');
  }

  loadWeekSimulation(): void {
    const simulation = createOneWeekWalkthroughChapters();
    this.chapters.set(simulation);
    this.questionnaire.update((q) => ({
      ...q,
      targetChapterNumber: 7,
      targetChapterTitle: 'Distributed Transactions',
      topicId: 'system-design',
      topicName: 'System Design',
    }));
    this.showToast(this.dict().guide.simulationLoadedNotice);
  }

  clearAllData(): void {
    this.chapters.set([]);
    this.systemState.set({
      lastConsolidationAtChapter: 0,
      checklistState: new Array(9).fill(false),
      selectedTopicId: 'all',
      topics: DEFAULT_TOPICS,
    });
    this.questionnaire.set(createDefaultQuestionnaire());
    saveAppState({
      chapters: [],
      systemState: {
        lastConsolidationAtChapter: 0,
        checklistState: new Array(9).fill(false),
        selectedTopicId: 'all',
        topics: DEFAULT_TOPICS,
      },
      questionnaire: createDefaultQuestionnaire(),
    });
    this.showToast(this.dict().actions.clearData + ' ✓');
  }

  // Clipboard copy helpers
  async copyAlarmTitle(title: string, slotTime?: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(title);
      if (slotTime) {
        this.copiedSlotTime.set(slotTime);
        setTimeout(() => {
          if (this.copiedSlotTime() === slotTime) {
            this.copiedSlotTime.set(null);
          }
        }, 2000);
      }
      this.showToast(`${this.dict().schedule.copiedToast}"${title}"`);
    } catch {
      this.fallbackCopy(title);
    }
  }

  async copyAllAlarms(): Promise<void> {
    const d = this.decision();
    const lines = [
      `⏰ Alarms for ${d.tomorrowWeekday} (${d.tomorrowDate}) · [${d.effectiveDayType}]`,
      '-------------------------------------------------------',
      ...d.alarms.map((a) => `${a.time} -> ${a.title}`),
    ];
    const fullText = lines.join('\n');

    try {
      await navigator.clipboard.writeText(fullText);
      this.copiedSlotTime.set('ALL');
      setTimeout(() => {
        if (this.copiedSlotTime() === 'ALL') {
          this.copiedSlotTime.set(null);
        }
      }, 2500);
      this.markChecklistStep(8);
      this.showToast(this.dict().schedule.allCopiedToast);
    } catch {
      this.fallbackCopy(fullText);
    }
  }

  private fallbackCopy(text: string): void {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    this.showToast('Copied to clipboard!');
  }

  showToast(msg: string): void {
    this.copiedMessage.set(msg);
    setTimeout(() => {
      if (this.copiedMessage() === msg) {
        this.copiedMessage.set(null);
      }
    }, 3000);
  }
}
