import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LineSegments,
  Mesh,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';
import { lightTheme } from '@ah/design-system/tokens';
import {
  createStage,
  type SceneController,
  type SceneInit,
  type SceneModule,
} from '@ah/three/engine';
import {
  constellation,
  type ConstellationParams,
  degrees,
  neighbourhood,
  nodeLinks,
  nodeRadius,
  scopeColour,
  view,
} from '@ah/three/constellation';
import {
  edgeFragment,
  edgeVertex,
  nodeFragment,
  nodeVertex,
  starFragment,
  starVertex,
} from './shaders';

const edgeKinds = { static: 0, dynamic: 1, implicit: 2, federated: 3 } as const;
/** Radians per second of idle drift. */
const driftSpeed = 0.07;

/**
 * The hero scene: this repository's Nx graph as glowing nodes with
 * dependency pulses (ADR-0011). Hover a project to see its tags and
 * neighbours; click an app to open it.
 */
export async function createScene({
  canvas,
  tier,
  params,
  events,
}: SceneInit<ConstellationParams>): Promise<
  SceneController<ConstellationParams>
> {
  const stage = createStage({ canvas, tier, fov: view.fovDeg });
  stage.camera.position.set(0, 0, view.distance);

  const { nodes, edges } = constellation;
  const degree = degrees(constellation);
  const colours = nodes.map(
    (node) => new Color(lightTheme[scopeColour(node.scope)]),
  );
  const radii = nodes.map((node, i) => nodeRadius(node, degree[i]));

  const graph = new Group();
  graph.rotation.set(view.tilt, view.yaw, 0);
  stage.scene.add(graph);

  // Nodes: one instanced draw call.
  const quad = new PlaneGeometry(1, 1);
  const nodeGeometry = new InstancedBufferGeometry();
  nodeGeometry.index = quad.index;
  nodeGeometry.setAttribute('position', quad.getAttribute('position'));
  nodeGeometry.setAttribute('uv', quad.getAttribute('uv'));
  nodeGeometry.instanceCount = nodes.length;
  nodeGeometry.setAttribute(
    'aOffset',
    new InstancedBufferAttribute(
      Float32Array.from(nodes.flatMap((n) => [n.x, n.y, n.z])),
      3,
    ),
  );
  nodeGeometry.setAttribute(
    'aColor',
    new InstancedBufferAttribute(
      Float32Array.from(colours.flatMap((c) => c.toArray())),
      3,
    ),
  );
  nodeGeometry.setAttribute(
    'aRadius',
    new InstancedBufferAttribute(Float32Array.from(radii), 1),
  );
  const nodeFocus = new InstancedBufferAttribute(
    new Float32Array(nodes.length),
    1,
  );
  nodeGeometry.setAttribute('aFocus', nodeFocus);

  const uniforms = { uTime: { value: 0 }, uFocus: { value: 0 } };
  const glow = {
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  } as const;
  const nodeMesh = new Mesh(
    nodeGeometry,
    new ShaderMaterial({
      ...glow,
      uniforms,
      vertexShader: nodeVertex,
      fragmentShader: nodeFragment,
    }),
  );
  // Instances are offset in the shader, so the quad's bounds mean nothing.
  nodeMesh.frustumCulled = false;
  graph.add(nodeMesh);

  // Edges: two vertices each, with a parameter running from dependent to dependency.
  const edgeGeometry = new BufferGeometry();
  const at = (i: number) => [nodes[i].x, nodes[i].y, nodes[i].z];
  edgeGeometry.setAttribute(
    'position',
    new BufferAttribute(
      Float32Array.from(edges.flatMap(([s, t]) => [...at(s), ...at(t)])),
      3,
    ),
  );
  edgeGeometry.setAttribute(
    'aT',
    new BufferAttribute(Float32Array.from(edges.flatMap(() => [0, 1])), 1),
  );
  edgeGeometry.setAttribute(
    'aColor',
    new BufferAttribute(
      Float32Array.from(
        edges.flatMap(([s, t]) => [
          ...colours[s].toArray(),
          ...colours[t].toArray(),
        ]),
      ),
      3,
    ),
  );
  edgeGeometry.setAttribute(
    'aKind',
    new BufferAttribute(
      Float32Array.from(
        edges.flatMap(([, , kind]) => [edgeKinds[kind], edgeKinds[kind]]),
      ),
      1,
    ),
  );
  // Golden-ratio offsets keep pulses out of step without randomness.
  edgeGeometry.setAttribute(
    'aSeed',
    new BufferAttribute(
      Float32Array.from(
        edges.flatMap((_, i) => [(i * 0.618) % 1, (i * 0.618) % 1]),
      ),
      1,
    ),
  );
  const edgeFocus = new BufferAttribute(new Float32Array(edges.length * 2), 1);
  edgeGeometry.setAttribute('aFocus', edgeFocus);
  graph.add(
    new LineSegments(
      edgeGeometry,
      new ShaderMaterial({
        ...glow,
        uniforms,
        vertexShader: edgeVertex,
        fragmentShader: edgeFragment,
      }),
    ),
  );

  // A faint starfield behind the graph for depth.
  const starCount = tier === 'high' ? 420 : 180;
  const starPositions = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    // Deterministic points on a shell (golden-angle spiral, varied radius).
    const y = 1 - (2 * (i + 0.5)) / starCount;
    const r = Math.sqrt(1 - y * y);
    const theta = i * 2.399963;
    const distance = 5 + ((i * 7919) % 30) / 10;
    starPositions.set(
      [
        Math.cos(theta) * r * distance,
        y * distance,
        Math.sin(theta) * r * distance,
      ],
      i * 3,
    );
    starSizes[i] = 0.6 + ((i * 104729) % 100) / 70;
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute('position', new BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('aSize', new BufferAttribute(starSizes, 1));
  const stars = new Points(
    starGeometry,
    new ShaderMaterial({
      ...glow,
      uniforms: {
        uColor: { value: new Color(lightTheme['color-stage-muted']) },
        uPixelRatio: { value: stage.renderer.getPixelRatio() },
      },
      vertexShader: starVertex,
      fragmentShader: starFragment,
    }),
  );
  stage.scene.add(stars);

  // Focus: the hovered or highlighted project and its direct neighbours.
  let hovered: number | null = null;
  let highlighted = indexOf(params.highlight);
  let focusTarget = 0;

  function applyFocus(): void {
    const focus = hovered ?? highlighted;
    const lit =
      focus === null ? new Set<number>() : neighbourhood(constellation, focus);
    nodes.forEach((_, i) =>
      nodeFocus.setX(i, i === focus ? 1 : lit.has(i) ? 0.75 : 0),
    );
    edges.forEach(([s, t], i) => {
      const on = focus !== null && (s === focus || t === focus) ? 1 : 0;
      edgeFocus.setX(i * 2, on);
      edgeFocus.setX(i * 2 + 1, on);
    });
    nodeFocus.needsUpdate = true;
    edgeFocus.needsUpdate = true;
    focusTarget = focus === null ? 0 : 1;
    canvas.style.cursor =
      hovered !== null && nodeLinks[nodes[hovered].id] ? 'pointer' : '';
  }
  applyFocus();

  // Pointer: parallax, picking and clicks.
  const pointer = { x: 0, y: 0, inside: false, dirty: false };
  const onMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.inside = true;
    pointer.dirty = true;
  };
  const onLeave = () => {
    pointer.inside = false;
    if (hovered !== null) {
      hovered = null;
      applyFocus();
      events.hover(null);
    }
  };
  const onClick = (event: PointerEvent) => {
    onMove(event);
    pick();
    const href = hovered === null ? undefined : nodeLinks[nodes[hovered].id];
    if (href) {
      events.navigate(href);
    }
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);

  const world = new Vector3();
  /** Screen position (CSS px) and on-screen core radius of node i. */
  function screen(i: number) {
    world
      .set(nodes[i].x, nodes[i].y, nodes[i].z)
      .applyMatrix4(graph.matrixWorld);
    const depth = stage.camera.position.z - world.z;
    world.project(stage.camera);
    const pixelsPerUnit =
      stage.height / 2 / (depth * Math.tan((view.fovDeg * Math.PI) / 360));
    return {
      x: ((world.x + 1) / 2) * stage.width,
      y: ((1 - world.y) / 2) * stage.height,
      radius: radii[i] * pixelsPerUnit,
    };
  }

  function pick(): void {
    pointer.dirty = false;
    let best: number | null = null;
    let bestDistance = Infinity;
    if (pointer.inside) {
      nodes.forEach((_, i) => {
        const s = screen(i);
        const distance = Math.hypot(s.x - pointer.x, s.y - pointer.y);
        if (
          distance < Math.max(s.radius * 1.8, 12) &&
          distance < bestDistance
        ) {
          best = i;
          bestDistance = distance;
        }
      });
    }
    if (best !== hovered) {
      hovered = best;
      applyFocus();
      if (best === null) {
        events.hover(null);
      }
    }
  }

  let lastLabel = '';
  function reportLabel(): void {
    const focus = hovered ?? highlighted;
    if (focus === null) {
      lastLabel = '';
      return;
    }
    const node = nodes[focus];
    const s = screen(focus);
    const key = `${focus}:${Math.round(s.x)}:${Math.round(s.y)}`;
    if (key !== lastLabel) {
      lastLabel = key;
      events.hover({
        id: node.id,
        label: node.id,
        detail: `${node.kind === 'e2e' ? 'e2e tests' : node.kind} · ${node.scope} · ${degree[focus]} links`,
        href: nodeLinks[node.id],
        x: s.x,
        y: s.y - s.radius - 6,
      });
    }
  }

  let drift = 0;
  let driftRate = 1;
  const parallax = { x: 0, y: 0 };
  stage.onFrame(({ time, delta }) => {
    uniforms.uTime.value = time;
    uniforms.uFocus.value +=
      (focusTarget - uniforms.uFocus.value) * Math.min(1, delta * 6);
    // Hold still while something is focused, so its label stays put.
    driftRate +=
      ((hovered ?? highlighted) === null ? 1 - driftRate : -driftRate) *
      Math.min(1, delta * 4);
    drift += delta * driftSpeed * driftRate;
    const targetX = pointer.inside
      ? (pointer.y / stage.height - 0.5) * 0.18
      : 0;
    const targetY = pointer.inside ? (pointer.x / stage.width - 0.5) * 0.3 : 0;
    parallax.x += (targetX - parallax.x) * Math.min(1, delta * 3);
    parallax.y += (targetY - parallax.y) * Math.min(1, delta * 3);
    graph.rotation.set(
      view.tilt + parallax.x,
      view.yaw + drift + parallax.y,
      0,
    );
    stars.rotation.y = drift * 0.3;
    graph.updateMatrixWorld();
    if (pointer.dirty) {
      pick();
    }
    reportLabel();
  });

  // Compile every shader before the first visible frame, without blocking.
  await stage.renderer.compileAsync(stage.scene, stage.camera);
  stage.renderNow();
  stage.setAnimating(true);

  return {
    update(next) {
      const index = indexOf(next.highlight);
      if (index !== highlighted) {
        highlighted = index;
        applyFocus();
        if (index === null && hovered === null) {
          events.hover(null);
        }
      }
    },
    dispose() {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      stage.dispose();
    },
  };
}

function indexOf(id: string | null): number | null {
  const index =
    id === null ? -1 : constellation.nodes.findIndex((node) => node.id === id);
  return index === -1 ? null : index;
}

/** Lets hosts type-check the lazy import: `import('@ah/three/scenes/constellation')`. */
export const constellationScene: SceneModule<ConstellationParams> = {
  createScene,
};
