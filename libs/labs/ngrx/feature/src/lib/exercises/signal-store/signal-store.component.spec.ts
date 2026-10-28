import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SignalStoreComponent, SkillsStore } from './signal-store.component';

describe('SignalStoreComponent', () => {
  let fixture: ComponentFixture<SignalStoreComponent>;
  let component: SignalStoreComponent;
  let store: InstanceType<typeof SkillsStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalStoreComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SignalStoreComponent);
    component = fixture.componentInstance;
    store = component.store;
    fixture.detectChanges();
  });

  it('initializes SkillsStore with initial entities and computed metrics', () => {
    expect(store.totalCount()).toBe(4);
    expect(store.certifiedCount()).toBe(4);
    expect(store.averageMastery()).toBeGreaterThan(85);
  });

  it('adds custom skills and updates normalized entity map', () => {
    component.addCustomSkill();
    fixture.detectChanges();

    expect(store.totalCount()).toBe(5);
    const ids = store.ids();
    const lastId = ids[ids.length - 1];
    expect(store.entityMap()[lastId]?.name).toContain('Specialized Skill');
  });

  it('boosts mastery level for a specific entity', () => {
    const initialLevel = store.entityMap()['sk-1'].masteryLevel;
    store.boostMastery('sk-1');
    fixture.detectChanges();

    expect(store.entityMap()['sk-1'].masteryLevel).toBe(
      Math.min(100, initialLevel + 5),
    );
  });

  it('filters entities reactively via search query and category', () => {
    store.setSearch('Zoneless');
    fixture.detectChanges();

    expect(store.filteredSkills().length).toBe(1);
    expect(store.filteredSkills()[0].id).toBe('sk-1');

    store.setSearch('');
    store.setCategory('architectural');
    fixture.detectChanges();

    expect(store.filteredSkills().length).toBe(1);
    expect(store.filteredSkills()[0].name).toContain('Native Federation');
  });
});
