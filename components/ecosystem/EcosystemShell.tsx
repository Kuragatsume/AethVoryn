"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Layers,
  Maximize2,
  Minimize2,
  Newspaper,
  Palette,
  RotateCcw,
  Sliders,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ParticleRipple from "../ui/ParticleRipple";
import { useEcosystem, type EcosystemPage } from "./EcosystemContext";
import NewsPanel from "./NewsPanel";
import NotesPanel from "./NotesPanel";
import SettingsPanel from "./SettingsPanel";

const NAV_LINKS: {
  id: Exclude<EcosystemPage, null>;
  code: string;
  label: string;
  icon: typeof Newspaper;
}[] = [
  { id: "news", code: "01", label: "Новости", icon: Newspaper },
  { id: "notes", code: "02", label: "Блокнот", icon: FileText },
  { id: "settings", code: "03", label: "Настройки", icon: Sliders },
];

export default function EcosystemShell() {
  const {
    activePage,
    setActivePage,
    surfaceMode,
    setSurfaceMode,
    themes,
    activeThemeId,
    selectTheme,
    etherConfig,
    news,
    notes,
    windowSize,
    updateWindowSize,
    resetWindowSize,
    frameMargins,
  } = useEcosystem();

  const [clock, setClock] = useState<{ time: string; date: string }>({
    time: "",
    date: "",
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  }>({ startX: 0, startY: 0, startW: 940, startH: 640 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock({
        time: now.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: now.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      });
    };
    update();
    const id = window.setInterval(update, 10000);
    return () => window.clearInterval(id);
  }, []);

  const togglePage = (id: Exclude<EcosystemPage, null>) => {
    setActivePage(activePage === id ? null : id);
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: windowSize.isMaximized ? window.innerWidth - 120 : windowSize.width,
      startH: windowSize.isMaximized ? window.innerHeight - 160 : windowSize.height,
    };

    if (windowSize.isMaximized) {
      updateWindowSize({ isMaximized: false });
    }

    const onPointerMove = (ev: PointerEvent) => {
      const deltaX = (ev.clientX - dragStartRef.current.startX) * 2;
      const deltaY = (ev.clientY - dragStartRef.current.startY) * 2;
      const maxW = Math.max(480, window.innerWidth - (frameMargins.enabled ? frameMargins.left + frameMargins.right + 40 : 80));
      const maxH = Math.max(360, window.innerHeight - (frameMargins.enabled ? frameMargins.top + frameMargins.bottom + 100 : 130));

      const nextW = Math.round(
        Math.max(420, Math.min(maxW, dragStartRef.current.startW + deltaX))
      );
      const nextH = Math.round(
        Math.max(320, Math.min(maxH, dragStartRef.current.startH + deltaY))
      );

      updateWindowSize({ width: nextW, height: nextH });
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Outer frame margin container style
  const containerPaddingStyle: React.CSSProperties = frameMargins.enabled
    ? {
        paddingTop: `${frameMargins.top + 12}px`,
        paddingRight: `${frameMargins.right + 16}px`,
        paddingBottom: `${frameMargins.bottom + 12}px`,
        paddingLeft: `${frameMargins.left + 16}px`,
      }
    : {};

  return (
    <>
      {/* SOLID EDGE FRAME MARGINS (NO BACKGROUND ZONE) */}
      {frameMargins.enabled && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-40 select-none">
          {/* Top Frame Bar */}
          <div
            className="absolute inset-x-0 top-0 transition-colors"
            style={{
              height: `${frameMargins.top}px`,
              backgroundColor: frameMargins.color,
              borderBottom: "1px solid rgba(255,255,255,0.12)",
            }}
          />
          {/* Bottom Frame Bar */}
          <div
            className="absolute inset-x-0 bottom-0 transition-colors"
            style={{
              height: `${frameMargins.bottom}px`,
              backgroundColor: frameMargins.color,
              borderTop: "1px solid rgba(255,255,255,0.12)",
            }}
          />
          {/* Left Frame Bar */}
          <div
            className="absolute inset-y-0 left-0 transition-colors"
            style={{
              width: `${frameMargins.left}px`,
              top: `${frameMargins.top}px`,
              bottom: `${frameMargins.bottom}px`,
              backgroundColor: frameMargins.color,
              borderRight: "1px solid rgba(255,255,255,0.12)",
            }}
          />
          {/* Right Frame Bar */}
          <div
            className="absolute inset-y-0 right-0 transition-colors"
            style={{
              width: `${frameMargins.right}px`,
              top: `${frameMargins.top}px`,
              bottom: `${frameMargins.bottom}px`,
              backgroundColor: frameMargins.color,
              borderLeft: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        </div>
      )}

      <div
        className="relative flex h-[100svh] w-full flex-col justify-between overflow-hidden px-4 py-4 sm:px-6 sm:py-5"
        style={containerPaddingStyle}
      >
        {/* TOP BAR */}
        <header className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-3">
          {/* Top-Left Brand Mark with Sharp Orthogonal Box */}
          <button
            type="button"
            onClick={() => setActivePage(null)}
            title="На главный экран"
            className="glass group relative inline-flex items-center gap-3 rounded-none px-3.5 py-2 text-left transition-colors hover:border-white/35"
          >
            {/* Corner notches */}
            <span
              className="pointer-events-none absolute -left-[1px] -top-[1px] h-1.5 w-1.5 border-l border-t"
              style={{ borderColor: "var(--eco-primary)" }}
            />
            <span
              className="pointer-events-none absolute -bottom-[1px] -right-[1px] h-1.5 w-1.5 border-b border-r"
              style={{ borderColor: "var(--eco-primary)" }}
            />

            <span
              className="grid h-5 w-5 place-items-center rounded-none border text-[10px] font-mono font-bold"
              style={{
                borderColor: "var(--eco-primary)",
                backgroundColor: "rgba(var(--eco-primary-rgb), 0.12)",
                color: "var(--eco-primary)",
              }}
            >
              AE
            </span>
            <span className="font-mono text-xs font-semibold tracking-[0.24em]">
              AETHVORYN
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest opacity-40">
              [V4.2]
            </span>
          </button>

          {/* Top-Right Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Surface Mode Switcher */}
            <div
              className="glass flex items-center rounded-none p-0.5"
              role="group"
              aria-label="Режим фона панелей"
            >
              <Layers
                className="mx-2 hidden h-3.5 w-3.5 opacity-55 sm:block"
                style={{ color: "var(--eco-primary)" }}
              />
              <button
                type="button"
                onClick={() => setSurfaceMode("transparent")}
                className={`rounded-none px-2.5 py-1 text-xs font-medium transition-colors ${
                  surfaceMode === "transparent"
                    ? "font-semibold"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={
                  surfaceMode === "transparent"
                    ? {
                        backgroundColor: "rgba(var(--eco-primary-rgb), 0.18)",
                        border: "1px solid rgba(var(--eco-primary-rgb), 0.5)",
                        color: "var(--eco-text)",
                      }
                    : { border: "1px solid transparent" }
                }
              >
                Прозрачный
              </button>
              <button
                type="button"
                onClick={() => setSurfaceMode("solid")}
                className={`rounded-none px-2.5 py-1 text-xs font-medium transition-colors ${
                  surfaceMode === "solid"
                    ? "font-semibold"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={
                  surfaceMode === "solid"
                    ? {
                        backgroundColor: "rgba(var(--eco-primary-rgb), 0.18)",
                        border: "1px solid rgba(var(--eco-primary-rgb), 0.5)",
                        color: "var(--eco-text)",
                      }
                    : { border: "1px solid transparent" }
                }
              >
                Плотный
              </button>
            </div>

            {/* Theme Switcher */}
            <div className="glass flex items-center gap-2 rounded-none px-3 py-1.5">
              <Palette
                className="h-3.5 w-3.5 shrink-0 opacity-75"
                style={{ color: "var(--eco-primary)" }}
              />
              <select
                aria-label="Выбор темы"
                value={activeThemeId}
                onChange={(e) => selectTheme(e.target.value)}
                className="cursor-pointer rounded-none bg-transparent pr-1 font-mono text-xs font-medium focus:outline-none"
                style={{ color: "var(--eco-text)" }}
              >
                {themes.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    className="bg-slate-950 text-slate-100"
                  >
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* MIDDLE ROW: Centered Resizable Workspace Stage + Right Rail */}
        <div className="relative z-10 my-3 grid min-h-0 flex-1 grid-cols-1 items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-5">
          {/* CENTER PAGE STAGE (Resizable Workspace Window) */}
          <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden px-1 sm:px-2">
            <AnimatePresence mode="wait">
              {activePage !== null ? (
                <motion.section
                  key={activePage}
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.985 }}
                  transition={{ duration: 0.18 }}
                  className="glass relative flex flex-col overflow-hidden rounded-none shadow-[0_24px_70px_rgba(0,0,0,0.92)] transition-[width,height]"
                  style={{
                    width: windowSize.isMaximized ? "100%" : `${windowSize.width}px`,
                    height: windowSize.isMaximized ? "100%" : `${windowSize.height}px`,
                    maxWidth: windowSize.isMaximized ? "100%" : "calc(100vw - 80px)",
                    maxHeight: windowSize.isMaximized ? "100%" : "calc(100vh - 130px)",
                    minWidth: "380px",
                    minHeight: "320px",
                  }}
                >
                  {/* SHARP HUD CORNER BRACKETS (┌ ┐ └ ┘) */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -left-[1px] -top-[1px] z-30 h-3 w-3 border-l-2 border-t-2"
                    style={{ borderColor: "var(--eco-primary)" }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-[1px] -top-[1px] z-30 h-3 w-3 border-r-2 border-t-2"
                    style={{ borderColor: "var(--eco-primary)" }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-[1px] -left-[1px] z-30 h-3 w-3 border-b-2 border-l-2"
                    style={{ borderColor: "var(--eco-primary)" }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-[1px] -right-[1px] z-30 h-3 w-3 border-b-2 border-r-2"
                    style={{ borderColor: "var(--eco-primary)" }}
                  />

                  {/* WINDOW TOP HEADER BAR */}
                  <div className="relative z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-black/25 px-4 py-2 font-mono text-xs">
                    {/* Window identity & live dimensions */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold uppercase tracking-wider">
                        WIN_{activePage.toUpperCase()}
                      </span>
                      <span className="hidden opacity-35 sm:inline">|</span>
                      <span className="hidden font-mono text-[11px] tabular-nums opacity-60 sm:inline">
                        {windowSize.isMaximized
                          ? "MAXIMIZED"
                          : `${Math.round(windowSize.width)}×${Math.round(windowSize.height)} PX`}
                      </span>
                    </div>

                    {/* Window control buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={resetWindowSize}
                        title="Сбросить стандартный размер окна"
                        className="rounded-none border border-white/10 bg-white/[0.03] p-1 opacity-70 transition-all hover:border-white/30 hover:bg-white/[0.08] hover:opacity-100"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateWindowSize({ isMaximized: !windowSize.isMaximized })
                        }
                        title={
                          windowSize.isMaximized
                            ? "Восстановить размер"
                            : "Развернуть на весь экран"
                        }
                        className="rounded-none border border-white/10 bg-white/[0.03] p-1 opacity-70 transition-all hover:border-white/30 hover:bg-white/[0.08] hover:opacity-100"
                      >
                        {windowSize.isMaximized ? (
                          <Minimize2 className="h-3 w-3" />
                        ) : (
                          <Maximize2 className="h-3 w-3" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePage(null)}
                        title="Закрыть окно"
                        aria-label="Закрыть окно"
                        className="rounded-none border border-white/10 bg-white/[0.03] p-1 opacity-70 transition-all hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Window Content Pane */}
                  <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
                    {activePage === "news" && <NewsPanel />}
                    {activePage === "notes" && <NotesPanel />}
                    {activePage === "settings" && <SettingsPanel />}
                  </div>

                  {/* BOTTOM-RIGHT CORNER RESIZE GRIP */}
                  {!windowSize.isMaximized && (
                    <div
                      role="button"
                      aria-label="Потяните для изменения размера окна"
                      title="Потяните для изменения размера окна"
                      onPointerDown={handleResizeStart}
                      className="group/resize absolute bottom-0 right-0 z-40 flex h-6 w-6 cursor-nwse-resize items-end justify-end p-1 select-none"
                    >
                      {/* Live dimension tooltip during drag */}
                      {isDragging && (
                        <div className="pointer-events-none absolute bottom-7 right-1 whitespace-nowrap border border-white/20 bg-black/90 px-2 py-0.5 font-mono text-[10px] text-white shadow-lg">
                          {Math.round(windowSize.width)} × {Math.round(windowSize.height)} PX
                        </div>
                      )}
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 11 11"
                        fill="none"
                        className="opacity-45 transition-opacity group-hover/resize:opacity-100"
                        style={{ color: "var(--eco-primary)" }}
                      >
                        <path
                          d="M10 2L2 10M10 6L6 10M10 10H10.01"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="square"
                        />
                      </svg>
                    </div>
                  )}
                </motion.section>
              ) : (
                <motion.div
                  key="empty-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none select-none text-center"
                >
                  <div className="inline-flex flex-col items-center gap-2">
                    <div className="h-[1px] w-20 bg-white/25" />
                    <h1 className="text-shadow-crisp font-mono text-3xl font-semibold tracking-[0.32em] sm:text-5xl">
                      <span className="text-gradient-amber">AETHVORYN</span>
                    </h1>
                    <span className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-45">
                      DIGITAL WORKSPACE ARCHITECTURE
                    </span>
                    <div className="h-[1px] w-20 bg-white/25" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT VERTICAL COMMAND RAIL */}
          <nav
            aria-label="Навигация"
            className="glass flex shrink-0 flex-row items-center justify-center gap-1.5 self-center rounded-none p-1.5 shadow-xl lg:flex-col lg:items-stretch"
          >
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => togglePage(item.id)}
                  title={item.label}
                  className={`relative flex items-center gap-2.5 rounded-none px-3.5 py-2.5 text-left text-xs font-medium transition-colors sm:text-[13px] ${
                    isActive
                      ? "font-semibold"
                      : "opacity-70 hover:bg-white/[0.05] hover:opacity-100"
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                          border: "1px solid rgba(var(--eco-primary-rgb), 0.55)",
                        }
                      : { border: "1px solid transparent" }
                  }
                >
                  <span className="hidden font-mono text-[10px] opacity-45 lg:inline">
                    {item.code}
                  </span>
                  <Icon
                    className="relative h-4 w-4 shrink-0"
                    style={isActive ? { color: "var(--eco-primary)" } : undefined}
                  />
                  <span className="relative">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM ROW: Instrument Telemetry Bar */}
        <footer className="relative z-20 flex shrink-0 items-end justify-between gap-4">
          {etherConfig.displayMode !== "hidden" ? (
            <div
              data-ripple-host
              className="glass relative h-16 w-full max-w-md overflow-hidden rounded-none px-4 py-2.5 shadow-xl"
            >
              {/* Corner tick marks */}
              <span
                className="pointer-events-none absolute left-0 top-0 h-1.5 w-1.5 border-l border-t"
                style={{ borderColor: "var(--eco-primary)" }}
              />
              <span
                className="pointer-events-none absolute right-0 top-0 h-1.5 w-1.5 border-r border-t"
                style={{ borderColor: "var(--eco-primary)" }}
              />

              <div className="absolute inset-0 opacity-70">
                <ParticleRipple />
              </div>

              {etherConfig.displayMode === "clock" && (
                <div className="pointer-events-none relative z-10 flex h-full items-center justify-between">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-xl font-semibold tabular-nums tracking-wider sm:text-2xl">
                      {clock.time || "—:—"}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-45">
                      UTC_LOC
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums tracking-widest opacity-70">
                    {clock.date}
                  </span>
                </div>
              )}

              {etherConfig.displayMode === "stats" && (
                <div className="pointer-events-none relative z-10 flex h-full items-center justify-between font-mono text-xs">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-base font-semibold tabular-nums"
                      style={{ color: "var(--eco-primary)" }}
                    >
                      {news.length}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider opacity-65">
                      ПУБЛИКАЦИЙ
                    </span>
                  </div>
                  <div className="h-4 w-[1px] bg-white/10" />
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-base font-semibold tabular-nums"
                      style={{ color: "var(--eco-primary)" }}
                    >
                      {notes.length}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider opacity-65">
                      ЗАМЕТОК
                    </span>
                  </div>
                </div>
              )}

              {etherConfig.displayMode === "custom" && (
                <div className="pointer-events-none relative z-10 flex h-full flex-col justify-center">
                  <p className="truncate font-mono text-xs font-semibold uppercase tracking-wider">
                    {etherConfig.customTitle}
                  </p>
                  {etherConfig.customSubtitle && (
                    <p className="truncate font-mono text-[11px] opacity-65">
                      {etherConfig.customSubtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div />
          )}
        </footer>
      </div>
    </>
  );
}
