/**
 * Page dimensions in millimeters for supported page sizes
 */
export const PAGE_DIMENSIONS = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 215.9, height: 279.4 },
} as const;

/**
 * Convert millimeters to pixels at 96 DPI (standard screen resolution)
 */
export function mmToPx(mm: number): number {
  return (mm / 25.4) * 96;
}

/**
 * Convert pixels to millimeters at 96 DPI
 */
export function pxToMm(px: number): number {
  return (px * 25.4) / 96;
}
