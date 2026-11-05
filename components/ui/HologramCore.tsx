"use client";

import { useEffect, useRef } from "react";
import {
  useEcosystem,
  type HologramShape,
} from "../ecosystem/EcosystemContext";

type Vec3 = [number, number, number];

// Precompute 3D geometries once at module load
function buildGeometry(shape: HologramShape): {
  vertices: Vec3[];
  edges: [number, number][];
} {
  if (shape === "cube") {
    // Hypercube (Tesseract): outer cube + inner cube + connecting struts
    const vertices: Vec3[] = [];
    const edges: [number, number][] = [];
    for (const s of [0.95, 0.48]) {
      for (let z = -1; z <= 1; z += 2) {
        for (let y = -1; y <= 1; y += 2) {
          for (let x = -1; x <= 1; x += 2) {
            vertices.push([x * s * 0.65, y * s * 0.65, z * s * 0.65]);
          }
        }
      }
    }
    const cubeEdges: [number, number][] = [
      [0, 1], [2, 3], [4, 5], [6, 7],
      [0, 2], [1, 3], [4, 6], [5, 7],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    for (const [a, b] of cubeEdges) {
      edges.push([a, b]);
      edges.push([a + 8, b + 8]);
    }
    for (let i = 0; i < 8; i++) {
      edges.push([i, i + 8]);
    }
    return { vertices, edges };
  }

  if (shape === "octahedron") {
    // Double crystal octahedron
    const vertices: Vec3[] = [
      [0, 1.15, 0],
      [0, -1.15, 0],
      [1, 0, 0],
      [-1, 0, 0],
      [0, 0, 1],
      [0, 0, -1],
      [0.5, 0, 0.5],
      [-0.5, 0, 0.5],
      [-0.5, 0, -0.5],
      [0.5, 0, -0.5],
    ];
    const edges: [number, number][] = [
      [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 4], [4, 3], [3, 5], [5, 2],
      [0, 6], [0, 7], [0, 8], [0, 9],
      [1, 6], [1, 7], [1, 8], [1, 9],
      [6, 7], [7, 8], [8, 9], [9, 6],
    ];
    return { vertices, edges };
  }

  if (shape === "torus") {
    const vertices: Vec3[] = [];
    const edges: [number, number][] = [];
    const U = 14;
    const V = 8;
    const R = 0.72;
    const r = 0.32;
    for (let i = 0; i < U; i++) {
      const u = (i / U) * Math.PI * 2;
      for (let j = 0; j < V; j++) {
        const v = (j / V) * Math.PI * 2;
        const x = (R + r * Math.cos(v)) * Math.cos(u);
        const y = (R + r * Math.cos(v)) * Math.sin(u);
        const z = r * Math.sin(v);
        vertices.push([x, y, z]);
        const idx = i * V + j;
        const nextJ = i * V + ((j + 1) % V);
        const nextI = ((i + 1) % U) * V + j;
        edges.push([idx, nextJ]);
        edges.push([idx, nextI]);
      }
    }
    return { vertices, edges };
  }

  if (shape === "helix") {
    const vertices: Vec3[] = [];
    const edges: [number, number][] = [];
    const N = 18;
    for (let i = 0; i < N; i++) {
      const t = (i / (N - 1) - 0.5) * 2.1;
      const a = i * 0.48;
      const r = 0.72;
      vertices.push([Math.cos(a) * r, t, Math.sin(a) * r]);
      vertices.push([Math.cos(a + Math.PI) * r, t, Math.sin(a + Math.PI) * r]);
      const idx = i * 2;
      edges.push([idx, idx + 1]); // rung
      if (i > 0) {
        edges.push([idx - 2, idx]);
        edges.push([idx - 1, idx + 1]);
      }
    }
    return { vertices, edges };
  }

  // Default: Golden-ratio Icosahedron
  const PHI = (1 + Math.sqrt(5)) / 2;
  const vertices: Vec3[] = (
    [
      [-1, PHI, 0],
      [1, PHI, 0],
      [-1, -PHI, 0],
      [1, -PHI, 0],
      [0, -1, PHI],
      [0, 1, PHI],
      [0, -1, -PHI],
      [0, 1, -PHI],
      [PHI, 0, -1],
      [PHI, 0, 1],
      [-PHI, 0, -1],
      [-PHI, 0, 1],
    ] as Vec3[]
  ).map(([x, y, z]) => {
    const len = Math.hypot(x, y, z);
    return [x / len, y / len, z / len] as Vec3;
  });

  const edges: [number, number][] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const [x1, y1, z1] = vertices[i];
      const [x2, y2, z2] = vertices[j];
      if (Math.hypot(x1 - x2, y1 - y2, z1 - z2) < 1.25) {
        edges.push([i, j]);
      }
    }
  }
  return { vertices, edges };
}

const GEOM_CACHE: Record<
  HologramShape,
  { vertices: Vec3[]; edges: [number, number][] }
> = {
  icosahedron: buildGeometry("icosahedron"),
  cube: buildGeometry("cube"),
  octahedron: buildGeometry("octahedron"),
  torus: buildGeometry("torus"),
  helix: buildGeometry("helix"),
};

function hexToRgbString(hex: string): string {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16) || 203;
    const g = parseInt(clean.slice(2, 4), 16) || 213;
    const b = parseInt(clean.slice(4, 6), 16) || 225;
    return `${r}, ${g}, ${b}`;
  }
  return "203, 213, 225";
}

const CANVAS_SIZE = 420;

export default function HologramCore() {
  const { theme, hologramConfig, updateHologramConfig } = useEcosystem();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(hologramConfig);
  const rgbRef = useRef(hexToRgbString(theme.primary));

  useEffect(() => {
    configRef.current = hologramConfig;
  }, [hologramConfig]);

  useEffect(() => {
    rgbRef.current = hexToRgbString(theme.primary);
  }, [theme.primary]);

  // Direct Left-Mouse-Button Drag (no handle button needed — just hold LMB and drag)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const el = wrapperRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = rect.left + window.scrollX;
    const origY = rect.top + window.scrollY;
    const maxPageH = Math.max(
      document.documentElement.scrollHeight,
      window.innerHeight
    );

    let lastX = origX;
    let lastY = origY;

    const onPointerMove = (ev: PointerEvent) => {
      const nextX = Math.max(
        -120,
        Math.min(
          window.innerWidth - 120,
          Math.round(origX + (ev.clientX - startX))
        )
      );
      const nextY = Math.max(
        -80,
        Math.min(maxPageH - 120, Math.round(origY + (ev.clientY - startY)))
      );
      lastX = nextX;
      lastY = nextY;
      el.style.left = `${nextX}px`;
      el.style.top = `${nextY}px`;
      el.style.transform = "none";
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      updateHologramConfig({ x: lastX, y: lastY });
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let animId = 0;
    let isVisible = true;
    let angleX = 0.35;
    let angleY = 0.5;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let lastTime = performance.now();

    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetTiltY = nx * 0.55;
      targetTiltX = -ny * 0.45;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const rotate3D = (v: Vec3, ax: number, ay: number, az: number): Vec3 => {
      let [x, y, z] = v;
      const cosX = Math.cos(ax);
      const sinX = Math.sin(ax);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      y = y1;
      z = z1;

      const cosY = Math.cos(ay);
      const sinY = Math.sin(ay);
      const x2 = x * cosY + z * sinY;
      const z2 = -x * sinY + z * cosY;
      x = x2;
      z = z2;

      const cosZ = Math.cos(az);
      const sinZ = Math.sin(az);
      return [x * cosZ - y * sinZ, x * sinZ + y * cosZ, z];
    };

    const render = (now: number) => {
      if (!isVisible || document.hidden) {
        animId = window.requestAnimationFrame(render);
        return;
      }

      const dt = Math.min(0.05, (now - lastTime) * 0.001);
      lastTime = now;
      const t = now * 0.001;

      const cfg = configRef.current;
      const primaryRgb = rgbRef.current;
      const cx = CANVAS_SIZE / 2;
      const cy = CANVAS_SIZE / 2;

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      currentTiltX += (targetTiltX - currentTiltX) * 0.08;
      currentTiltY += (targetTiltY - currentTiltY) * 0.08;

      const speed = cfg.speed ?? 1.0;
      const scaleMult = cfg.scale ?? 1.0;

      angleY += dt * 0.42 * speed;
      angleX = Math.sin(t * 0.45 * speed) * 0.24 + currentTiltX;
      const totalY = angleY + currentTiltY;

      const radius = 108 * scaleMult;
      const fov = 380;

      // 1. Gyroscopic Telemetry Rings
      if (cfg.showRings) {
        for (let ring = 0; ring < 2; ring++) {
          const ringR = (ring === 0 ? 148 : 172) * scaleMult;
          const segments = 48;
          ctx.beginPath();
          for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const rv: Vec3 =
              ring === 0
                ? [
                    Math.cos(theta) * ringR,
                    Math.sin(theta) * ringR * 0.35,
                    Math.sin(theta) * ringR * 0.9,
                  ]
                : [
                    Math.cos(theta) * ringR * 0.85,
                    Math.sin(theta) * ringR,
                    Math.cos(theta) * ringR * 0.45,
                  ];

            const [rx, ry, rz] = rotate3D(
              rv,
              currentTiltX * 0.7 + (ring === 0 ? t * 0.25 * speed : -t * 0.18 * speed),
              currentTiltY * 0.7 + (ring === 0 ? -t * 0.2 * speed : t * 0.28 * speed),
              ring === 0 ? 0.4 : -0.5
            );
            const s = fov / (fov + rz);
            const px = cx + rx * s;
            const py = cy + ry * s;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = `rgba(${primaryRgb}, ${ring === 0 ? 0.2 : 0.11})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // 2. Project 3D Geometry
      const geom = GEOM_CACHE[cfg.shape || "icosahedron"] || GEOM_CACHE.icosahedron;
      const projected = geom.vertices.map((v) => {
        const [rx, ry, rz] = rotate3D(
          [v[0] * radius, v[1] * radius, v[2] * radius],
          angleX,
          totalY,
          t * 0.14 * speed
        );
        const s = fov / (fov + rz);
        return {
          x: cx + rx * s,
          y: cy + ry * s,
          z: rz,
          scale: s,
        };
      });

      // 3. Batch Wireframe Edges into 2 depth passes (front vs back) for maximum FPS
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < geom.edges.length; k++) {
        const [i, j] = geom.edges[k];
        const p1 = projected[i];
        const p2 = projected[j];
        if ((p1.z + p2.z) * 0.5 > 0) {
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
      }
      ctx.strokeStyle = `rgba(${primaryRgb}, 0.16)`;
      ctx.stroke();

      ctx.beginPath();
      for (let k = 0; k < geom.edges.length; k++) {
        const [i, j] = geom.edges[k];
        const p1 = projected[i];
        const p2 = projected[j];
        if ((p1.z + p2.z) * 0.5 <= 0) {
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
      }
      ctx.strokeStyle = `rgba(${primaryRgb}, 0.42)`;
      ctx.stroke();

      // 4. Vertex Nodes
      if (cfg.showNodes) {
        ctx.fillStyle = `rgba(${primaryRgb}, 0.65)`;
        for (let i = 0; i < projected.length; i++) {
          const p = projected[i];
          const sz = p.z <= 0 ? 2.6 : 1.6;
          ctx.fillRect(p.x - sz * 0.5, p.y - sz * 0.5, sz, sz);
        }
      }

      // 5. Inner Core Pulse Crosshair
      const pulse = 5 + Math.sin(t * 2.2) * 1.5;
      ctx.strokeStyle = `rgba(${primaryRgb}, 0.3)`;
      ctx.strokeRect(cx - pulse, cy - pulse, pulse * 2, pulse * 2);

      animId = window.requestAnimationFrame(render);
    };

    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    io.observe(canvas);

    animId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(animId);
      io.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const hasSavedPos =
    typeof hologramConfig.x === "number" &&
    typeof hologramConfig.y === "number";

  return (
    <div
      ref={wrapperRef}
      onPointerDown={handlePointerDown}
      title="Зажмите ЛКМ и перетащите 3D-объект в любое место"
      className="pointer-events-auto absolute z-[6] cursor-grab select-none active:cursor-grabbing"
      style={{
        left: hasSavedPos ? `${hologramConfig.x}px` : "50%",
        top: hasSavedPos ? `${hologramConfig.y}px` : "50svh",
        transform: hasSavedPos ? "none" : "translate(-50%, -50%)",
        opacity: hologramConfig.opacity ?? 0.85,
      }}
    >
      <canvas
        ref={canvasRef}
        className="block h-[340px] w-[340px] sm:h-[420px] sm:w-[420px]"
      />
    </div>
  );
}
