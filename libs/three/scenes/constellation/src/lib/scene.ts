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
  type GraphEdge,
  type GraphNode,
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

function computeDegrees(nodeCount: number, edges: GraphEdge[]): number[] {
  const counts = new Array(nodeCount).fill(0);
  for (const [source, target] of edges) {
    if (source < nodeCount) counts[source]++;
    if (target < nodeCount) counts[target]++;
  }
  return counts;
}

function computeColours(nodes: GraphNode[]): Color[] {
  return nodes.map((node) => new Color(lightTheme[scopeColour(node.scope)]));
}

function computeRadii(nodes: GraphNode[], degs: number[]): number[] {
  return nodes.map((node, i) => nodeRadius(node, degs[i] ?? 0));
}

function buildNodeGeometry(
  quad: PlaneGeometry,
  nodes: GraphNode[],
  colours: Color[],
  radii: number[],
): { geometry: InstancedBufferGeometry; focusAttr: InstancedBufferAttribute } {
  const geom = new InstancedBufferGeometry();
  geom.index = quad.index;
  geom.setAttribute('position', quad.getAttribute('position'));
  geom.setAttribute('uv', quad.getAttribute('uv'));
  geom.instanceCount = nodes.length;
  geom.setAttribute(
    'aOffset',
    new InstancedBufferAttribute(
      Float32Array.from(nodes.flatMap((n) => [n.x, n.y, n.z])),
      3,
    ),
  );
  geom.setAttribute(
    'aColor',
    new InstancedBufferAttribute(
      Float32Array.from(colours.flatMap((c) => c.toArray())),
      3,
    ),
  );
  geom.setAttribute(
    'aRadius',
    new InstancedBufferAttribute(Float32Array.from(radii), 1),
  );
  const focusAttr = new InstancedBufferAttribute(
    new Float32Array(nodes.length),
    1,
  );
  geom.setAttribute('aFocus', focusAttr);
  return { geometry: geom, focusAttr };
}

function buildEdgeGeometry(
  nodes: GraphNode[],
  edges: GraphEdge[],
  colours: Color[],
): { geometry: BufferGeometry; focusAttr: BufferAttribute } {
  const geom = new BufferGeometry();
  const at = (i: number) => {
    const node = nodes[i];
    return node ? [node.x, node.y, node.z] : [0, 0, 0];
  };
  geom.setAttribute(
    'position',
    new BufferAttribute(
      Float32Array.from(edges.flatMap(([s, t]) => [...at(s), ...at(t)])),
      3,
    ),
  );
  geom.setAttribute(
    'aT',
    new BufferAttribute(Float32Array.from(edges.flatMap(() => [0, 1])), 1),
  );
  geom.setAttribute(
    'aColor',
    new BufferAttribute(
      Float32Array.from(
        edges.flatMap(([s, t]) => [
          ...(colours[s] ?? new Color(1, 1, 1)).toArray(),
          ...(colours[t] ?? new Color(1, 1, 1)).toArray(),
        ]),
      ),
      3,
    ),
  );
  geom.setAttribute(
    'aKind',
    new BufferAttribute(
      Float32Array.from(
        edges.flatMap(([, , kind]) => [
          edgeKinds[kind] ?? 0,
          edgeKinds[kind] ?? 0,
        ]),
      ),
      1,
    ),
  );
  geom.setAttribute(
    'aSeed',
    new BufferAttribute(
      Float32Array.from(
        edges.flatMap((_, i) => [(i * 0.618) % 1, (i * 0.618) % 1]),
      ),
      1,
    ),
  );
  const focusAttr = new BufferAttribute(new Float32Array(edges.length * 2), 1);
  geom.setAttribute('aFocus', focusAttr);
  return { geometry: geom, focusAttr };
}

/**
 * The hero scene: this repository's Nx graph as glowing nodes with
 * dependency pulses (ADR-0011). Fully interactive 360° spin, touch/drag orbit,
 * dynamic part addition/removal and layer filtering.
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

  let currentNodes = params.nodes ?? constellation.nodes;
  let currentEdges = params.edges ?? constellation.edges;
  let currentDegrees = computeDegrees(currentNodes.length, currentEdges);
  let currentColours = computeColours(currentNodes);
  let currentRadii = computeRadii(currentNodes, currentDegrees);

  const graph = new Group();
  graph.rotation.set(view.tilt, view.yaw, 0);
  stage.scene.add(graph);

  const quad = new PlaneGeometry(1, 1);
  const uniforms = { uTime: { value: 0 }, uFocus: { value: 0 } };
  const glow = {
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  } as const;

  // Nodes instanced mesh
  let nodeGeoData = buildNodeGeometry(
    quad,
    currentNodes,
    currentColours,
    currentRadii,
  );
  let nodeFocus = nodeGeoData.focusAttr;
  const nodeMesh = new Mesh(
    nodeGeoData.geometry,
    new ShaderMaterial({
      ...glow,
      uniforms,
      vertexShader: nodeVertex,
      fragmentShader: nodeFragment,
    }),
  );
  nodeMesh.frustumCulled = false;
  graph.add(nodeMesh);

  // Edges lines mesh
  let edgeGeoData = buildEdgeGeometry(
    currentNodes,
    currentEdges,
    currentColours,
  );
  let edgeFocus = edgeGeoData.focusAttr;
  const edgeMesh = new LineSegments(
    edgeGeoData.geometry,
    new ShaderMaterial({
      ...glow,
      uniforms,
      vertexShader: edgeVertex,
      fragmentShader: edgeFragment,
    }),
  );
  edgeMesh.visible = params.showEdges ?? true;
  graph.add(edgeMesh);

  // Starfield
  const starCount = tier === 'high' ? 420 : 180;
  const starPositions = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
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
  stars.visible = params.showStars ?? true;
  stage.scene.add(stars);

  // Focus & selection state
  let hovered: number | null = null;
  let highlighted = indexOf(params.highlight, currentNodes);
  let focusTarget = 0;

  function applyFocus(): void {
    const focus = hovered ?? highlighted;
    const lit = new Set<number>();
    if (focus !== null) {
      lit.add(focus);
      for (const [s, t] of currentEdges) {
        if (s === focus) lit.add(t);
        if (t === focus) lit.add(s);
      }
    }
    currentNodes.forEach((_, i) =>
      nodeFocus.setX(i, i === focus ? 1 : lit.has(i) ? 0.75 : 0),
    );
    currentEdges.forEach(([s, t], i) => {
      const on = focus !== null && (s === focus || t === focus) ? 1 : 0;
      edgeFocus.setX(i * 2, on);
      edgeFocus.setX(i * 2 + 1, on);
    });
    nodeFocus.needsUpdate = true;
    edgeFocus.needsUpdate = true;
    focusTarget = focus === null ? 0 : 1;
    canvas.style.cursor = isDragging
      ? 'grabbing'
      : hovered !== null
        ? 'pointer'
        : 'grab';
  }
  applyFocus();

  // Full 3D Interactive Orbit, Spin & Gesture Controls
  let rotX: number = view.tilt;
  let rotY: number = view.yaw;
  let targetRotX: number = view.tilt;
  let targetRotY: number = view.yaw;
  let velX = 0;
  let velY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let lastDragX = 0;
  let lastDragY = 0;
  let lastDragTime = 0;
  let hasDragged = false;
  let spinVelocity = 0;
  let currentZoom: number = view.distance;
  let targetZoom: number = view.distance;
  let pinchDistanceStart: number | null = null;
  let zoomStart: number = view.distance;

  const pointer = { x: 0, y: 0, inside: false, dirty: false };

  const onDown = (event: PointerEvent) => {
    isDragging = true;
    hasDragged = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    lastDragX = event.clientX;
    lastDragY = event.clientY;
    lastDragTime = performance.now();
    velX = 0;
    velY = 0;
    spinVelocity = 0;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Ignore if not supported
    }
    applyFocus();
  };

  const onMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.inside = true;
    pointer.dirty = true;

    if (isDragging) {
      const dx = event.clientX - lastDragX;
      const dy = event.clientY - lastDragY;
      const totalMoved = Math.hypot(
        event.clientX - dragStartX,
        event.clientY - dragStartY,
      );
      if (totalMoved > 5) {
        hasDragged = true;
      }
      const now = performance.now();
      const dt = Math.max(1, now - lastDragTime);
      // Continuous 360-degree rotation sensitivity
      targetRotY += dx * 0.007;
      targetRotX = Math.max(
        -Math.PI * 0.44,
        Math.min(Math.PI * 0.44, targetRotX + dy * 0.007),
      );
      velY = (dx / dt) * 16;
      velX = (dy / dt) * 16;
      lastDragX = event.clientX;
      lastDragY = event.clientY;
      lastDragTime = now;
    }
  };

  const onUp = (event: PointerEvent) => {
    if (isDragging) {
      isDragging = false;
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore
      }
      if (hasDragged) {
        // Apply flick momentum with gentle speed limits
        velY = Math.max(-1.4, Math.min(1.4, velY * 0.06));
        velX = Math.max(-0.9, Math.min(0.9, velX * 0.06));
      }
      applyFocus();
    }
  };

  const onLeave = () => {
    pointer.inside = false;
    if (hovered !== null && !isDragging) {
      hovered = null;
      applyFocus();
      events.hover(null);
    }
  };

  const onClick = (event: PointerEvent) => {
    if (hasDragged) {
      hasDragged = false;
      return;
    }
    onMove(event);
    pick();
    const focus = hovered ?? highlighted;
    if (focus !== null && currentNodes[focus]) {
      const node = currentNodes[focus];
      events.select(node.id);
      const href = nodeLinks[node.id];
      if (href) {
        events.navigate(href);
      }
    }
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    targetZoom = Math.max(
      1.8,
      Math.min(5.5, targetZoom + event.deltaY * 0.0025),
    );
  };

  // Touch pinch-to-zoom
  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 2) {
      const t1 = event.touches[0];
      const t2 = event.touches[1];
      pinchDistanceStart = Math.hypot(
        t1.clientX - t2.clientX,
        t1.clientY - t2.clientY,
      );
      zoomStart = targetZoom;
    }
  };

  const onTouchMove = (event: TouchEvent) => {
    if (event.touches.length === 2 && pinchDistanceStart !== null) {
      const t1 = event.touches[0];
      const t2 = event.touches[1];
      const currentDist = Math.hypot(
        t1.clientX - t2.clientX,
        t1.clientY - t2.clientY,
      );
      const factor = pinchDistanceStart / Math.max(1, currentDist);
      targetZoom = Math.max(1.8, Math.min(5.5, zoomStart * factor));
    }
  };

  const onTouchEnd = () => {
    pinchDistanceStart = null;
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchmove', onTouchMove, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd, { passive: true });

  const world = new Vector3();
  /** Screen position (CSS px) and on-screen core radius of node i. */
  function screen(i: number) {
    if (i >= currentNodes.length) return { x: -9999, y: -9999, radius: 0 };
    world
      .set(currentNodes[i].x, currentNodes[i].y, currentNodes[i].z)
      .applyMatrix4(graph.matrixWorld);
    const depth = stage.camera.position.z - world.z;
    world.project(stage.camera);
    const pixelsPerUnit =
      stage.height / 2 / (depth * Math.tan((view.fovDeg * Math.PI) / 360));
    return {
      x: ((world.x + 1) / 2) * stage.width,
      y: ((1 - world.y) / 2) * stage.height,
      radius: (currentRadii[i] ?? 0.03) * pixelsPerUnit,
    };
  }

  function pick(): void {
    pointer.dirty = false;
    let best: number | null = null;
    let bestDistance = Infinity;
    if (pointer.inside) {
      currentNodes.forEach((_, i) => {
        const s = screen(i);
        const distance = Math.hypot(s.x - pointer.x, s.y - pointer.y);
        if (
          distance < Math.max(s.radius * 2.0, 14) &&
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
    if (focus === null || focus >= currentNodes.length) {
      lastLabel = '';
      return;
    }
    const node = currentNodes[focus];
    const s = screen(focus);
    const key = `${focus}:${Math.round(s.x)}:${Math.round(s.y)}`;
    if (key !== lastLabel) {
      lastLabel = key;
      const hasLink = Boolean(nodeLinks[node.id]);
      const deg = currentDegrees[focus] ?? 0;
      events.hover({
        id: node.id,
        label: node.id,
        detail: `${node.kind === 'e2e' ? 'e2e tests' : node.kind} · ${node.scope} · ${deg} links${hasLink ? ' · Click to open' : ''}`,
        href: nodeLinks[node.id],
        x: s.x,
        y: s.y - s.radius - 6,
      });
    }
  }

  let drift = 0;
  let driftRate = 1;
  let lastSpinCount = params.spinCount ?? 0;
  let lastResetCount = params.resetCount ?? 0;

  stage.onFrame(({ time, delta }) => {
    uniforms.uTime.value = time;
    uniforms.uFocus.value +=
      (focusTarget - uniforms.uFocus.value) * Math.min(1, delta * 6);

    // Full 360 spin animation boost
    if (spinVelocity > 0.05) {
      const step = spinVelocity * delta;
      targetRotY += step;
      spinVelocity *= Math.pow(0.55, delta * 4);
    }

    // Momentum damping and idle drift
    if (!isDragging) {
      targetRotY += velY * delta * 15;
      targetRotX = Math.max(
        -Math.PI * 0.44,
        Math.min(Math.PI * 0.44, targetRotX + velX * delta * 15),
      );
      velX *= Math.pow(0.88, delta * 60);
      velY *= Math.pow(0.88, delta * 60);

      // Idle drift when not being spun or dragged
      if (Math.hypot(velX, velY) < 0.01 && spinVelocity <= 0.05) {
        driftRate +=
          ((hovered ?? highlighted) === null ? 1 - driftRate : -driftRate) *
          Math.min(1, delta * 4);
        drift += delta * driftSpeed * driftRate;
      }
    }

    rotX += (targetRotX - rotX) * Math.min(1, delta * 12);
    rotY += (targetRotY + drift - rotY) * Math.min(1, delta * 12);
    currentZoom += (targetZoom - currentZoom) * Math.min(1, delta * 8);

    stage.camera.position.z = currentZoom;
    graph.rotation.set(rotX, rotY, 0);
    stars.rotation.y = rotY * 0.25;
    graph.updateMatrixWorld();

    if (pointer.dirty) {
      pick();
    }
    reportLabel();
  });

  // Precompile shaders
  await stage.renderer.compileAsync(stage.scene, stage.camera);
  stage.renderNow();
  stage.setAnimating(true);

  return {
    update(next) {
      // Check for node/edge geometry changes (adding or removing parts)
      const nextNodes = next.nodes ?? constellation.nodes;
      const nextEdges = next.edges ?? constellation.edges;
      const nodesChanged = nextNodes !== currentNodes;
      const edgesChanged = nextEdges !== currentEdges;

      if (nodesChanged || edgesChanged) {
        currentNodes = nextNodes;
        currentEdges = nextEdges;
        currentDegrees = computeDegrees(currentNodes.length, currentEdges);
        currentColours = computeColours(currentNodes);
        currentRadii = computeRadii(currentNodes, currentDegrees);

        // Rebuild node geometry
        nodeMesh.geometry.dispose();
        nodeGeoData = buildNodeGeometry(
          quad,
          currentNodes,
          currentColours,
          currentRadii,
        );
        nodeMesh.geometry = nodeGeoData.geometry;
        nodeFocus = nodeGeoData.focusAttr;
        nodeMesh.visible = currentNodes.length > 0;

        // Rebuild edge geometry
        edgeMesh.geometry.dispose();
        edgeGeoData = buildEdgeGeometry(
          currentNodes,
          currentEdges,
          currentColours,
        );
        edgeMesh.geometry = edgeGeoData.geometry;
        edgeFocus = edgeGeoData.focusAttr;
      }

      if (next.showEdges !== undefined) {
        edgeMesh.visible = next.showEdges && currentEdges.length > 0;
      }

      if (next.showStars !== undefined) {
        stars.visible = next.showStars;
      }

      // Trigger 360 spin
      if (next.spinCount !== undefined && next.spinCount !== lastSpinCount) {
        lastSpinCount = next.spinCount;
        spinVelocity = 14; // Fast, exciting full spin
      }

      // Trigger reset view
      if (next.resetCount !== undefined && next.resetCount !== lastResetCount) {
        lastResetCount = next.resetCount;
        targetRotX = view.tilt;
        targetRotY = view.yaw;
        targetZoom = view.distance;
        velX = 0;
        velY = 0;
        spinVelocity = 0;
        drift = 0;
      }

      // Highlight update
      const index = indexOf(next.highlight, currentNodes);
      if (index !== highlighted) {
        highlighted = index;
        applyFocus();
        if (index === null && hovered === null) {
          events.hover(null);
        }
      } else if (nodesChanged || edgesChanged) {
        applyFocus();
      }
    },
    dispose() {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      nodeMesh.geometry.dispose();
      edgeMesh.geometry.dispose();
      starGeometry.dispose();
      quad.dispose();
      stage.dispose();
    },
  };
}

function indexOf(id: string | null, nodes: GraphNode[]): number | null {
  const index = id === null ? -1 : nodes.findIndex((node) => node.id === id);
  return index === -1 ? null : index;
}

export const constellationScene: SceneModule<ConstellationParams> = {
  createScene,
};
