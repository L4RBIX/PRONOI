"use client";

import { useEffect, useRef } from "react";
import {
  GRADIENT_FRAGMENT_SHADER,
  GradientPalette,
  PALETTE_COLORS,
  QUAD_VERTEX_SHADER,
  noiseScaleForDim,
} from "./shaders";

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

interface Handles {
  gl: WebGL2RenderingContext;
  timeLoc: WebGLUniformLocation | null;
  warpLoc: WebGLUniformLocation | null;
  speedLoc: WebGLUniformLocation | null;
  energyLoc: WebGLUniformLocation | null;
  noiseScaleLoc: WebGLUniformLocation | null;
  aspectRatioLoc: WebGLUniformLocation | null;
  color0Loc: WebGLUniformLocation | null;
  color1Loc: WebGLUniformLocation | null;
  color2Loc: WebGLUniformLocation | null;
  color3Loc: WebGLUniformLocation | null;
}

function setupGl(canvas: HTMLCanvasElement): Handles | null {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false });
  if (!gl) return null;
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, QUAD_VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, GRADIENT_FRAGMENT_SHADER);
  if (!vertexShader || !fragmentShader) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);
  return {
    gl,
    timeLoc: gl.getUniformLocation(program, "u_time"),
    warpLoc: gl.getUniformLocation(program, "u_warpIntensity"),
    speedLoc: gl.getUniformLocation(program, "u_speed"),
    energyLoc: gl.getUniformLocation(program, "u_energy"),
    noiseScaleLoc: gl.getUniformLocation(program, "u_noiseScale"),
    aspectRatioLoc: gl.getUniformLocation(program, "u_aspectRatio"),
    color0Loc: gl.getUniformLocation(program, "u_color0"),
    color1Loc: gl.getUniformLocation(program, "u_color1"),
    color2Loc: gl.getUniformLocation(program, "u_color2"),
    color3Loc: gl.getUniformLocation(program, "u_color3"),
  };
}

/**
 * Faithful port of handhold.io's own `GradientBackground` WebGL2 component
 * (domain-warped simplex noise, see ./shaders.ts) — used behind the three
 * agent-showcase cards on the live site.
 */
export function GradientBackground({
  palette = GradientPalette.YELLOW,
  seed = 0,
  className,
}: {
  palette?: GradientPalette;
  seed?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handlesRef = useRef<Handles | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, maxDim: 72 });
  const inViewRef = useRef(false);
  const needsDrawRef = useRef(false);
  const rafRef = useRef(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    handlesRef.current = setupGl(canvas);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.ceil(width * dpr);
      const h = Math.ceil(height * dpr);
      canvas.width = w;
      canvas.height = h;
      sizeRef.current = { w, h, maxDim: Math.max(width, height) };
      const handles = handlesRef.current;
      if (handles) {
        const { gl } = handles;
        gl.uniform1f(handles.aspectRatioLoc, w / Math.max(h, 1));
        gl.uniform1f(handles.noiseScaleLoc, noiseScaleForDim(sizeRef.current.maxDim));
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      needsDrawRef.current = true;
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(canvas);

    function frame(t: number) {
      rafRef.current = requestAnimationFrame(frame);
      const handles = handlesRef.current;
      if (!handles || (!inViewRef.current && !needsDrawRef.current)) return;
      needsDrawRef.current = false;
      if (startRef.current === null) startRef.current = t;
      const elapsed = (t - startRef.current) / 1000;
      const { gl } = handles;
      const { w, h, maxDim } = sizeRef.current;
      const warpIntensity = 0.8;
      const energy = 0.5;
      const speed = 0.2 * Math.max(1, Math.pow(maxDim / 72, 0.4));
      gl.uniform1f(handles.timeLoc, elapsed + 137.5 * seed);
      gl.uniform1f(handles.warpLoc, warpIntensity);
      gl.uniform1f(handles.speedLoc, speed);
      gl.uniform1f(handles.energyLoc, energy);
      gl.uniform1f(handles.noiseScaleLoc, noiseScaleForDim(maxDim));
      gl.uniform1f(handles.aspectRatioLoc, w / Math.max(h, 1));
      const colors = PALETTE_COLORS[palette];
      gl.uniform3f(handles.color0Loc, ...colors[0]);
      gl.uniform3f(handles.color1Loc, ...colors[1]);
      gl.uniform3f(handles.color2Loc, ...colors[2]);
      gl.uniform3f(handles.color3Loc, ...colors[3]);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      handlesRef.current = null;
    };
  }, [palette, seed]);

  return <canvas ref={canvasRef} className={className ?? "absolute inset-0 h-full w-full"} />;
}
