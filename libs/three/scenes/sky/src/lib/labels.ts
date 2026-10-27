export type LabelKind =
  'cardinal' | 'constellation' | 'star' | 'body' | 'shower';

const styles: Record<LabelKind, string> = {
  cardinal:
    'font-weight:700;font-size:13px;color:var(--color-data-2, #fcd34d);letter-spacing:0.08em',
  constellation:
    'font-size:10.5px;text-transform:uppercase;letter-spacing:0.14em;color:var(--color-stage-muted, #9a9aa3)',
  star: 'font-size:11px;color:var(--color-stage-text, #f7f7f8);opacity:0.75',
  body: 'font-size:12px;font-weight:600;color:var(--color-data-2, #fcd34d)',
  shower: 'font-size:11px;font-style:italic;color:var(--color-data-3, #5eead4)',
};

/**
 * Names drawn over the canvas as HTML, so they stay crisp and cost no GPU
 * time. Hidden from assistive technology: the page lists the same things.
 */
export class LabelLayer {
  private readonly root: HTMLDivElement;
  private readonly elements = new Map<string, HTMLSpanElement>();

  constructor(host: HTMLElement) {
    const document = host.ownerDocument;
    this.root = document.createElement('div');
    this.root.setAttribute('aria-hidden', 'true');
    this.root.style.cssText =
      'position:absolute;inset:0;pointer-events:none;overflow:hidden;font-family:inherit;line-height:1;white-space:nowrap';
    host.appendChild(this.root);
  }

  /** Shows a label at (x, y) CSS pixels, creating it on first use. */
  place(
    id: string,
    text: string,
    kind: LabelKind,
    x: number,
    y: number,
    selected = false,
  ): void {
    let element = this.elements.get(id);
    if (!element) {
      element = this.root.ownerDocument.createElement('span');
      element.style.cssText = `position:absolute;left:0;top:0;${styles[kind]}`;
      this.root.appendChild(element);
      this.elements.set(id, element);
    }
    if (element.textContent !== text) {
      element.textContent = text;
    }
    element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, ${kind === 'body' || kind === 'star' ? '-160%' : '-50%'})`;
    element.style.textShadow = selected
      ? '0 0 8px var(--color-data-2, #fcd34d)'
      : '0 1px 2px rgb(0 0 0 / 0.8)';
    element.hidden = false;
  }

  /** Hides every label not placed since the last call. */
  sweep(placed: Set<string>): void {
    for (const [id, element] of this.elements) {
      if (!placed.has(id)) {
        element.hidden = true;
      }
    }
  }

  setVisible(visible: boolean): void {
    this.root.hidden = !visible;
  }

  dispose(): void {
    this.root.remove();
  }
}
