import type { Material, Object3D, Texture } from 'three';

interface Disposable {
  dispose(): void;
}

function isTexture(value: unknown): value is Texture {
  return (value as Texture | null)?.isTexture === true;
}

/** Disposes a material and every texture it references, uniforms included. */
export function disposeMaterial(material: Material): void {
  for (const value of Object.values(material)) {
    if (isTexture(value)) {
      value.dispose();
    }
  }
  const uniforms = (
    material as { uniforms?: Record<string, { value: unknown }> }
  ).uniforms;
  for (const uniform of Object.values(uniforms ?? {})) {
    if (isTexture(uniform.value)) {
      uniform.value.dispose();
    }
  }
  material.dispose();
}

/**
 * Frees the GPU memory held by everything under `root`: geometries,
 * materials and their textures. Three.js never does this on its own, so a
 * route change without it leaks GPU memory.
 */
export function disposeObject(root: Object3D): void {
  root.traverse((object) => {
    const { geometry, material } = object as Object3D & {
      geometry?: Disposable;
      material?: Material | Material[];
    };
    geometry?.dispose();
    for (const each of [material ?? []].flat()) {
      disposeMaterial(each);
    }
  });
}
