import '@angular/compiler';
import {
  Injector,
  PendingTasks,
  signal,
  ɵChangeDetectionScheduler,
  ɵEffectScheduler,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { LearningLink } from '@ah/learning/client';
import { APP_MODE } from '@ah/platform/app-mode';
import { PreferencesStore } from '@ah/shared/state';
import { LessonGenerationService } from '../../services/lesson-generation.service';
import { StudyLmScreens } from '../../shell/studylm-screens';
import { StudyLmStore } from '../../store/studylm.store';
import { FlashcardDeckComponent } from './flashcard-deck.component';

type TestDeck = {
  engineTier(cardId: string): {
    tier: string;
    icon: string;
    label: string;
    variant: string;
  } | null;
};

describe('FlashcardDeckComponent', () => {
  function setup(linkedValue: boolean) {
    const linked = signal(linkedValue);
    const refresh = vi.fn().mockResolvedValue(undefined);
    const itemState = vi.fn().mockImplementation((_type: string, id: string) =>
      id === 'fc-1'
        ? {
            objectType: 'flashcard',
            objectId: 'fc-1',
            stage: 'reviewing',
            tier: 'sprout',
            due: '2026-11-15',
          }
        : null,
    );
    const noop = () => undefined;
    const injector = Injector.create({
      providers: [
        { provide: ɵChangeDetectionScheduler, useValue: { notify: noop } },
        { provide: ɵEffectScheduler, useValue: { add: noop } },
        { provide: PendingTasks, useValue: { add: () => noop } },
        { provide: APP_MODE, useValue: 'standalone' },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of({ get: () => null }) },
        },
        {
          provide: PreferencesStore,
          useValue: { language: signal('en') },
        },
        {
          provide: StudyLmScreens,
          useValue: { go: vi.fn() },
        },
        {
          provide: LessonGenerationService,
          useValue: {},
        },
        {
          provide: StudyLmStore,
          useValue: {
            activeSubject: signal(null),
            cardFilter: signal({ sectionId: null }),
            filteredFlashcards: signal([]),
            setCardSectionFilter: vi.fn(),
          },
        },
        {
          provide: LearningLink,
          useValue: {
            linked,
            refresh,
            itemState,
          },
        },
        FlashcardDeckComponent,
      ],
    });
    const deck = injector.get(FlashcardDeckComponent) as unknown as TestDeck;
    return { deck, refresh, itemState };
  }

  it('returns null for engineTier when unlinked or card has no tier', () => {
    const unlinked = setup(false);
    expect(unlinked.refresh).not.toHaveBeenCalled();
    expect(unlinked.deck.engineTier('fc-1')).toBeNull();

    const linked = setup(true);
    expect(linked.deck.engineTier('fc-missing')).toBeNull();
  });

  it('refreshes the link and resolves tier badge details when linked', () => {
    const { deck, refresh, itemState } = setup(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(deck.engineTier('fc-1')).toEqual({
      tier: 'sprout',
      icon: '🌱',
      label: 'Sprout',
      variant: 'info',
    });
    expect(itemState).toHaveBeenCalledWith('flashcard', 'fc-1');
  });
});
