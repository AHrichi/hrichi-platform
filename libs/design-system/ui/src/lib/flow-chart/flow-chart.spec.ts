import { ComponentFixture, TestBed } from '@angular/core/testing';
import { type ConceptGraphData, FlowChart } from './flow-chart';

describe('FlowChart', () => {
  let component: FlowChart;
  let fixture: ComponentFixture<FlowChart>;

  const sampleGraph: ConceptGraphData = {
    title: 'Event Loop Microtask Lifecycle',
    description: 'Execution order of Call Stack, Microtasks, and Macrotasks',
    nodes: [
      {
        id: '1',
        label: 'Synchronous Call Stack Frame',
        subtext: 'Executes function until stack is empty',
        type: 'start',
        badge: 'Main Thread',
      },
      {
        id: '2',
        label: 'Microtask Queue Drain',
        subtext: 'Promise.then, queueMicrotask run to exhaustion',
        type: 'highlight',
        badge: 'Priority',
      },
      {
        id: '3',
        label: 'Render Steps (if needed)',
        subtext: 'Style recalculation and layout',
        type: 'process',
      },
      {
        id: '4',
        label: 'Macrotask Dispatch',
        subtext: 'setTimeout, setInterval callback processed',
        type: 'end',
      },
    ],
    edges: [
      { from: '1', to: '2', label: 'Stack Empty' },
      { from: '2', to: '3', label: 'Queue Exhausted' },
      { from: '3', to: '4', label: 'Next Tick' },
    ],
    rawMermaid: 'graph TD\n A[Stack] -->|Empty| B[Microtasks]\n B --> C[Render]\n C --> D[Macrotask]',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowChart],
    }).compileComponents();

    fixture = TestBed.createComponent(FlowChart);
    component = fixture.componentInstance;
  });

  it('should create the flow chart component', () => {
    expect(component).toBeTruthy();
  });

  it('should render nodes when graph data is provided', () => {
    fixture.componentRef.setInput('graph', sampleGraph);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const nodes = compiled.querySelectorAll('.node');
    expect(nodes.length).toBe(4);

    const titleEl = compiled.querySelector('.chart-title');
    expect(titleEl?.textContent).toContain('Event Loop Microtask Lifecycle');
  });

  it('should toggle direction between vertical and horizontal', () => {
    fixture.componentRef.setInput('graph', sampleGraph);
    fixture.componentRef.setInput('direction', 'vertical');
    fixture.detectChanges();

    expect(component.activeDirection()).toBe('vertical');
    component.toggleDirection();
    expect(component.activeDirection()).toBe('horizontal');
  });

  it('should toggle raw mermaid source view when button is clicked', () => {
    fixture.componentRef.setInput('graph', sampleGraph);
    fixture.detectChanges();

    expect(component.showMermaidSource()).toBe(false);
    component.toggleMermaidSource();
    expect(component.showMermaidSource()).toBe(true);

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const rawCode = compiled.querySelector('.raw-view code');
    expect(rawCode?.textContent).toContain('graph TD');
  });

  it('should handle node selection, density and zoom controls', () => {
    fixture.componentRef.setInput('graph', sampleGraph);
    fixture.detectChanges();

    expect(component.selectedNodeId()).toBeNull();
    component.selectNode('2');
    expect(component.selectedNodeId()).toBe('2');

    component.selectNode('2');
    expect(component.selectedNodeId()).toBeNull();

    expect(component.density()).toBe('comfortable');
    component.toggleDensity();
    expect(component.density()).toBe('compact');

    expect(component.zoom()).toBe(1);
    component.zoomIn();
    expect(component.zoom()).toBe(1.1);
    component.zoomOut();
    expect(component.zoom()).toBe(1);
  });
});
