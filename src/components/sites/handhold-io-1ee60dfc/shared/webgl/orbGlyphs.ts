/**
 * Extracted verbatim from handhold.io's own "Orb" component
 * (_next/static/chunks/38fy23p0s7esk.js, fetched 2026-08-13). Each state is
 * 8 blob positions (cx, cy) inside an SVG viewBox="-50 -50 100 100".
 *
 * The LISTENING glyph used here is the exact "decorative, no live audio"
 * resting position: the component blends its idle array (`c`) and its
 * active-listening array (`m`) 50/50 when no getInputFrequencyData is
 * supplied — which is always the case in this static/decorative usage.
 */

export type OrbState = "LISTENING" | "SPEAKING" | "THINKING";

interface BlobPosition {
  cx: number;
  cy: number;
  width: number;
}

const LISTENING_IDLE: BlobPosition[] = [
  { cx: 0.08, cy: -15.83, width: 9.91 },
  { cx: -10.9, cy: -9.74, width: 9.91 },
  { cx: 11.06, cy: -9.74, width: 9.91 },
  { cx: -15.15, cy: 0.02, width: 9.91 },
  { cx: 15.33, cy: 0.02, width: 9.91 },
  { cx: -10.9, cy: 9.77, width: 9.91 },
  { cx: 11.06, cy: 9.77, width: 9.91 },
  { cx: 0.08, cy: 15.86, width: 9.91 },
];

const LISTENING_ACTIVE: BlobPosition[] = [
  { cx: 0.08, cy: -10.95, width: 9.91 },
  { cx: -6.02, cy: -3.64, width: 9.91 },
  { cx: 6.18, cy: -3.64, width: 9.91 },
  { cx: -18.83, cy: 0.02, width: 9.91 },
  { cx: 18.97, cy: 0.02, width: 9.91 },
  { cx: -6.02, cy: 3.67, width: 9.91 },
  { cx: 6.18, cy: 3.67, width: 9.91 },
  { cx: 0.08, cy: 10.98, width: 9.91 },
];

// f = m + 0.5*(c - m), the exact resting blend used when decorative with no live mic input
const LISTENING: BlobPosition[] = LISTENING_IDLE.map((idle, i) => {
  const active = LISTENING_ACTIVE[i];
  return {
    cx: active.cx + 0.5 * (idle.cx - active.cx),
    cy: active.cy + 0.5 * (idle.cy - active.cy),
    width: active.width,
  };
});

const SPEAKING: BlobPosition[] = [
  { cx: 19.01, cy: -3.65, width: 9.91 },
  { cx: -5.98, cy: -3.65, width: 9.91 },
  { cx: 6.21, cy: -3.65, width: 9.91 },
  { cx: -18.79, cy: -3.65, width: 9.91 },
  { cx: 19.01, cy: 3.67, width: 9.91 },
  { cx: -5.98, cy: 3.67, width: 9.91 },
  { cx: 6.21, cy: 3.67, width: 9.91 },
  { cx: -18.79, cy: 3.67, width: 9.91 },
];

const THINKING: BlobPosition[] = [
  { cx: 4.35, cy: -17.06, width: 9.91 },
  { cx: -5.41, cy: -10.35, width: 9.91 },
  { cx: 4.35, cy: -3.64, width: 9.91 },
  { cx: -16.99, cy: -3.03, width: 9.91 },
  { cx: 17.47, cy: 3.06, width: 9.91 },
  { cx: -3.87, cy: 3.67, width: 9.91 },
  { cx: 5.89, cy: 10.38, width: 9.91 },
  { cx: -3.87, cy: 17.09, width: 9.91 },
];

export const ORB_GLYPHS: Record<OrbState, BlobPosition[]> = {
  LISTENING,
  SPEAKING,
  THINKING,
};

// Fixed rect geometry for every blob, extracted verbatim.
export const ORB_BLOB_HEIGHT = 3.69;
export const ORB_BLOB_RADIUS = 1.54;
export const ORB_BLOB_Y = -1.845;
export const ORB_VIEWBOX = "-50 -50 100 100";
