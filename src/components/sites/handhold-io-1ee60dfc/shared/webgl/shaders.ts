/**
 * Extracted verbatim from handhold.io's own publicly-delivered client JS bundle
 * (_next/static/chunks/38fy23p0s7esk.js and 3wdpwtzrad8ci.js, fetched 2026-08-13).
 * This is the exact domain-warped simplex-noise gradient shader that drives the
 * hero wave and the three agent-showcase card backgrounds on the live site —
 * not a CSS/blur approximation.
 */

export const GRADIENT_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform float u_warpIntensity;
uniform float u_speed;
uniform float u_energy;
uniform float u_noiseScale;
uniform float u_aspectRatio;
uniform vec3 u_color0;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = v_uv;
  if (u_aspectRatio > 1.0) {
    uv.x *= u_aspectRatio;
  } else {
    uv.y /= u_aspectRatio;
  }
  float time = u_time * u_speed;
  float warp = u_warpIntensity;

  vec2 t1 = time * vec2(0.017, -0.013);
  vec2 t2 = time * vec2(-0.011, 0.019);
  float t3 = time * 0.015;

  vec2 q = vec2(
    snoise(uv * u_noiseScale + vec2(0.0, 0.0) + t1),
    snoise(uv * u_noiseScale + vec2(5.2, 1.3) + t1 * 0.8)
  );

  vec2 r = vec2(
    snoise(uv * u_noiseScale + warp * 0.65 * q + vec2(1.7, 9.2) + t2),
    snoise(uv * u_noiseScale + warp * 0.65 * q + vec2(8.3, 2.8) + t2 * 0.9)
  );

  float f = snoise(uv * u_noiseScale + warp * 0.65 * r + t3);

  float pattern = f * 0.5 + 0.48;
  pattern = clamp(pattern, 0.0, 1.0);

  float focusNoise = snoise(uv * u_noiseScale * 0.5 + vec2(4.3, 7.9) + t2 * 0.4);
  float sharpAmount = smoothstep(0.2, 0.6, focusNoise) * 0.5;

  float blueEdge = mix(0.45, 0.30, sharpAmount);
  float warmStart = mix(0.32, 0.42, sharpAmount);
  float warmEnd = mix(0.72, 0.60, sharpAmount);

  vec3 blue0 = mix(u_color0, vec3(dot(u_color0, vec3(0.299, 0.587, 0.114))), 0.12);
  vec3 warm2 = mix(u_color2, vec3(dot(u_color2, vec3(0.299, 0.587, 0.114))), 0.2);
  vec3 warm3 = mix(u_color3, vec3(dot(u_color3, vec3(0.299, 0.587, 0.114))), 0.35);

  vec3 color = mix(blue0, u_color1, smoothstep(0.05, blueEdge, pattern));
  vec3 warm = mix(warm2, warm3, smoothstep(0.65, 1.0, pattern));
  color = mix(color, warm, smoothstep(warmStart, warmEnd, pattern));

  float edgeGlow = smoothstep(0.2, 0.4, pattern) * smoothstep(0.85, 0.5, pattern);
  color = mix(color, vec3(1.0), edgeGlow * 0.25);

  float energyBoost = u_energy;
  vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
  color = mix(gray, color, 1.0 + energyBoost * 0.3);

  float diffMask1 = snoise(v_uv * 1.5 + vec2(13.7, 3.1) + t1 * 0.6);
  float diffMask2 = snoise(v_uv * 0.8 + vec2(6.2, 11.8) + t2 * 0.4);
  float diffuse = smoothstep(-0.1, 0.4, diffMask1) * smoothstep(-0.2, 0.3, diffMask2);
  vec3 diffColor = mix(color, vec3(1.0), 0.5);
  color = mix(color, diffColor, diffuse * 0.35);

  float colorMax = max(max(color.r, color.g), color.b);
  float colorSat = (colorMax - min(min(color.r, color.g), color.b)) / (colorMax + 0.001);
  float colorLight = dot(color, vec3(0.299, 0.587, 0.114));
  float lightBoost = (1.0 - colorSat) * smoothstep(0.5, 0.8, colorLight);
  float grainIntensity = 0.08 + lightBoost * 0.06;

  vec2 gUv = gl_FragCoord.xy;
  float g1 = snoise(gUv * 0.25 + u_time * 0.15);
  float g2 = snoise(gUv * 0.45 + u_time * -0.12);
  float grainProduct = g1 * g2;
  float grainRaw = sign(grainProduct) * max(0.0, abs(grainProduct) - 0.02) * 2.5;
  vec3 grainTarget = color + vec3(0.08, 0.08, 0.07);
  color = mix(color, grainTarget, max(0.0, grainRaw) * grainIntensity * 15.0);

  color = clamp(color, 0.0, 1.0);
  fragColor = vec4(color, 1.0);
}
`;

/** Raw-WebGL2 fullscreen-quad vertex shader (used by the flat card panels). */
export const QUAD_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/** Three.js vertex shader (used by the hero ribbon mesh — standard position/uv attrs). */
export const RIBBON_VERTEX_SHADER = `
out vec2 v_uv;
void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export enum GradientPalette {
  YELLOW = "YELLOW",
  BLUE = "BLUE",
  GREEN = "GREEN",
  RED = "RED",
  ORANGE = "ORANGE",
}

export const PALETTE_COLORS: Record<GradientPalette, [number, number, number][]> = {
  YELLOW: [
    [0.173, 0.545, 1],
    [0.94, 0.935, 0.9],
    [0.98, 0.92, 0.68],
    [1, 0.686, 0.224],
  ],
  BLUE: [
    [0.173, 0.545, 1],
    [0.92, 0.9, 0.97],
    [0.72, 0.68, 0.95],
    [0.77, 0.63, 1],
  ],
  GREEN: [
    [0.16, 0.75, 0.35],
    [0.85, 0.97, 0.9],
    [0.25, 0.9, 0.6],
    [0.255, 0.875, 0.77],
  ],
  RED: [
    [0.72, 0.74, 0.84],
    [0.96, 0.91, 0.9],
    [0.99, 0.65, 0.58],
    [0.93, 0.38, 0.28],
  ],
  ORANGE: [
    [0.98, 0.55, 0.3],
    [0.99, 0.95, 0.9],
    [1, 0.82, 0.6],
    [1, 0.7, 0.38],
  ],
};

/** noiseScale(maxDim) — matches the original's `p(e)` helper. */
export function noiseScaleForDim(maxDim: number): number {
  return 0.25 * Math.pow(maxDim / 72, 0.42);
}

/**
 * Per-frame CPU-side vertex displacement for the hero ribbon mesh, ported
 * verbatim from the original's minified displacement function. `positions`
 * is the flat Float32Array backing the geometry's `position` attribute,
 * `segments` is the row count along the ribbon's length, `time` is seconds.
 */
export function displaceRibbon(positions: Float32Array, segments: number, time: number) {
  let n = 0;
  for (let row = 0; row <= segments; row++) {
    const a = (row / segments - 0.5) * 6;
    const s =
      0.15 *
      (0.5 * Math.sin(0.9 * a + 0.4 + 0.1 * time) +
        0.3 * Math.sin(1.7 * a - 0.6 + 0.07 * time) +
        0.2 * Math.sin(2.8 * a + 1 + 0.05 * time));
    for (let col = 0; col <= 8; col++) {
      const r = col / 8;
      const o =
        0.09 * Math.sin(1.4 * a + 0.2 + 0.4 * time) +
        0.05 * Math.sin(2.5 * a - 0.5 + 0.28 * time) +
        0.025 * Math.sin(3.8 * a + 0.8 + 0.18 * time) +
        (0.15 * Math.sin(3.6 * a + 1.2 + 0.32 * time) + 0.08 * Math.sin(6.4 * a - 0.4 + 0.22 * time)) *
          ((r - 0.5) * 2) +
        (0.04 * Math.sin(3.5 * a + 5 * r + 0.35 * time) + 0.02 * Math.sin(5.5 * a - 3.5 * r + 0.22 * time));
      positions[n++] = a;
      positions[n++] = s + o;
      positions[n++] = (r - 0.5) * 1.5;
    }
  }
}

/** Builds the ribbon's index/uv buffers for a given row (segment) count — ported verbatim. */
export function buildRibbonGeometryArrays(segments: number) {
  const pointCount = (segments + 1) * 9;
  const positions = new Float32Array(3 * pointCount);
  const uvs = new Float32Array(2 * pointCount);
  const indices: number[] = [];
  for (let row = 0; row <= segments; row++) {
    const u = row / segments;
    for (let col = 0; col <= 8; col++) {
      const v = col / 8;
      const idx = 9 * row + col;
      uvs[2 * idx] = u;
      uvs[2 * idx + 1] = v;
    }
    if (row < segments) {
      const rowBase = 9 * row;
      for (let col = 0; col < 8; col++) {
        const a = rowBase + col;
        const b = rowBase + col + 1;
        const c = rowBase + 9 + col;
        const d = rowBase + 9 + col + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
  }
  return { positions, uvs, indices };
}
