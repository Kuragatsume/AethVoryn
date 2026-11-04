"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Layers,
  Newspaper,
  Palette,
  Sliders,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import ParticleRipple from "../ui/ParticleRipple";
import { useEcosystem, type EcosystemPage } from "./EcosystemContext";
import NewsPanel from "./NewsPanel";
import NotesPanel from "./NotesPanel";
import SettingsPanel from "./SettingsPanel";

const EASE = [0.22, 1, 0.36, 1] as const;

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
  } = useEcosystem();

  const [clock, setClock] = useState<{ time: string; date: string }>({
    time: "",
    date: "",
  });

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

  return (
    <div className="relative flex h-[100svh] w-full flex-col justify-between overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
      {/* TOP BAR */}
      <header className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-3">
        {/* Top-Left Brand Mark */}
        <button
          type="button"
          onClick={() => setActivePage(null)}
          title="На главный экран"
          className="glass inline-flex items-center gap-3 rounded-lg px-3.5 py-2 text-left transition-colors hover:border-white/25"
        >
          <span
            className="grid h-6 w-6 place-items-center rounded-sm border text-[11px] font-mono font-bold"
            style={{
              borderColor: "var(--eco-primary)",
              backgroundColor: "rgba(var(--eco-primary-rgb), 0.12)",
              color: "var(--eco-primary)",
            }}
          >
            AE
          </span>
          <span className="font-mono text-xs font-semibold tracking-[0.22em]">
            AETHVORYN
          </span>
        </button>

        {/* Top-Right Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Surface Mode Switcher */}
          <div
            className="glass flex items-center rounded-lg p-0.5"
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
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                surfaceMode === "transparent"
                  ? "font-semibold"
                  : "opacity-65 hover:opacity-100"
              }`}
              style={
                surfaceMode === "transparent"
                  ? {
                      backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                      border: "1px solid rgba(var(--eco-primary-rgb), 0.45)",
                      color: "var(--eco-text)",
                    }
                  : { border: "1px solid transparent" }
              }
            >
              Прозрачный фон
            </button>
            <button
              type="button"
              onClick={() => setSurfaceMode("solid")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                surfaceMode === "solid"
                  ? "font-semibold"
                  : "opacity-65 hover:opacity-100"
              }`}
              style={
                surfaceMode === "solid"
                  ? {
                      backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                      border: "1px solid rgba(var(--eco-primary-rgb), 0.45)",
                      color: "var(--eco-text)",
                    }
                  : { border: "1px solid transparent" }
              }
            >
              Фон
            </button>
          </div>

          {/* Theme Switcher */}
          <div className="glass flex items-center gap-2 rounded-lg px-3 py-1.5">
            <Palette
              className="h-3.5 w-3.5 shrink-0 opacity-75"
              style={{ color: "var(--eco-primary)" }}
            />
            <select
              aria-label="Выбор темы"
              value={activeThemeId}
              onChange={(e) => selectTheme(e.target.value)}
              className="cursor-pointer bg-transparent pr-1 text-xs font-medium focus:outline-none"
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

      {/* MIDDLE ROW: Centered Workspace Stage + Right Command Rail */}
      <div className="relative z-10 my-3 grid min-h-0 flex-1 grid-cols-1 items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-5">
        {/* CENTER PAGE STAGE */}
        <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden px-1 sm:px-4">
          <AnimatePresence mode="wait">
            {activePage !== null ? (
              <motion.section
                key={activePage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="glass relative flex h-full max-h-[74svh] w-full max-w-4xl flex-col overflow-hidden rounded-xl p-5 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.85)] sm:p-6"
              >
                {/* Top accent hairline */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-[1px]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(var(--eco-primary-rgb), 0.45), transparent)",
                  }}
                />

                {/* Close Page Button */}
                <button
                  type="button"
                  onClick={() => setActivePage(null)}
                  title="Закрыть окно"
                  aria-label="Закрыть окно"
                  className="absolute right-4 top-4 z-20 rounded-md border border-white/10 bg-white/[0.04] p-1.5 opacity-65 transition-all hover:border-white/25 hover:bg-white/10 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col overflow-hidden pr-6">
                  {activePage === "news" && <NewsPanel />}
                  {activePage === "notes" && <NotesPanel />}
                  {activePage === "settings" && <SettingsPanel />}
                </div>
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
                  <div className="h-[1px] w-16 bg-white/20" />
                  <h1 className="text-shadow-crisp font-mono text-3xl font-semibold tracking-[0.28em] sm:text-5xl">
                    <span className="text-gradient-amber">AETHVORYN</span>
                  </h1>
                  <div className="h-[1px] w-16 bg-white/20" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT VERTICAL NAVIGATION */}
        <nav
          aria-label="Навигация"
          className="glass flex shrink-0 flex-row items-center justify-center gap-1.5 self-center rounded-xl p-1.5 shadow-xl lg:flex-col lg:items-stretch"
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
                className={`relative flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-xs font-medium transition-colors sm:text-[13px] ${
                  isActive
                    ? "font-semibold"
                    : "opacity-70 hover:bg-white/[0.05] hover:opacity-100"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: "rgba(var(--eco-primary-rgb), 0.14)",
                        border: "1px solid rgba(var(--eco-primary-rgb), 0.45)",
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

      {/* BOTTOM ROW: Status & Clock Instrument Bar */}
      <footer className="relative z-20 flex shrink-0 items-end justify-between gap-4">
        {etherConfig.displayMode !== "hidden" ? (
          <div
            data-ripple-host
            className="glass relative h-16 w-full max-w-md overflow-hidden rounded-xl px-4 py-2.5 shadow-xl"
          >
            <div className="absolute inset-0 opacity-75">
              <ParticleRipple />
            </div>

            {etherConfig.displayMode === "clock" && (
              <div className="pointer-events-none relative z-10 flex h-full items-center justify-between">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-xl font-semibold tabular-nums tracking-wider sm:text-2xl">
                    {clock.time || "—:—"}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-45">
                    LOC
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
                    публикаций
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
                    заметок
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
  );
}
