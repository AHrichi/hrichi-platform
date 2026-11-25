import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { SerraI18n } from '../../i18n/serra-i18n';
import { type SciencePhoto, photoUrl } from '../../science/photos';
import { Icon } from '../icon/icon';

/**
 * A photo you can open large: the thumbnail is a button; it opens a modal
 * dialog with the photo fitted to the screen, a zoom (button, double-click
 * or double-tap) that lets you pan by scrolling or dragging, the caption and
 * the credit with a link to the full-size original. Escape, the close button
 * or a click on the backdrop closes it, and focus goes back to the photo.
 */
@Component({
  selector: 'sc-photo-viewer',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // A click on the backdrop lands on the dialog itself: it closes the
  // viewer (Escape and the close button do it from the keyboard).
  host: { '(click)': 'onDialogClick($event)' },
  template: `
    <button
      type="button"
      class="thumb"
      [attr.aria-label]="t().photoViewer.open + ': ' + caption()"
      (click)="show()"
    >
      <img
        [src]="url()"
        [width]="photo().width"
        [height]="photo().height"
        loading="lazy"
        decoding="async"
        alt=""
      />
      <span class="badge" aria-hidden="true"><sc-icon name="zoomIn" /></span>
    </button>

    <dialog
      #dialog
      class="viewer"
      [attr.aria-label]="caption()"
      (close)="onClosed()"
    >
      @if (isOpen()) {
        <div class="bar">
          <p class="title" dir="auto">{{ caption() }}</p>
          <button
            type="button"
            class="tool"
            [attr.aria-pressed]="zoomed()"
            (click)="toggleZoom()"
          >
            <sc-icon [name]="zoomed() ? 'zoomOut' : 'zoomIn'" />
            <span>{{
              zoomed() ? t().photoViewer.fit : t().photoViewer.zoom
            }}</span>
          </button>
          <button
            #closeButton
            type="button"
            class="tool"
            [attr.aria-label]="t().photoViewer.close"
            (click)="hide()"
          >
            <sc-icon name="close" />
          </button>
        </div>
        <!-- Zoomed, the stage scrolls: arrow keys, a drag or a swipe pan it. -->
        <div
          #stage
          class="stage"
          role="group"
          [attr.aria-label]="caption()"
          [class.is-zoomed]="zoomed()"
          [attr.tabindex]="zoomed() ? 0 : null"
          (dblclick)="toggleZoom($event)"
          (pointerdown)="startPan($event)"
          (pointermove)="pan($event)"
          (pointerup)="endPan()"
          (pointercancel)="endPan()"
        >
          <img
            [src]="url()"
            [width]="photo().width"
            [height]="photo().height"
            [alt]="caption()"
            draggable="false"
          />
        </div>
        <p class="credit" dir="auto">
          {{ t().science.photo }}:
          <a [href]="photo().page" target="_blank" rel="noopener noreferrer">{{
            photo().author
          }}</a>
          ·
          @if (photo().licenseUrl; as licence) {
            <a [href]="licence" target="_blank" rel="noopener noreferrer">{{
              photo().license
            }}</a>
          } @else {
            {{ photo().license }}
          }
          ·
          <a [href]="photo().page" target="_blank" rel="noopener noreferrer">{{
            t().photoViewer.original
          }}</a>
        </p>
      }
    </dialog>
  `,
  styleUrl: './photo-viewer.scss',
})
export class PhotoViewer {
  readonly photo = input.required<SciencePhoto>();
  /** What the photo shows: its accessible name and the dialog's title. */
  readonly caption = input.required<string>();

  protected readonly t = inject(SerraI18n).t;
  protected readonly url = computed(() => photoUrl(this.photo()));
  protected readonly isOpen = signal(false);
  protected readonly zoomed = signal(false);
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  private readonly closeButton =
    viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private opener: HTMLElement | null = null;
  private drag: { x: number; y: number; left: number; top: number } | null =
    null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.unlockScroll());
  }

  protected show(): void {
    this.opener = document.activeElement as HTMLElement | null;
    this.zoomed.set(false);
    this.isOpen.set(true);
    this.dialog().nativeElement.showModal();
    document.documentElement.style.overflow = 'hidden';
    // The content renders on the next change detection: focus Close then.
    requestAnimationFrame(() => this.closeButton()?.nativeElement.focus());
  }

  protected hide(): void {
    this.dialog().nativeElement.close();
  }

  /** After any close (Escape included): tidy up and give focus back. */
  protected onClosed(): void {
    this.isOpen.set(false);
    this.zoomed.set(false);
    this.unlockScroll();
    this.opener?.focus();
    this.opener = null;
  }

  /** A click on the backdrop (the dialog itself, outside its content). */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.hide();
  }

  protected toggleZoom(event?: MouseEvent): void {
    const stage = this.stage()?.nativeElement;
    const zoomIn = !this.zoomed();
    // Zoom in around the point double-clicked, or the middle.
    const rect = stage?.getBoundingClientRect();
    const fx = rect && event ? (event.clientX - rect.left) / rect.width : 0.5;
    const fy = rect && event ? (event.clientY - rect.top) / rect.height : 0.5;
    this.zoomed.set(zoomIn);
    if (!zoomIn || !stage) return;
    requestAnimationFrame(() => {
      stage.scrollLeft = fx * stage.scrollWidth - stage.clientWidth / 2;
      stage.scrollTop = fy * stage.scrollHeight - stage.clientHeight / 2;
      stage.focus();
    });
  }

  /** Zoomed in with a mouse, dragging pans (touch pans natively). */
  protected startPan(event: PointerEvent): void {
    const stage = this.stage()?.nativeElement;
    if (!this.zoomed() || !stage || event.pointerType !== 'mouse') return;
    this.drag = {
      x: event.clientX,
      y: event.clientY,
      left: stage.scrollLeft,
      top: stage.scrollTop,
    };
    stage.setPointerCapture(event.pointerId);
  }

  protected pan(event: PointerEvent): void {
    const stage = this.stage()?.nativeElement;
    if (!this.drag || !stage) return;
    stage.scrollLeft = this.drag.left - (event.clientX - this.drag.x);
    stage.scrollTop = this.drag.top - (event.clientY - this.drag.y);
  }

  protected endPan(): void {
    this.drag = null;
  }

  private unlockScroll(): void {
    document.documentElement.style.removeProperty('overflow');
  }
}
