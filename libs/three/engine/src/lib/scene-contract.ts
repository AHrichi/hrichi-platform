import type { QualityTier } from '../quality';

/** What a scene reports back to its host page. */
export interface SceneEvents {
  /** The visitor picked something that links somewhere. */
  navigate(href: string): void;
  /** The pointer is over something worth labelling, or nothing (`null`). */
  hover(target: HoverTarget | null): void;
  /** The visitor clicked an object (by the scene's own id), or empty space. */
  select(id: string | null): void;
}

export interface HoverTarget {
  id: string;
  label: string;
  detail?: string;
  href?: string;
  /** Position in CSS pixels from the canvas' top-left corner. */
  x: number;
  y: number;
}

export interface SceneInit<P> {
  canvas: HTMLCanvasElement;
  tier: Exclude<QualityTier, 'off'>;
  params: P;
  events: SceneEvents;
}

export interface SceneController<P> {
  update(params: P): void;
  dispose(): void;
}

/**
 * A scene is a lazily imported module with one factory, so hosts (an Angular
 * component, a Storybook story) never import three themselves. The promise
 * resolves after the first frame is drawn.
 */
export interface SceneModule<P> {
  createScene(init: SceneInit<P>): Promise<SceneController<P>>;
}
