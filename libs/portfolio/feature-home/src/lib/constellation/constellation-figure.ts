import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  constellation,
  type ConstellationParams,
  degrees,
  legend,
  nodeLinks,
  nodeRadius,
  project,
  scopeColour,
  viewBox,
} from '@ah/three/constellation';
import { SceneHost } from '@ah/three/angular';
import { PreferencesStore } from '@ah/shared/state';

/** What each linked project is called in the caption. */
const linkLabels: Record<string, string> = {
  shell: 'How this site is built',
  'product-strategy': 'Financial strategy dashboard',
  'product-dispatch': 'PulseOps · Commercial dispatch control center',
  'lab-rxjs': 'RxJS practice pad',
  'lab-sky': 'Sky lab',
  'lab-hello': 'Micro-frontend demo',
  'design-system': 'Design system & Storybook',
  api: 'The API behind the contact form',
};

const degree = degrees(constellation);
const placed = constellation.nodes.map((node, i) => {
  const point = project(node);
  return {
    ...node,
    ...point,
    r: nodeRadius(node, degree[i]) * point.scale,
    token: scopeColour(node.scope),
  };
});

/**
 * The hero figure: this repository's real Nx graph (ADR-0011). The SVG is
 * prerendered from the same layout and camera as the WebGL scene, so it is
 * the poster, the reduced-motion view and the no-JS view at once.
 */
@Component({
  selector: 'ah-constellation-figure',
  imports: [SceneHost, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './constellation-figure.html',
  styleUrl: './constellation-figure.scss',
})
export class ConstellationFigure {
  private readonly router = inject(Router);
  private readonly preferences = inject(PreferencesStore);

  protected readonly viewBox = viewBox;
  protected readonly legend = legend;
  protected readonly nodeLinks = nodeLinks;
  protected readonly projectCount = constellation.nodes.length;
  protected readonly dependencyCount = constellation.edges.length;
  protected readonly summary = `Graph of this website's ${this.projectCount} Nx projects and their ${this.dependencyCount} dependencies, coloured by scope.`;

  /** Farthest first, so nearer nodes paint over farther ones. */
  protected readonly nodes = [...placed].sort((a, b) => b.depth - a.depth);
  protected readonly edges = constellation.edges.map(([s, t, kind]) => ({
    x1: placed[s].x,
    y1: placed[s].y,
    x2: placed[t].x,
    y2: placed[t].y,
    kind,
    token: placed[s].token,
  }));
  protected readonly links = constellation.nodes
    .filter((node) => linkLabels[node.id])
    .map((node) => ({
      id: node.id,
      href: nodeLinks[node.id],
      isExternal: (nodeLinks[node.id] ?? '').startsWith('http'),
      label: linkLabels[node.id] ?? node.id,
    }));

  protected readonly highlight = signal<string | null>(null);
  protected readonly params = computed<ConstellationParams>(() => ({
    highlight: this.highlight(),
    theme: this.preferences.isDark() ? 'dark' : 'light',
  }));

  protected readonly loadScene = () =>
    import('@ah/three/scenes/constellation').then((m) => m.constellationScene);

  protected open(href: string): void {
    if (typeof window !== 'undefined' && href) {
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        void this.router.navigateByUrl(href);
      }
    }
  }
}
