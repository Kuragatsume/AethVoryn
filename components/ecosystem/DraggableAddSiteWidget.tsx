"use client";

import { Globe, GripHorizontal, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useEcosystem } from "./EcosystemContext";

const STORAGE_KEY = "aethvoryn_addsite_pos";

export default function DraggableAddSiteWidget({
  hiddenByMaximize = false,
}: {
  hiddenByMaximize?: boolean;
}) {
  const { addSiteWindow } = useEcosystem();

  const elRef = useRef<HTMLElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const posRef = useRef<{ x: number; y: number } | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [siteUrlInput, setSiteUrlInput] = useState("");
  const [siteTitleInput, setSiteTitleInput] = useState("");

  // Load saved position if user previously moved it
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          const clamped = {
            x: Math.max(10, Math.min(window.innerWidth - 120, parsed.x)),
            y: Math.max(10, parsed.y),
          };
          posRef.current = clamped;
          setPos(clamped);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, input, form")) return;
    if (e.button !== 0) return;

    e.preventDefault();
    const el = elRef.current;
    if (!el) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = el.getBoundingClientRect();
    const origX = rect.left + window.scrollX;
    const origY = rect.top + window.scrollY;

    const onPointerMove = (ev: PointerEvent) => {
      const maxPageH = Math.max(
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      const nextX = Math.max(
        10,
        Math.min(window.innerWidth - 120, origX + (ev.clientX - startX))
      );
      const nextY = Math.max(
        10,
        Math.min(maxPageH - 60, origY + (ev.clientY - startY))
      );

      posRef.current = { x: nextX, y: nextY };
      el.style.left = `${nextX}px`;
      el.style.top = `${nextY}px`;
      el.style.right = "auto";
      el.style.bottom = "auto";
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (posRef.current) {
        setPos({ ...posRef.current });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current));
        } catch {
          /* ignore */
        }
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    posRef.current = null;
    setPos(null);
    const el = elRef.current;
    if (el) {
      el.style.left = "auto";
      el.style.right = "24px";
      el.style.top = "calc(100svh - 60px)";
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!siteUrlInput.trim()) return;
    addSiteWindow(siteUrlInput, siteTitleInput);
    setSiteUrlInput("");
    setSiteTitleInput("");
    setIsOpen(false);
  };

  return (
    <aside
      ref={elRef}
      className={`glass pointer-events-auto group/widget absolute z-[25] flex flex-col rounded-none shadow-2xl transition-opacity duration-200 ${
        hiddenByMaximize ? "pointer-events-none invisible opacity-0" : "opacity-100"
      }`}
      style={{
        position: "absolute",
        left: pos ? `${pos.x}px` : "auto",
        right: pos ? "auto" : "24px",
        top: pos ? `${pos.y}px` : "calc(100svh - 60px)",
        willChange: "left, top",
      }}
    >
      {/* HUD CORNER BRACKETS */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[1px] -top-[1px] z-30 h-2 w-2 border-l border-t"
        style={{ borderColor: "var(--eco-primary)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-[1px] -top-[1px] z-30 h-2 w-2 border-r border-t"
        style={{ borderColor: "var(--eco-primary)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[1px] -left-[1px] z-30 h-2 w-2 border-b border-l"
        style={{ borderColor: "var(--eco-primary)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[1px] -right-[1px] z-30 h-2 w-2 border-b border-r"
        style={{ borderColor: "var(--eco-primary)" }}
      />

      {/* TOP DRAG HANDLE */}
      <div
        onPointerDown={handlePointerDown}
        title="Зажмите и тяните для перемещения"
        className="flex cursor-grab items-center justify-between border-b border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-1 opacity-65 group-hover/widget:opacity-100 transition-opacity">
          <GripHorizontal
            className="h-2.5 w-2.5 shrink-0"
            style={{ color: "var(--eco-primary)" }}
          />
          <span>САЙТ</span>
        </div>
        {pos && (
          <button
            type="button"
            onClick={handleReset}
            title="Вернуть на исходное место"
            className="opacity-0 transition-opacity hover:text-white group-hover/widget:opacity-75"
          >
            <RotateCcw className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {/* FORM POPOVER (IF OPEN) */}
      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="border-b border-white/10 bg-black/85 p-3.5 shadow-2xl w-80 sm:w-88 font-mono text-xs"
        >
          <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-1.5">
            <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[11px]">
              <Globe
                className="h-3 w-3"
                style={{ color: "var(--eco-primary)" }}
              />
              <span>Добавить сайт</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-0.5 opacity-60 hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="mb-0.5 block text-[10px] uppercase opacity-65">
                URL сайта *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={siteUrlInput}
                onChange={(e) => setSiteUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-none border border-white/15 bg-black/60 px-2 py-1.5 text-xs text-white focus:border-white/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] uppercase opacity-65">
                Название в меню
              </label>
              <input
                type="text"
                value={siteTitleInput}
                onChange={(e) => setSiteTitleInput(e.target.value)}
                placeholder="По домену"
                className="w-full rounded-none border border-white/15 bg-black/60 px-2 py-1 text-xs text-white focus:border-white/40 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="border border-white/10 px-2.5 py-1 text-[10px] opacity-70 hover:opacity-100"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(var(--eco-primary-rgb), 0.22)",
                  borderColor: "var(--eco-primary)",
                  color: "var(--eco-text)",
                }}
              >
                <Plus className="h-3 w-3" /> Добавить
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TOGGLE BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        title="Добавить сайт в меню"
        className="flex items-center justify-center gap-2 px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-white/[0.08]"
        style={
          isOpen
            ? {
                backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                color: "var(--eco-primary)",
              }
            : undefined
        }
      >
        <Plus
          className="h-3.5 w-3.5 transition-transform group-hover/widget:rotate-90"
          style={{ color: "var(--eco-primary)" }}
        />
        <span>Добавить сайт</span>
      </button>
    </aside>
  );
}
