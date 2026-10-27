import {
  BufferGeometry,
  DataTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  Points,
  ShaderMaterial,
} from 'three';
import { disposeObject } from './dispose';

describe('disposeObject', () => {
  it('disposes nested geometries, materials and their textures', () => {
    const map = new DataTexture();
    const uniformTexture = new DataTexture();
    const meshGeometry = new BufferGeometry();
    const pointsGeometry = new BufferGeometry();
    const basic = new MeshBasicMaterial({ map });
    const shader = new ShaderMaterial({
      uniforms: { uTexture: { value: uniformTexture } },
    });
    const root = new Group();
    const child = new Group();
    root.add(child);
    child.add(new Mesh(meshGeometry, [basic, shader]));
    root.add(new Points(pointsGeometry, shader));

    const disposed = [
      map,
      uniformTexture,
      meshGeometry,
      pointsGeometry,
      basic,
      shader,
    ].map((resource) => {
      const listener = vi.fn();
      resource.addEventListener('dispose', listener);
      return listener;
    });

    disposeObject(root);

    for (const listener of disposed) {
      expect(listener).toHaveBeenCalled();
    }
  });
});
