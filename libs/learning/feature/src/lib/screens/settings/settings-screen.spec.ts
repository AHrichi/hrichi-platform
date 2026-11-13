import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DEFAULT_SETTINGS, LearningStore } from '../../store/learning.store';
import { SettingsScreen } from './settings-screen';

describe('SettingsScreen', () => {
  it('renders StreakFlame and updates weekly streak goal settings', () => {
    const settings = signal(DEFAULT_SETTINGS);
    const saveSettings = vi.fn().mockImplementation(async (patch) => {
      settings.update((s) => ({ ...s, ...patch }));
    });

    TestBed.configureTestingModule({
      imports: [SettingsScreen],
      providers: [
        provideRouter([]),
        {
          provide: LearningStore,
          useValue: {
            settings,
            sessions: signal([]),
            timeZone: signal('UTC'),
            themes: signal([
              { theme: 'meadow', title: 'Meadow', unlocked: true, how: '' },
            ]),
            milestones: signal([]),
            streak: signal({
              current: 3,
              longest: 7,
              freezesBanked: 1,
              lastActiveDate: '2026-11-12',
              repairOffer: null,
              mode: 'daily' as const,
              weeklyTarget: 5,
              thisWeekCount: 3,
            }),
            xp: signal({ level: 2, into: 10, span: 100 }),
            xpTotal: signal(110),
            saveSettings,
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(SettingsScreen);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('lrn-streak-flame')).toBeTruthy();

    const weeklyBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Weekly target'),
    ) as HTMLButtonElement;
    weeklyBtn.click();
    fixture.detectChanges();

    expect(saveSettings).toHaveBeenCalledWith({ streakMode: 'weekly' });
    const targetInput = host.querySelector(
      '#weekly-target',
    ) as HTMLInputElement;
    expect(targetInput).toBeTruthy();

    targetInput.value = '4';
    targetInput.dispatchEvent(new Event('change'));
    expect(saveSettings).toHaveBeenCalledWith({ weeklyTarget: 4 });
  });
});
