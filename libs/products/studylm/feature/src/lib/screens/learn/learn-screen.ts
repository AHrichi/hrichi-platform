import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CHECK_KINDS,
  type Lesson,
  loadBuiltInLessons,
} from '@ah/products/studylm/lessons';
import { AhEmptyState, AhPagination, AhProgressBar, AhButton } from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import {
  type LessonProgress,
  StudyLmStorageService,
} from '../../services/studylm-storage.service';
import { BulkGenerationService } from '../../services/bulk-generation.service';
import { StudyLmScreens } from '../../shell/studylm-screens';
import { PreferencesStore } from '@ah/shared/state';
import { STUDYLM_COPY } from '../../i18n/studylm-copy';

const TIER_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];

export interface LessonCardItem {
  id: string;
  title: string;
  tier: string;
  minutes: number;
  objectives: string[];
  checks: number;
  answered: number;
  started: boolean;
  done: boolean;
  source: 'built-in' | 'generated';
  subject: string;
  subjectId: string;
  sectionId?: string | null;
}

export interface LessonGroup {
  subject: string;
  cards: LessonCardItem[];
}

/** Your lessons by subject, then the built-in ones, with search, filters, pagination, and bulk generation. */
@Component({
  selector: 'ah-studylm-learn-screen',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    AhPagination,
    AhEmptyState,
    AhProgressBar,
    AhButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head">
      <div class="head-titles">
        <h2>{{ copy().learn.heading }}</h2>
        <p>
          {{ copy().learn.description }}
        </p>
      </div>

      <!-- Bulk Generation Card / Status -->
      @if (store.activeSubject()) {
        <div class="bulk-card" [class.is-running]="bulk.isGenerating()">
          <div class="bulk-content">
            <div class="bulk-text">
              <div class="bulk-title-row">
                <span class="bulk-badge-icon" aria-hidden="true">⚡</span>
                <span class="bulk-title">{{ copy().learn.bulkTitle }}</span>
                <span class="bulk-pill">{{ copy().learn.bulkPill }}</span>
              </div>
              <p class="bulk-subtitle">
                @if (bulk.isGenerating()) {
                  {{ copy().learn.bulkGeneratingSubtitle }}
                } @else if (bulk.pendingSections().length > 0) {
                  {{ bulk.pendingSections().length }}
                  {{ copy().learn.bulkReadyPrefix }} "{{
                    store.activeSubject()?.title
                  }}" {{ copy().learn.bulkReadySuffix }}
                } @else {
                  {{ copy().learn.bulkAllDonePrefix }} "{{
                    store.activeSubject()?.title
                  }}" {{ copy().learn.bulkAllDoneSuffix }}
                }
              </p>
            </div>

            <div class="bulk-cta">
              @if (bulk.isGenerating()) {
                <button
                  type="button"
                  ahButton="danger"
                  size="sm"
                  (click)="cancelBulkGeneration()"
                >
                  {{ copy().learn.cancel }}
                </button>
              } @else {
                <button
                  type="button"
                  ahButton="primary"
                  size="sm"
                  [disabled]="
                    bulk.pendingSections().length === 0 || !store.aiReady()
                  "
                  [attr.title]="store.aiStatus()"
                  (click)="startBulkGeneration()"
                >
                  {{ copy().learn.bulkGenerateBtn }} ({{
                    bulk.pendingSections().length
                  }})
                </button>
              }
            </div>
          </div>

          @if (bulk.isGenerating() || bulk.statusMessage()) {
            <div class="bulk-status-panel">
              @if (bulk.isGenerating() && bulk.progress(); as p) {
                <div class="bulk-progress-bar-wrap">
                  <ah-progress-bar
                    [value]="p.percentage"
                    [label]="
                      copy().learn.batch +
                      ' ' +
                      p.currentBatch +
                      ' ' +
                      copy().learn.of +
                      ' ' +
                      p.totalBatches
                    "
                    size="sm"
                    [showValue]="true"
                  />
                </div>
              }

              <div class="bulk-msg-row">
                <span class="status-msg">{{ bulk.statusMessage() }}</span>
                @if (bulk.retryingCount() > 0) {
                  <span class="retry-indicator">
                    ⚠️ {{ bulk.retryingCount() }}
                    {{ copy().learn.retryAttempts }}
                  </span>
                }
              </div>

              @if (bulk.failedItems().length > 0) {
                <div class="bulk-failures-list" role="alert">
                  <strong
                    >{{ copy().learn.failedToWritePrefix }}
                    {{ bulk.failedItems().length }}
                    {{ copy().learn.failedToWriteSuffix }}</strong
                  >
                  <ul>
                    @for (item of bulk.failedItems(); track item.item.id) {
                      <li>
                        <strong>{{ item.item.title }}</strong
                        >: {{ item.error }} ({{ item.attempts }}
                        {{ copy().learn.attempts }})
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
        </div>
      }
    </header>

    <!-- Filters & Search Toolbar -->
    <section class="filters-toolbar" aria-label="Filter and search lessons">
      <div class="search-box">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          class="search-input"
          [placeholder]="copy().learn.searchPlaceholder"
          [value]="search()"
          (input)="onSearchInput($event)"
          [attr.aria-label]="copy().learn.searchPlaceholder"
        />
        @if (search()) {
          <button
            type="button"
            class="clear-btn"
            (click)="clearSearch()"
            aria-label="Clear search query"
          >
            ✕
          </button>
        }
      </div>

      <div class="filter-controls">
        <div class="filter-field">
          <label for="filter-tier" class="filter-label">{{
            copy().learn.tierLabel
          }}</label>
          <select
            id="filter-tier"
            class="filter-select"
            [value]="tierFilter()"
            (change)="onTierSelect($event)"
          >
            <option value="all">{{ copy().learn.allTiers }}</option>
            <option value="beginner">{{ copy().learn.beginner }}</option>
            <option value="intermediate">
              {{ copy().learn.intermediate }}
            </option>
            <option value="advanced">{{ copy().learn.advanced }}</option>
            <option value="expert">{{ copy().learn.expert }}</option>
          </select>
        </div>

        <div class="filter-field">
          <label for="filter-status" class="filter-label">{{
            copy().learn.statusLabel
          }}</label>
          <select
            id="filter-status"
            class="filter-select"
            [value]="statusFilter()"
            (change)="onStatusSelect($event)"
          >
            <option value="all">{{ copy().learn.allStatuses }}</option>
            <option value="not-started">{{ copy().learn.notStarted }}</option>
            <option value="in-progress">{{ copy().learn.inProgress }}</option>
            <option value="completed">{{ copy().learn.completed }}</option>
          </select>
        </div>

        <div class="filter-field">
          <label for="filter-source" class="filter-label">{{
            copy().learn.sourceLabel
          }}</label>
          <select
            id="filter-source"
            class="filter-select"
            [value]="sourceFilter()"
            (change)="onSourceSelect($event)"
          >
            <option value="all">{{ copy().learn.allLessons }}</option>
            @if (store.activeSubject(); as activeSub) {
              <option value="active-subject">
                {{ copy().learn.activePrefix }} ({{ activeSub.title }})
              </option>
            }
            <option value="generated">{{ copy().learn.aiGenerated }}</option>
            <option value="built-in">{{ copy().learn.builtInOffline }}</option>
          </select>
        </div>

        @if (hasActiveFilters()) {
          <button
            type="button"
            ahButton="ghost"
            size="sm"
            class="btn-reset-filters"
            (click)="clearFilters()"
          >
            {{ copy().learn.resetFilters }}
          </button>
        }
      </div>
    </section>

    <!-- Results Section -->
    @if (lessons.isLoading()) {
      <p role="status" class="status-msg-block">
        {{ copy().learn.loadingLessons }}
      </p>
    } @else if (lessons.error()) {
      <p role="alert" class="status-msg-block error">
        {{ copy().learn.loadError }}
      </p>
    } @else if (filteredLessons().length === 0) {
      <ah-empty-state
        icon="🔍"
        [title]="copy().learn.emptyTitle"
        [description]="copy().learn.emptyDescription"
      >
        @if (hasActiveFilters()) {
          <button
            empty-actions
            type="button"
            ahButton="secondary"
            size="sm"
            (click)="clearFilters()"
          >
            {{ copy().learn.clearAllFilters }}
          </button>
        }
      </ah-empty-state>
    } @else {
      <!-- Lessons Grid & Subject Groups -->
      <div class="lessons-container" aria-label="Lessons list">
        <div class="results-meta">
          <span class="count-label">
            {{ copy().learn.showing }}
            <strong>{{ pagedLessons().length }}</strong> {{ copy().learn.of }}
            <strong>{{ filteredLessons().length }}</strong>
            {{
              filteredLessons().length === 1
                ? copy().learn.lessonSingular
                : copy().learn.lessonPlural
            }}
          </span>
        </div>

        @for (group of pagedYours(); track group.subject) {
          <section class="group" [attr.aria-label]="group.subject">
            <h3 class="group-title">{{ group.subject }}</h3>
            <ul class="grid">
              @for (lesson of group.cards; track lesson.id) {
                <ng-container
                  *ngTemplateOutlet="card; context: { $implicit: lesson }"
                />
              }
            </ul>
          </section>
        }

        @if (pagedBuiltin().length > 0) {
          <section
            class="group"
            [attr.aria-label]="copy().learn.builtInLessonsHeading"
          >
            @if (hasYours()) {
              <h3 class="group-title">
                {{ copy().learn.builtInLessonsHeading }}
              </h3>
            }
            <ul class="grid">
              @for (lesson of pagedBuiltin(); track lesson.id) {
                <ng-container
                  *ngTemplateOutlet="card; context: { $implicit: lesson }"
                />
              }
            </ul>
          </section>
        }

        <!-- Pagination Controls -->
        <ah-pagination
          [totalItems]="filteredLessons().length"
          [pageSize]="pageSize()"
          [currentPage]="currentPage()"
          [pageSizeOptions]="[12, 24, 48]"
          [itemLabel]="copy().learn.lessonPlural"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        />
      </div>
    }

    <!-- Single Lesson Card Template -->
    <ng-template #card let-lesson>
      <li class="card">
        <div class="card-head">
          <p class="meta">
            <span class="tier">{{ lesson.tier }}</span>
            <span>{{ lesson.minutes }} {{ copy().learn.minUnit }}</span>
          </p>
          <span
            class="source-pill"
            [class.is-generated]="lesson.source === 'generated'"
            [title]="lesson.subject"
          >
            {{
              lesson.source === 'generated'
                ? lesson.subject
                : copy().learn.builtInBadge
            }}
          </span>
        </div>

        <h3>
          <a [routerLink]="lesson.id">{{ lesson.title }}</a>
        </h3>

        <ul class="objectives">
          @for (objective of lesson.objectives; track $index) {
            <li>{{ objective }}</li>
          }
        </ul>

        <p
          class="progress"
          [class.is-complete]="lesson.done"
          [class.is-started]="lesson.started && !lesson.done"
        >
          @if (lesson.done) {
            <span class="done-check" aria-hidden="true">✓</span>
            {{ copy().learn.complete }}
          } @else if (lesson.started) {
            {{ copy().learn.inProgressPrefix }} {{ lesson.answered }}
            {{ copy().learn.of }} {{ lesson.checks }}
            {{ copy().learn.checksSuffix }}
          } @else {
            {{ copy().learn.notStartedCard }}
          }
        </p>

        @if (lesson.sectionId; as secId) {
          <div class="card-section-actions">
            <button
              type="button"
              class="card-jump-btn"
              (click)="goToSectionCards($event, secId)"
              title="Study flashcards for this topic"
            >
              <span>🃏 {{ copy().learn.jumpCards }}</span>
            </button>
            <button
              type="button"
              class="card-jump-btn"
              (click)="goToSectionQuiz($event, secId)"
              title="Take quiz for this topic"
            >
              <span>🎯 {{ copy().learn.jumpQuiz }}</span>
            </button>
            <button
              type="button"
              class="card-jump-btn"
              (click)="goToSectionRoadmap($event, secId)"
              title="View on Roadmap"
            >
              <span>🗺️ {{ copy().learn.jumpRoadmap }}</span>
            </button>
          </div>
        }
      </li>
    </ng-template>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-5);
    }
    h2,
    h3,
    h4,
    p {
      margin: 0;
    }
    .head {
      display: grid;
      gap: var(--space-4);
      color: var(--color-text-muted);
      h2 {
        color: var(--color-text-default);
      }
    }
    .head-titles {
      display: grid;
      gap: var(--space-2);
      max-inline-size: 48rem;
    }

    /* Bulk Generation Card */
    .bulk-card {
      display: grid;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg);
      background: var(--color-bg-surface);
      box-shadow: var(--shadow-subtle, 0 1px 2px rgba(0, 0, 0, 0.05));
      transition: border-color var(--motion-duration-fast) ease;

      &.is-running {
        border-color: var(--color-accent-default);
        background: color-mix(
          in srgb,
          var(--color-accent-subtle) 15%,
          var(--color-bg-surface)
        );
      }
    }
    .bulk-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }
    .bulk-text {
      display: grid;
      gap: var(--space-1);
    }
    .bulk-title-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }
    .bulk-badge-icon {
      font-size: 1.1rem;
      line-height: 1;
    }
    .bulk-title {
      font-size: var(--font-size-300);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-default);
    }
    .bulk-pill {
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-medium);
      padding: 2px 8px;
      border-radius: var(--radius-pill);
      background: color-mix(
        in srgb,
        var(--color-accent-default) 14%,
        transparent
      );
      color: var(--color-accent-default);
      border: 1px solid
        color-mix(in srgb, var(--color-accent-default) 30%, transparent);
    }
    .bulk-subtitle {
      font-size: var(--font-size-200);
      color: var(--color-text-muted);
    }
    .bulk-cta {
      flex-shrink: 0;
    }
    .bulk-status-panel {
      display: grid;
      gap: var(--space-2);
      padding-top: var(--space-3);
      border-top: 1px dashed var(--color-border-default);
    }
    .bulk-progress-bar-wrap {
      width: 100%;
    }
    .bulk-msg-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-200);
      flex-wrap: wrap;
    }
    .status-msg {
      color: var(--color-text-default);
      font-weight: var(--font-weight-medium);
    }
    .retry-indicator {
      color: var(--color-warning-default, #f59e0b);
      font-weight: var(--font-weight-medium);
      font-size: var(--font-size-100);
    }
    .bulk-failures-list {
      background: color-mix(
        in srgb,
        var(--color-danger-subtle, #fecaca) 25%,
        transparent
      );
      border: 1px solid var(--color-danger-default, #ef4444);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      font-size: var(--font-size-100);
      color: var(--color-danger-default, #ef4444);

      ul {
        margin: var(--space-1) 0 0;
        padding-inline-start: var(--space-4);
      }
    }

    /* Filters Toolbar */
    .filters-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      flex-wrap: wrap;
      padding: var(--space-3) var(--space-4);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1 1 240px;
      min-width: 200px;
    }
    .search-icon {
      position: absolute;
      left: var(--space-3);
      font-size: 0.9rem;
      color: var(--color-text-muted);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      height: 38px;
      padding: 0 var(--space-7) 0 var(--space-7);
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
      color: var(--color-text-default);
      font-size: var(--font-size-200);
      outline: none;
      transition: border-color var(--motion-duration-fast) ease;

      &:focus {
        border-color: var(--color-accent-default);
      }
    }
    .clear-btn {
      position: absolute;
      right: var(--space-2);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 0.8rem;
      border-radius: 50%;

      &:hover {
        background: var(--color-bg-subtle, rgba(255, 255, 255, 0.1));
        color: var(--color-text-default);
      }
    }
    .filter-controls {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }
    .filter-field {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .filter-label {
      font-size: var(--font-size-100);
      color: var(--color-text-muted);
      font-weight: var(--font-weight-medium);
      white-space: nowrap;
    }
    .filter-select {
      height: 38px;
      padding: 0 var(--space-3);
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
      color: var(--color-text-default);
      font-size: var(--font-size-200);
      outline: none;
      cursor: pointer;

      &:focus {
        border-color: var(--color-accent-default);
      }
    }
    .btn-reset-filters {
      white-space: nowrap;
    }

    /* Lessons Grid and Cards */
    .lessons-container {
      display: grid;
      gap: var(--space-5);
    }
    .group {
      display: grid;
      gap: var(--space-3);
    }
    .group-title {
      font-size: var(--font-size-400);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-default);
    }
    .results-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--color-text-muted);
      font-size: var(--font-size-200);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
      gap: var(--space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .card {
      position: relative;
      display: grid;
      align-content: start;
      gap: var(--space-2);
      padding: var(--space-4);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg);
      background: var(--color-bg-surface);
      transition:
        border-color var(--motion-duration-fast) ease,
        box-shadow var(--motion-duration-fast) ease;
    }
    .card:focus-within,
    .card:hover {
      border-color: var(--color-accent-default);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }
    h3 a {
      color: var(--color-text-default);
      text-decoration: none;
      font-size: var(--font-size-300);
      line-height: 1.35;
      /* The whole card is the link's target. */
      &::after {
        content: '';
        position: absolute;
        inset: 0;
      }
    }
    .meta {
      display: flex;
      gap: var(--space-3);
      color: var(--color-text-muted);
      font-size: var(--font-size-100);
    }
    .tier {
      color: var(--color-accent-default);
      font-weight: var(--font-weight-bold);
      text-transform: capitalize;
    }
    .source-pill {
      font-size: var(--font-size-100);
      padding: 1px 7px;
      border-radius: var(--radius-pill);
      background: var(--color-bg-raised);
      color: var(--color-text-muted);
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.is-generated {
        background: color-mix(
          in srgb,
          var(--color-accent-default) 12%,
          transparent
        );
        color: var(--color-accent-default);
        font-weight: var(--font-weight-medium);
      }
    }
    .objectives {
      margin: 0;
      padding-inline-start: var(--space-4);
      color: var(--color-text-muted);
      font-size: var(--font-size-200);
      line-height: 1.5;
    }
    .progress {
      font-size: var(--font-size-200);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-muted);

      &.is-started {
        color: var(--color-accent-default);
      }

      &.is-complete {
        color: var(--color-success-default, #10b981);
      }
    }
    .done-check {
      font-weight: var(--font-weight-bold);
    }
    .card-section-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-top: var(--space-2);
      padding-top: var(--space-2);
      border-top: 1px dashed var(--color-border-default);
      position: relative;
      z-index: 2;
    }
    .card-jump-btn {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 3px 8px;
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--motion-duration-fast) ease;

      &:hover {
        border-color: var(--color-accent-default);
        color: var(--color-accent-default);
      }
    }
    .status-msg-block {
      padding: var(--space-6);
      text-align: center;
      color: var(--color-text-muted);

      &.error {
        color: var(--color-danger-default, #ef4444);
      }
    }
  `,
})
export class LearnScreen {
  private readonly storage = inject(StudyLmStorageService);
  protected readonly store = inject(StudyLmStore);
  protected readonly bulk = inject(BulkGenerationService);
  protected readonly screens = inject(StudyLmScreens);
  private readonly preferences = inject(PreferencesStore, { optional: true });
  readonly copy = computed(
    () =>
      STUDYLM_COPY[this.preferences?.language() ?? 'en'] ?? STUDYLM_COPY.en,
  );

  readonly search = signal<string>('');
  readonly tierFilter = signal<string>('all');
  readonly statusFilter = signal<string>('all');
  readonly sourceFilter = signal<string>('all');
  readonly pageSize = signal<number>(12);
  readonly currentPage = signal<number>(1);

  protected readonly lessons = resource({
    loader: async () => {
      const [lessons, progress, generated] = await Promise.all([
        loadBuiltInLessons(),
        this.storage.getAllLessonProgress(),
        this.storage.listGeneratedLessons(),
      ]);
      return { lessons, progress, generated };
    },
  });

  private readonly progress = computed(
    () =>
      new Map(
        (this.lessons.value()?.progress ?? []).map((p) => [p.lessonId, p]),
      ),
  );

  /** All transformed cards across generated and built-in lessons. */
  protected readonly allLessons = computed<LessonCardItem[]>(() => {
    const data = this.lessons.value();
    if (!data) return [];

    const progMap = this.progress();
    const titles = new Map(this.store.subjects().map((s) => [s.id, s.title]));

    const generated: LessonCardItem[] = (data.generated ?? []).map((record) => {
      const subject = titles.get(record.subjectId) ?? 'Custom Curriculum';
      const c = card(record.lesson, progMap.get(record.id));
      return {
        ...c,
        source: 'generated',
        subject,
        subjectId: record.subjectId,
        sectionId: record.sectionId,
      };
    });

    const builtin: LessonCardItem[] = (data.lessons ?? [])
      .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
      .map((lesson) => {
        const c = card(lesson, progMap.get(lesson.id));
        return {
          ...c,
          source: 'built-in',
          subject: 'Built-in Curriculum',
          subjectId: 'builtin',
          sectionId: null,
        };
      });

    return [...generated, ...builtin];
  });

  protected readonly filteredLessons = computed<LessonCardItem[]>(() => {
    const list = this.allLessons();
    const query = this.search().trim().toLowerCase();
    const tier = this.tierFilter();
    const status = this.statusFilter();
    const source = this.sourceFilter();
    const activeSubjectId = this.store.activeSubjectId();

    return list.filter((item) => {
      if (query) {
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchSubject = item.subject.toLowerCase().includes(query);
        const matchObj = item.objectives.some((o) =>
          o.toLowerCase().includes(query),
        );
        if (!matchTitle && !matchSubject && !matchObj) {
          return false;
        }
      }

      if (tier !== 'all' && item.tier !== tier) {
        return false;
      }

      if (status === 'completed' && !item.done) {
        return false;
      }
      if (status === 'in-progress' && (!item.started || item.done)) {
        return false;
      }
      if (status === 'not-started' && item.started) {
        return false;
      }

      if (source === 'built-in' && item.source !== 'built-in') {
        return false;
      }
      if (source === 'generated' && item.source !== 'generated') {
        return false;
      }
      if (source === 'active-subject') {
        if (!activeSubjectId || item.subjectId !== activeSubjectId) {
          return false;
        }
      }

      return true;
    });
  });

  protected readonly hasActiveFilters = computed(() => {
    return (
      this.search().trim().length > 0 ||
      this.tierFilter() !== 'all' ||
      this.statusFilter() !== 'all' ||
      this.sourceFilter() !== 'all'
    );
  });

  protected readonly pagedLessons = computed<LessonCardItem[]>(() => {
    const list = this.filteredLessons();
    const size = this.pageSize();
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    const page = Math.min(Math.max(1, this.currentPage()), totalPages);
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected readonly pagedYours = computed<LessonGroup[]>(() => {
    const generated = this.pagedLessons().filter(
      (item) => item.source === 'generated',
    );
    const groups = new Map<string, LessonCardItem[]>();
    for (const item of generated) {
      const list = groups.get(item.subject) ?? [];
      list.push(item);
      groups.set(item.subject, list);
    }
    return Array.from(groups.entries()).map(([subject, cards]) => ({
      subject,
      cards,
    }));
  });

  protected readonly pagedBuiltin = computed<LessonCardItem[]>(() => {
    return this.pagedLessons().filter((item) => item.source === 'built-in');
  });

  protected readonly hasYours = computed(() => {
    return this.filteredLessons().some((item) => item.source === 'generated');
  });

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search.set(target.value);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.search.set('');
    this.currentPage.set(1);
  }

  onTierSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.tierFilter.set(target.value);
    this.currentPage.set(1);
  }

  onStatusSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value);
    this.currentPage.set(1);
  }

  onSourceSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sourceFilter.set(target.value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.search.set('');
    this.tierFilter.set('all');
    this.statusFilter.set('all');
    this.sourceFilter.set('all');
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  goToSectionRoadmap(event: MouseEvent, sectionId: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.store.setSelectedSection(sectionId);
    void this.screens.goToSectionRoadmap(sectionId);
  }

  goToSectionCards(event: MouseEvent, sectionId: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.store.setCardSectionFilter(sectionId);
    void this.screens.goToSectionFlashcards(sectionId);
  }

  goToSectionQuiz(event: MouseEvent, sectionId: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.store.setQuizSectionFilter(sectionId);
    void this.screens.goToSectionQuiz(sectionId);
  }

  async startBulkGeneration(): Promise<void> {
    try {
      await this.bulk.bulkGenerateLessons({
        batchSize: 2,
        maxRetries: 2,
        retryDelayMs: 1200,
      });
      this.lessons.reload();
    } catch {
      // Error state recorded in bulk service signals
    }
  }

  cancelBulkGeneration(): void {
    this.bulk.cancel();
  }
}

function card(lesson: Lesson, saved: LessonProgress | undefined) {
  const checks = lesson.sections
    .flatMap((s) => s.blocks)
    .filter((b) => (CHECK_KINDS as readonly string[]).includes(b.kind)).length;
  return {
    ...lesson,
    checks,
    answered: Object.keys(saved?.checks ?? {}).length,
    started: saved !== undefined,
    done: saved?.completedAt != null,
  };
}
