"use client";

import { useCallback, useRef, type MouseEvent, type ReactNode } from "react";

/**
 * Crisp architectural glass card with a subtle cursor-tracking highlight.
 */
export default function SpotlightCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
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
      className={`group/spot glass-subtle relative overflow-hidden rounded-lg transition-colors duration-200 hover:border-white/20 ${className}`}
    >
      {/* Subtle surface sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(var(--eco-primary-rgb), 0.07), transparent 55%)",
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}
