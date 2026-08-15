"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  GRADIENT_FRAGMENT_SHADER,
  GradientPalette,
  PALETTE_COLORS,
  RIBBON_VERTEX_SHADER,
  buildRibbonGeometryArrays,
  displaceRibbon,
} from "./shaders";

// THREE.js auto-injects its own `#version 300 es` pragma + precision block
// when `glslVersion: THREE.GLSL3` is set, so the raw-WebGL2 shader source
// (which self-declares both, for its standalone use in GradientBackground)
// needs those two lines stripped before being handed to ShaderMaterial.
const HERO_FRAGMENT_SHADER = GRADIENT_FRAGMENT_SHADER.replace(/^#version 300 es\n/, "").replace(
  /^precision highp float;\n/,
  ""
);

function useReducedMotion() {
  const ref = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    ref.current = mq.matches;
  }, []);
  return ref;
}

function makeGeometry(segments: number) {
  const { positions, uvs, indices } = buildRibbonGeometryArrays(segments);
  const geometry = new THREE.BufferGeometry();
  const posAttr = new THREE.Float32BufferAttribute(positions, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", posAttr);
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

/**
 * Faithful port of handhold.io's own hero-wave component: an orthographic
 * Three.js scene rendering a 9-column ribbon mesh, displaced every frame by
 * layered sine harmonics, and colored with the same domain-warped noise
 * shader used elsewhere on the site (see ./shaders.ts). Not a CSS/blur
 * approximation — this is the actual rendering pipeline the live site uses,
 * reconstructed from its own publicly-delivered JS bundle.
 */
export function HeroWave({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inViewRef = useRef(false);
  const reducedMotionRef = useReducedMotion();
  const renderedOnceRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(0, 0.15, 5);
    camera.lookAt(0, 0, 0);

    const colors = PALETTE_COLORS[GradientPalette.YELLOW];
    const material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: RIBBON_VERTEX_SHADER,
      fragmentShader: HERO_FRAGMENT_SHADER,
      uniforms: {
        u_time: { value: 0 },
        u_warpIntensity: { value: 0.8 },
        u_speed: { value: 0.2 },
        u_energy: { value: 0.5 },
        u_noiseScale: { value: 0.35 },
        u_aspectRatio: { value: 4 },
        u_color0: { value: new THREE.Vector3(...colors[0]) },
        u_color1: { value: new THREE.Vector3(...colors[1]) },
        u_color2: { value: new THREE.Vector3(...colors[2]) },
        u_color3: { value: new THREE.Vector3(...colors[3]) },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    let segments = 100;
    let geometry = makeGeometry(segments);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setSize(Math.ceil(width * dpr), Math.ceil(height * dpr), false);
      const aspect = width / height;
      camera.left = (-2 * aspect) / 2;
      camera.right = (2 * aspect) / 2;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
      const nextSegments = Math.max(100, Math.min(500, Math.round(0.3 * width)));
      if (nextSegments !== segments) {
        geometry.dispose();
        geometry = makeGeometry(nextSegments);
        mesh.geometry = geometry;
        segments = nextSegments;
      }
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
      if (!inViewRef.current) return;
      const reduced = reducedMotionRef.current;
      if (reduced) {
        if (renderedOnceRef.current) return;
        renderedOnceRef.current = true;
      }
      const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
      displaceRibbon(posAttr.array as Float32Array, segments, reduced ? 0 : (t / 1000) * 0.7);
      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();
      material.uniforms.u_time.value = reduced ? 0 : t / 1000;
      renderer.render(scene, camera);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [reducedMotionRef]);

  return <canvas ref={canvasRef} className={className} />;
}
