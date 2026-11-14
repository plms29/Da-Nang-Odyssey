export type Bounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

/**
 * Clamps a 2D (x, z) position inside an axis-aligned rectangular room
 * inset by the given collision radius.
 */
export function clampToBounds(
  x: number,
  z: number,
  b: Bounds,
  radius = 0.4,
): { x: number; z: number } {
  const r = Math.max(0, radius);
  const loX = b.minX + r;
  const hiX = b.maxX - r;
  const loZ = b.minZ + r;
  const hiZ = b.maxZ - r;

  const clampedX =
    loX > hiX ? (b.minX + b.maxX) / 2 : Math.min(hiX, Math.max(loX, x));
  const clampedZ =
    loZ > hiZ ? (b.minZ + b.maxZ) / 2 : Math.min(hiZ, Math.max(loZ, z));

  return { x: clampedX, z: clampedZ };
}
