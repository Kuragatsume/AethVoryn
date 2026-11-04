"use client";

import { useEffect, useRef } from "react";

type Dot = { ox: number; oy: number; x: number; y: number; vx: number; vy: number };
type Ripple = { x: number; y: number; r: number; life: number };

/**
 * Strict precision dot-grid matrix with subtle cursor deflection.
 */
export default function ParticleRipple({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dots: Dot[] = [];
    const ripples: Ripple[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = false;
    const SPACING = 16;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const cols = Math.ceil(w / SPACING) + 1;
      const rows = Math.ceil(h / SPACING) + 1;
      const offX = (w - (cols - 1) * SPACING) / 2;
      const offY = (h - (rows - 1) * SPACING) / 2;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = offX + i * SPACING;
          const y = offY + j * SPACING;
          dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
        }
      }
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);

      const rootStyle = getComputedStyle(document.documentElement);
      const pParts = (rootStyle.getPropertyValue("--eco-primary-rgb").trim() || "203, 213, 225")
        .split(",")
        .map((n) => Number(n.trim()) || 0);
      const sParts = (rootStyle.getPropertyValue("--eco-secondary-rgb").trim() || "100, 116, 139")
        .split(",")
        .map((n) => Number(n.trim()) || 0);

      for (let k = ripples.length - 1; k >= 0; k--) {
        const rp = ripples[k];
        rp.r += 3.8;
        rp.life -= 0.018;
        if (rp.life <= 0) ripples.splice(k, 1);
      }

      for (const d of dots) {
        if (mouse.active) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist2 = dx * dx + dy * dy;
          const R = 70;
          if (dist2 < R * R) {
            const dist = Math.sqrt(dist2) || 1;
            const f = (1 - dist / R) * 1.1;
            d.vx += (dx / dist) * f;
            d.vy += (dy / dist) * f;
          }
        }
        for (const rp of ripples) {
          const dx = d.ox - rp.x;
          const dy = d.oy - rp.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const band = Math.abs(dist - rp.r);
          if (band < 14) {
            const f = (1 - band / 14) * 1.2 * rp.life;
            d.vx += (dx / dist) * f;
            d.vy += (dy / dist) * f;
          }
        }
        d.vx += (d.ox - d.x) * 0.08;
        d.vy += (d.oy - d.y) * 0.08;
        d.vx *= 0.8;
        d.vy *= 0.8;
        d.x += d.vx;
        d.y += d.vy;

        const disp = Math.min(Math.hypot(d.x - d.ox, d.y - d.oy) / 12, 1);
        const alpha = 0.14 + disp * 0.55;
        const size = 1 + disp * 0.8;
        const r = Math.round(sParts[0] + (pParts[0] - sParts[0]) * disp);
        const g = Math.round(sParts[1] + (pParts[1] - sParts[1]) * disp);
        const b = Math.round(sParts[2] + (pParts[2] - sParts[2]) * disp);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(d.x - size * 0.5, d.y - size * 0.5, size, size);
      }

      if (visible) raf = requestAnimationFrame(step);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(step);
    };

    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const host: HTMLElement =
      canvas.closest<HTMLElement>("[data-ripple-host]") ?? canvas.parentElement ?? canvas;
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      ripples.push({ x: p.x, y: p.y, r: 0, life: 0.85 });
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else cancelAnimationFrame(raf);
    });
    io.observe(canvas);

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={`block h-full w-full ${className}`} />;
}
