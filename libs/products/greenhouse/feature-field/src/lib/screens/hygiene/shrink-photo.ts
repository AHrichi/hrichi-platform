/** The longest side of a stored photo: enough to see a dirty crate. */
export const PHOTO_MAX_SIDE = 1600;

/** JPEG quality for stored photos. */
const QUALITY = 0.8;

/** How big a box of `width` × `height` becomes with its longest side capped. */
export function fitWithin(
  width: number,
  height: number,
  maxSide = PHOTO_MAX_SIDE,
): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height, 1));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * A phone photo made small enough to keep offline and send on a weak
 * signal (a few hundred kB instead of several MB): at most 1600 px on its
 * longest side, as JPEG. Browsers without the APIs keep the original,
 * which the bucket still takes up to 5 MB.
 */
export async function shrinkPhoto(file: Blob): Promise<Blob> {
  if (
    typeof createImageBitmap !== 'function' ||
    typeof document === 'undefined'
  ) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}
