/** Soft gradient border: accent fades left → transparent right. */
/** Default shell padding (border width) used across screens: 1.5 */

export function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map(c => c + c)
          .join('')
      : raw;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Border colors: light accent → clear. */
export function softBorderColors(
  accentHex: string,
  opacity = 0.4,
): [string, string] {
  return [hexToRgba(accentHex, opacity), 'transparent'];
}

export const SOFT_BORDER_START = {x: 0, y: 0} as const;
export const SOFT_BORDER_END = {x: 1, y: 0} as const;
