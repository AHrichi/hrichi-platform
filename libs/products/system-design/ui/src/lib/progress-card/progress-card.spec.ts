import { TestBed } from '@angular/core/testing';
import {
  courseProgress,
  CURRICULUM,
  type LessonProgress,
} from '@ah/products/system-design/domain';
import { SdProgressCard } from './progress-card';

describe('SdProgressCard', () => {
  it('shows overall x / 44 count and expands to per-module progress bars', async () => {
    const firstId = CURRICULUM[0].lessons[0].id;
    const map = new Map<string, LessonProgress>([
      [
        firstId,
        {
          lessonId: firstId,
          furthestStep: 5,
          lastStep: 5,
          completedAt: '2026-11-20T09:00:00Z',
          updatedAt: '2026-11-20T09:00:00Z',
        },
      ],
    ]);
    const progress = courseProgress(CURRICULUM, map);

    const fixture = TestBed.createComponent(SdProgressCard);
    fixture.componentRef.setInput('progress', progress);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.progress-total')?.textContent).toBe('1 / 44');
    expect(host.querySelector('.module-list')).toBeNull();

    const trigger = host.querySelector(
      'button.progress-trigger',
    ) as HTMLButtonElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const items = host.querySelectorAll('.module-item');
    expect(items.length).toBe(CURRICULUM.length);
    expect(items[0].textContent).toContain('01. Foundations');
    expect(items[0].textContent).toContain('1 / 4');
    expect(host.querySelectorAll('ah-progress-bar').length).toBe(
      CURRICULUM.length + 1,
    );
  });
});
