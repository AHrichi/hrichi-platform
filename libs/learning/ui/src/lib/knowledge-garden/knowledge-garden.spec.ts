import { TestBed } from '@angular/core/testing';
import { type GardenPlant, KnowledgeGarden } from './knowledge-garden';

const plants: GardenPlant[] = [
  {
    key: 't1',
    name: 'Economics',
    hidden: 0,
    wilting: 1,
    counts: '1 bloom · 1 seed',
    stemTop: 72,
    leaves: [
      {
        id: 'c1',
        title: 'Opportunity cost',
        tier: 'bloom',
        wilting: false,
        x: 60,
        y: 116,
        side: -1,
      },
      {
        id: 'c2',
        title: 'Sunk cost',
        tier: 'seed',
        wilting: true,
        x: 60,
        y: 100,
        side: 1,
      },
    ],
  },
];

describe('KnowledgeGarden', () => {
  it('renders plants, theme class, and emits reviewRequested for drooping plants', () => {
    const fixture = TestBed.createComponent(KnowledgeGarden);
    fixture.componentRef.setInput('plants', plants);
    fixture.componentRef.setInput('theme', 'aurora');
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.garden') as HTMLElement;
    expect(root.classList).toContain('theme-aurora');
    expect(root.textContent).toContain('Economics');
    expect(root.textContent).toContain('Opportunity cost: Bloom');
    expect(root.textContent).toContain('Sunk cost: Seed, due for review');

    let clicked: GardenPlant | null = null;
    fixture.componentInstance.reviewRequested.subscribe((p) => (clicked = p));
    (root.querySelector('.thirsty-btn') as HTMLButtonElement).click();
    expect(clicked).toEqual(plants[0]);
  });
});
