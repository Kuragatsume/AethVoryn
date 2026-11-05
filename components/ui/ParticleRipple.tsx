"use client";

import { useEffect, useRef } from "react";

type Dot = { ox: number; oy: number; x: number; y: number; vx: number; vy: number };
type Ripple = { x: number; y: number; r: number; life: number };

/**
 * Zero-idle-CPU precision dot-grid matrix with on-demand cursor deflection.
 * Sleeps at 0% CPU when cursor is outside and ripples have settled.
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
    let running = false;
    const SPACING = 18;

    let pParts = [203, 213, 225];
    let sParts = [100, 116, 139];

    const readThemeColors = () => {
      const rootStyle = getComputedStyle(document.documentElement);
      pParts = (rootStyle.getPropertyValue("--eco-primary-rgb").trim() || "203, 213, 225")
        .split(",")
        .map((n) => Number(n.trim()) || 0);
      sParts = (rootStyle.getPropertyValue("--eco-secondary-rgb").trim() || "100, 116, 139")
        .split(",")
        .map((n) => Number(n.trim()) || 0);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = `rgba(${sParts[0]},${sParts[1]},${sParts[2]},0.15)`;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        ctx.fillRect(d.ox - 0.5, d.oy - 0.5, 1, 1);
      }
    };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
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
      readThemeColors();
      drawStatic();
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);

      for (let k = ripples.length - 1; k >= 0; k--) {
        const rp = ripples[k];
        rp.r += 3.8;
        rp.life -= 0.022;
        if (rp.life <= 0) ripples.splice(k, 1);
      }

      let maxMotion = 0;
      ctx.fillStyle = `rgba(${sParts[0]},${sParts[1]},${sParts[2]},0.15)`;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (mouse.active) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 4200) {
            const dist = Math.sqrt(dist2) || 1;
            const f = (1 - dist / 65) * 1.05;
            d.vx += (dx / dist) * f;
            d.vy += (dy / dist) * f;
          }
        }
        for (let rIdx = 0; rIdx < ripples.length; rIdx++) {
          const rp = ripples[rIdx];
          const dx = d.ox - rp.x;
          const dy = d.oy - rp.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const band = Math.abs(dist - rp.r);
          if (band < 14) {
            const f = (1 - band / 14) * 1.15 * rp.life;
            d.vx += (dx / dist) * f;
            d.vy += (dy / dist) * f;
          }
        }
        d.vx += (d.ox - d.x) * 0.1;
        d.vy += (d.oy - d.y) * 0.1;
        d.vx *= 0.78;
        d.vy *= 0.78;
        d.x += d.vx;
        d.y += d.vy;

        const offset = Math.abs(d.x - d.ox) + Math.abs(d.y - d.oy);
        if (offset > maxMotion) maxMotion = offset;

        if (offset > 0.15) {
          const disp = Math.min(offset / 12, 1);
          const alpha = 0.16 + disp * 0.52;
          const size = 1 + disp * 0.75;
          ctx.fillStyle = `rgba(${pParts[0]},${pParts[1]},${pParts[2]},${alpha.toFixed(2)})`;
          ctx.fillRect(d.x - size * 0.5, d.y - size * 0.5, size, size);
          ctx.fillStyle = `rgba(${sParts[0]},${sParts[1]},${sParts[2]},0.15)`;
        } else {
          ctx.fillRect(d.ox - 0.5, d.oy - 0.5, 1, 1);
        }
      }

      if (mouse.active || ripples.length > 0 || maxMotion > 0.08) {
        raf = requestAnimationFrame(step);
      } else {
        running = false;
        drawStatic();
      }
    };

    const wakeUp = () => {
      if (!running) {
        running = true;
        readThemeColors();
        raf = requestAnimationFrame(step);
      }
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
      wakeUp();
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      ripples.push({ x: p.x, y: p.y, r: 0, life: 0.85 });
      wakeUp();
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave, { passive: true });
    host.addEventListener("pointerdown", onDown, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={`block h-full w-full ${className}`} />;
}
