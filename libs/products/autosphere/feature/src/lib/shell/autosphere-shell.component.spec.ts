import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AutoSphereShellComponent } from './autosphere-shell.component';
import { AutoSphereStore } from '../autosphere-store';
import { AutoSphereCmsService } from '@ah/products/autosphere/domain';

describe('AutoSphereShellComponent', () => {
  let component: AutoSphereShellComponent;
  let fixture: ComponentFixture<AutoSphereShellComponent>;
  let store: AutoSphereStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoSphereShellComponent],
      providers: [provideRouter([]), AutoSphereCmsService, AutoSphereStore],
    }).compileComponents();

    fixture = TestBed.createComponent(AutoSphereShellComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(AutoSphereStore);
    fixture.detectChanges();
  });

  it('should create and initialize default state', () => {
    expect(component).toBeTruthy();
    expect(store.activeModel().slug).toBe('gt-v');
    expect(store.totalPrice()).toBeGreaterThan(90000);
  });

  it('should switch vehicle models', () => {
    store.selectModel('aerosport');
    fixture.detectChanges();
    expect(store.activeModel().slug).toBe('aerosport');
    expect(store.activeModel().name).toBe('AutoSphere AeroSport');
  });

  it('should switch visualizer view angles', () => {
    expect(store.viewAngle()).toBe('three-quarters');
    store.setViewAngle('blueprint');
    fixture.detectChanges();
    expect(store.viewAngle()).toBe('blueprint');
  });

  it('should update exterior color and calculate total price', () => {
    const initialPrice = store.totalPrice();
    const carmineColor = store
      .activeModel()
      .colorways.find((c) => c.id === 'carmine');
    if (carmineColor) {
      store.selectColor(carmineColor.id);
      fixture.detectChanges();
      expect(store.totalPrice()).toBe(initialPrice + carmineColor.priceDelta);
    }
  });

  it('should calculate effective WLTP range impact from wheels', () => {
    const baseRange = store.activeTrim().wltpRangeKm;
    const wheel21 = store.activeModel().wheels.find((w) => w.id === 'wheel-21');
    if (wheel21) {
      store.selectWheel(wheel21.id);
      fixture.detectChanges();
      expect(store.effectiveRangeKm()).toBe(baseRange + wheel21.rangeImpactKm);
    }
  });

  it('should manage order modal state', () => {
    expect(component['orderModalOpen']()).toBe(false);
    component['openOrderModal']();
    expect(component['orderModalOpen']()).toBe(true);
    component['closeOrderModal']();
    expect(component['orderModalOpen']()).toBe(false);
  });

  it('should support switching tabs and configuring interior', () => {
    component['setTab']('interior');
    expect(component['activeTab']()).toBe('interior');
    expect(store.cameraPreset()).toBe('interior');

    const upholstery = store.activeModel().interiorUpholsteries[1];
    component['selectUpholstery'](upholstery);
    expect(store.activeUpholstery().id).toBe(upholstery.id);
  });

  it('should simulate range under different temperatures and speeds', () => {
    component['setTab']('simulator');
    component['setTemperature'](-5);
    component['setDrivingSpeedCycle']('highway');
    fixture.detectChanges();

    const sim = store.rangeSimulation();
    expect(sim.simulatedRangeKm).toBeLessThan(store.effectiveRangeKm());
  });

  it('should export build specification json', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    component['exportBuildJson']();
    expect(createElementSpy).toHaveBeenCalledWith('a');
  });
});
