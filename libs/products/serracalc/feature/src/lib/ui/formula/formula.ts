import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { type MathNode, parseFormula } from './formula-parse';

const MATHML = 'http://www.w3.org/1998/Math/MathML';

/**
 * Draws a parsed formula as MathML into its element, with DOM calls only
 * (no innerHTML). Screen readers read MathML as maths.
 */
@Directive({ selector: '[scMath]' })
export class MathView {
  readonly scMath = input.required<readonly MathNode[]>();
  readonly display = input<'block' | 'inline'>('block');
  private readonly r = inject(Renderer2);
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    effect(() => this.render(this.scMath(), this.display()));
  }

  private render(nodes: readonly MathNode[], display: string): void {
    for (const child of [...this.host.childNodes]) {
      this.r.removeChild(this.host, child);
    }
    const math = this.el('math');
    this.r.setAttribute(math, 'display', display);
    this.r.setAttribute(math, 'dir', 'ltr');
    this.r.appendChild(math, this.row(nodes));
    this.r.appendChild(this.host, math);
  }

  private el(name: string): Element {
    return this.r.createElement(name, MATHML) as Element;
  }

  private row(nodes: readonly MathNode[]): Element {
    const row = this.el('mrow');
    for (const n of nodes) this.r.appendChild(row, this.node(n));
    return row;
  }

  private node(n: MathNode): Element {
    switch (n.k) {
      case 'mi':
      case 'mn':
      case 'mo':
      case 'mtext': {
        const e = this.el(n.k);
        this.r.appendChild(e, this.r.createText(n.t));
        return e;
      }
      case 'space': {
        const e = this.el('mspace');
        this.r.setAttribute(e, 'width', '0.25em');
        return e;
      }
      case 'sub':
      case 'sup': {
        const e = this.el(n.k === 'sub' ? 'msub' : 'msup');
        this.r.appendChild(e, this.node(n.b));
        this.r.appendChild(e, this.node(n.s));
        return e;
      }
      case 'frac': {
        const e = this.el('mfrac');
        this.r.appendChild(e, this.row(n.n));
        this.r.appendChild(e, this.row(n.d));
        return e;
      }
      case 'sqrt': {
        const e = this.el('msqrt');
        this.r.appendChild(e, this.row(n.c));
        return e;
      }
      case 'group': {
        const parts: MathNode[] = [
          ...(n.open ? [{ k: 'mo' as const, t: n.open }] : []),
          ...n.c,
          ...(n.close ? [{ k: 'mo' as const, t: n.close }] : []),
        ];
        return this.row(parts);
      }
    }
  }
}

/**
 * A formula laid out as maths: fractions built up, subscripts set low,
 * one equation a line, with its label and its note (units) beside it.
 * The source is SerraCalc's plain-text formula (see formula-parse.ts).
 * When a long one overflows a narrow screen it scrolls, and it can then
 * take focus so a keyboard can scroll it too.
 */
@Component({
  selector: 'sc-formula',
  imports: [MathView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    dir: 'ltr',
    '[attr.tabindex]': 'overflowing() ? 0 : null',
    '[attr.role]': "overflowing() ? 'group' : null",
    '[attr.aria-label]': 'overflowing() ? label() || null : null',
  },
  template: `
    @for (eq of equations(); track $index) {
      <div class="eq">
        @if (eq.label) {
          <span class="eq-label">{{ eq.label }}</span>
        }
        <span class="eq-math" [scMath]="eq.nodes" [display]="display()"></span>
        @if (eq.note) {
          <span class="eq-note">[{{ eq.note }}]</span>
        }
      </div>
    }
  `,
  styleUrl: './formula.scss',
})
export class Formula {
  readonly source = input.required<string>();
  readonly display = input<'block' | 'inline'>('block');
  /** Names the scroll area when it overflows (e.g. "Formula"). */
  readonly label = input('');

  protected readonly equations = computed(() => parseFormula(this.source()));
  protected readonly overflowing = signal(false);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const check = () =>
      this.overflowing.set(host.scrollWidth > host.clientWidth + 1);
    afterRenderEffect(() => {
      this.equations();
      check();
    });
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const resize = new ResizeObserver(check);
      resize.observe(host);
      destroyRef.onDestroy(() => resize.disconnect());
    });
  }
}
