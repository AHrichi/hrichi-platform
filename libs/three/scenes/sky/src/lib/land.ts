import { CanvasTexture, LinearFilter } from 'three';
import { feature } from 'topojson-client';
import type { MultiPolygon, Polygon } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import land from 'world-atlas/land-110m.json';

/**
 * Natural Earth's land outlines (public domain, via world-atlas), drawn into
 * an equirectangular mask: red = 1 on land. The globe's shader turns it into
 * dots, so the low-resolution outline is plenty and nothing is downloaded.
 */
export function landMask(document: Document, width = 1024): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width / 2;
  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f00';

  const topology = land as unknown as Topology<{ land: GeometryCollection }>;
  const shapes = feature(topology, topology.objects.land);
  const x = (lon: number) => ((lon + 180) / 360) * canvas.width;
  const y = (lat: number) => ((90 - lat) / 180) * canvas.height;

  for (const shape of shapes.features) {
    const geometry = shape.geometry as Polygon | MultiPolygon;
    const polygons =
      geometry.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry.coordinates;
    for (const rings of polygons) {
      context.beginPath();
      for (const ring of rings) {
        ring.forEach(([lon, lat], i) =>
          i === 0
            ? context.moveTo(x(lon), y(lat))
            : context.lineTo(x(lon), y(lat)),
        );
        context.closePath();
      }
      context.fill('evenodd');
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}
