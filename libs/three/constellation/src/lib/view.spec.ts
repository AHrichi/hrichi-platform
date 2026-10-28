import { Euler, PerspectiveCamera, Vector3 } from 'three';
import { constellation, degrees, neighbourhood } from './graph';
import { nodeLinks, project, scopeColour, view } from './view';

describe('constellation graph', () => {
  it('only links projects that exist, and keeps every node inside the unit sphere', () => {
    const count = constellation.nodes.length;
    for (const [source, target] of constellation.edges) {
      expect(source).toBeLessThan(count);
      expect(target).toBeLessThan(count);
    }
    for (const node of constellation.nodes) {
      expect(Math.hypot(node.x, node.y, node.z)).toBeLessThanOrEqual(1.001);
    }
  });

  it('includes the shell, its federated remotes and the hero itself', () => {
    const ids = constellation.nodes.map((node) => node.id);
    expect(ids).toEqual(
      expect.arrayContaining(['shell', 'lab-hello', 'three-constellation']),
    );
    const shell = ids.indexOf('shell');
    expect(constellation.edges).toContainEqual([
      shell,
      ids.indexOf('lab-hello'),
      'federated',
    ]);
  });

  it('counts degrees and neighbourhoods from the edges', () => {
    const shell = constellation.nodes.findIndex((n) => n.id === 'shell');
    const around = neighbourhood(constellation, shell);

    expect(around.has(shell)).toBe(true);
    expect(around.size - 1).toBeLessThanOrEqual(degrees(constellation)[shell]);
  });

  it('links every app that has a page', () => {
    for (const id of Object.keys(nodeLinks)) {
      expect(nodeLinks[id]).toMatch(/^(\/|https?:\/\/)/);
    }
    expect(scopeColour('portfolio')).toBe('color-data-1');
    expect(scopeColour('lab-anything')).toBe('color-data-7');
  });
});

describe('project', () => {
  it('matches the WebGL camera, so the SVG poster equals the first frame', () => {
    const camera = new PerspectiveCamera(view.fovDeg, view.aspect, 0.05, 100);
    camera.position.set(0, 0, view.distance);
    camera.updateMatrixWorld();
    const rotation = new Euler(view.tilt, view.yaw, 0);

    for (const node of constellation.nodes) {
      const expected = new Vector3(node.x, node.y, node.z)
        .applyEuler(rotation)
        .project(camera);
      const actual = project(node);

      // NDC to the SVG viewBox: x spans ±aspect, y is flipped.
      expect(actual.x).toBeCloseTo(expected.x * view.aspect, 6);
      expect(actual.y).toBeCloseTo(-expected.y, 6);
    }
  });

  it('shrinks farther points', () => {
    const near = project({ x: 0, y: 0, z: 0.5 }, 0, 0);
    const far = project({ x: 0, y: 0, z: -0.5 }, 0, 0);

    expect(near.scale).toBeGreaterThan(far.scale);
    expect(far.depth).toBeGreaterThan(near.depth);
  });
});
