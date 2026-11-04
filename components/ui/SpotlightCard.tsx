"use client";

import { useCallback, useRef, type MouseEvent, type ReactNode } from "react";

/**
 * Technical architectural glass card with sharp 90° corners,
 * subtle cursor-tracking highlight and optional orthogonal corner brackets.
 */
export default function SpotlightCard({
  children,
  className = "",
  showCorners = true,
}: {
  children: ReactNode;
  className?: string;
  showCorners?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`group/spot glass-subtle relative overflow-hidden rounded-none border border-white/10 transition-colors duration-150 hover:border-white/25 ${className}`}
    >
      {/* Sharp HUD Corner Tick Marks */}
      {showCorners && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-1.5 w-1.5 border-l border-t opacity-70 transition-opacity group-hover/spot:opacity-100"
            style={{ borderColor: "var(--eco-primary)" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-1.5 w-1.5 border-r border-t opacity-70 transition-opacity group-hover/spot:opacity-100"
            style={{ borderColor: "var(--eco-primary)" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 h-1.5 w-1.5 border-b border-l opacity-70 transition-opacity group-hover/spot:opacity-100"
            style={{ borderColor: "var(--eco-primary)" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r opacity-70 transition-opacity group-hover/spot:opacity-100"
            style={{ borderColor: "var(--eco-primary)" }}
          />
        </>
      )}

      {/* Subtle surface sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--eco-primary-rgb), 0.08), transparent 60%)",
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}
