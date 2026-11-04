"use client";

import {
  FileText,
  Globe,
  Layers,
  Newspaper,
  Palette,
  Plus,
  Sliders,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import ParticleRipple from "../ui/ParticleRipple";
import DesktopWindow from "./DesktopWindow";
import { useEcosystem } from "./EcosystemContext";
import NewsPanel from "./NewsPanel";
import NotesPanel from "./NotesPanel";
import SettingsPanel from "./SettingsPanel";
import SiteWindowPanel from "./SiteWindowPanel";

const BUILTIN_ICONS: Record<string, typeof Newspaper> = {
  news: Newspaper,
  notes: FileText,
  settings: Sliders,
};

export default function EcosystemShell() {
  const {
    windows,
    activeWindowId,
    toggleWindow,
    closeAllWindows,
    addSiteWindow,
    removeSiteWindow,
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

  // Bottom-Right "Add Website" popover state
  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [siteUrlInput, setSiteUrlInput] = useState("");
  const [siteTitleInput, setSiteTitleInput] = useState("");

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

  const handleAddSiteSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!siteUrlInput.trim()) return;
    addSiteWindow(siteUrlInput, siteTitleInput);
    setSiteUrlInput("");
    setSiteTitleInput("");
    setAddSiteOpen(false);
  };

  const anyWindowOpen = windows.some((w) => w.isOpen);

  return (
    <div className="relative flex h-[100svh] w-full flex-col justify-between overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
      {/* TOP BAR */}
      <header className="pointer-events-none relative z-[9980] flex shrink-0 flex-wrap items-center justify-between gap-3">
        {/* Top-Left Brand Mark (Closes all windows to show clean desktop) */}
        <button
          type="button"
          onClick={closeAllWindows}
          title="Свернуть все окна (Чистый экран)"
          className="glass pointer-events-auto group relative inline-flex items-center gap-3 rounded-none px-3.5 py-2 text-left transition-colors hover:border-white/35"
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
            [OS]
          </span>
        </button>

        {/* Top-Right Controls */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
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

      {/* CENTER WATERMARK WHEN NO WINDOWS ARE OPEN */}
      {!anyWindowOpen && (
        <div className="pointer-events-none fixed inset-0 z-0 flex select-none items-center justify-center text-center">
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
        </div>
      )}

      {/* MULTI-WINDOW DESKTOP LAYER (FREE FLOATING, OVERLAPPING, FULL-SCREEN CAPABLE) */}
      {windows.map((win) => {
        if (!win.isOpen) return null;
        const isActive = win.id === activeWindowId;
        return (
          <DesktopWindow key={win.id} win={win} isActive={isActive}>
            {win.id === "news" && <NewsPanel />}
            {win.id === "notes" && <NotesPanel />}
            {win.id === "settings" && <SettingsPanel />}
            {win.kind === "site" && <SiteWindowPanel win={win} />}
          </DesktopWindow>
        );
      })}

      {/* RIGHT VERTICAL COMMAND RAIL (МЕНЮ СПРАВА: СИСТЕМНЫЕ ОКНА + ДОБАВЛЕННЫЕ САЙТЫ) */}
      <nav
        aria-label="Меню окон и сайтов"
        className="glass fixed right-4 top-1/2 z-[9985] flex max-h-[72vh] -translate-y-1/2 flex-col items-stretch gap-1.5 overflow-y-auto rounded-none p-1.5 shadow-2xl sm:right-6"
      >
        {windows.map((win, index) => {
          const Icon =
            win.kind === "builtin"
              ? BUILTIN_ICONS[win.id] || Newspaper
              : Globe;
          const isOpen = win.isOpen;
          const isFocused = win.id === activeWindowId && isOpen;
          const isFirstSite =
            win.kind === "site" &&
            (index === 0 || windows[index - 1]?.kind === "builtin");

          return (
            <div key={win.id} className="flex flex-col">
              {isFirstSite && (
                <div className="my-1 flex items-center gap-1.5 px-2">
                  <div className="h-[1px] flex-1 bg-white/15" />
                  <span className="font-mono text-[9px] uppercase tracking-widest opacity-40">
                    Сайты
                  </span>
                  <div className="h-[1px] flex-1 bg-white/15" />
                </div>
              )}

              <div className="group/navitem relative flex items-center">
                <button
                  type="button"
                  onClick={() => toggleWindow(win.id)}
                  title={
                    isOpen
                      ? `Закрыть окно «${win.title}»`
                      : `Открыть окно «${win.title}»`
                  }
                  className={`relative flex w-full items-center gap-2.5 rounded-none px-3.5 py-2.5 text-left text-xs font-medium transition-colors sm:text-[13px] ${
                    win.kind === "site" ? "pr-7" : ""
                  } ${
                    isOpen
                      ? "font-semibold"
                      : "opacity-70 hover:bg-white/[0.05] hover:opacity-100"
                  }`}
                  style={
                    isOpen
                      ? {
                          backgroundColor: isFocused
                            ? "rgba(var(--eco-primary-rgb), 0.22)"
                            : "rgba(var(--eco-primary-rgb), 0.10)",
                          border: isFocused
                            ? "1px solid rgba(var(--eco-primary-rgb), 0.75)"
                            : "1px solid rgba(var(--eco-primary-rgb), 0.35)",
                        }
                      : { border: "1px solid transparent" }
                  }
                >
                  {/* Active state left bar */}
                  {isOpen && (
                    <span
                      className="absolute bottom-1 left-0 top-1 w-[2px]"
                      style={{
                        backgroundColor: "var(--eco-primary)",
                        opacity: isFocused ? 1 : 0.5,
                      }}
                    />
                  )}

                  <span className="hidden font-mono text-[10px] opacity-45 lg:inline">
                    {win.code}
                  </span>
                  <Icon
                    className="relative h-4 w-4 shrink-0"
                    style={isOpen ? { color: "var(--eco-primary)" } : undefined}
                  />
                  <span className="relative max-w-[120px] truncate">
                    {win.title}
                  </span>
                </button>

                {/* Delete custom site button on hover */}
                {win.kind === "site" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSiteWindow(win.id);
                    }}
                    title={`Удалить сайт «${win.title}» из меню`}
                    className="absolute right-1.5 p-1 opacity-0 transition-opacity hover:text-rose-400 group-hover/navitem:opacity-75"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* BOTTOM ROW: Left Telemetry Bar + Right "Add Website" Button */}
      <footer className="pointer-events-none relative z-[9980] mt-auto flex shrink-0 items-end justify-between gap-4">
        {/* Bottom-Left Telemetry Widget */}
        {etherConfig.displayMode !== "hidden" ? (
          <div
            data-ripple-host
            className="glass pointer-events-auto relative h-16 w-full max-w-md overflow-hidden rounded-none px-4 py-2.5 shadow-xl"
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

        {/* BOTTOM-RIGHT: ADD WEBSITE BUTTON & POPOVER */}
        <div className="pointer-events-auto relative flex flex-col items-end">
          {addSiteOpen && (
            <form
              onSubmit={handleAddSiteSubmit}
              className="glass mb-2.5 w-80 rounded-none border p-3.5 shadow-2xl sm:w-96"
              style={{
                borderColor: "rgba(var(--eco-primary-rgb), 0.55)",
              }}
            >
              {/* HUD Corner brackets */}
              <span
                aria-hidden
                className="pointer-events-none absolute -left-[1px] -top-[1px] h-2.5 w-2.5 border-l-2 border-t-2"
                style={{ borderColor: "var(--eco-primary)" }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-[1px] -top-[1px] h-2.5 w-2.5 border-r-2 border-t-2"
                style={{ borderColor: "var(--eco-primary)" }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-[1px] -left-[1px] h-2.5 w-2.5 border-b-2 border-l-2"
                style={{ borderColor: "var(--eco-primary)" }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-[1px] -right-[1px] h-2.5 w-2.5 border-b-2 border-r-2"
                style={{ borderColor: "var(--eco-primary)" }}
              />

              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider">
                  <Globe
                    className="h-3.5 w-3.5"
                    style={{ color: "var(--eco-primary)" }}
                  />
                  <span>Добавить сайт в меню</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAddSiteOpen(false)}
                  className="p-0.5 opacity-60 hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wider opacity-65">
                    Ссылка на сайт (URL) *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={siteUrlInput}
                    onChange={(e) => setSiteUrlInput(e.target.value)}
                    placeholder="https://example.com или wikipedia.org"
                    className="w-full rounded-none border border-white/15 bg-black/60 px-2.5 py-2 font-mono text-xs text-white focus:border-white/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wider opacity-65">
                    Название в меню (необязательно)
                  </label>
                  <input
                    type="text"
                    value={siteTitleInput}
                    onChange={(e) => setSiteTitleInput(e.target.value)}
                    placeholder="Автоматически по домену"
                    className="w-full rounded-none border border-white/15 bg-black/60 px-2.5 py-1.5 font-mono text-xs text-white focus:border-white/40 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAddSiteOpen(false)}
                    className="rounded-none border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] opacity-75 hover:opacity-100"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-none border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                    style={{
                      backgroundColor: "rgba(var(--eco-primary-rgb), 0.22)",
                      borderColor: "var(--eco-primary)",
                      color: "var(--eco-text)",
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Добавить
                  </button>
                </div>
              </div>
            </form>
          )}

          <button
            type="button"
            onClick={() => setAddSiteOpen((v) => !v)}
            title="Добавить новый сайт в правое меню"
            className="glass group relative inline-flex items-center gap-2.5 rounded-none px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider shadow-xl transition-colors hover:border-white/40"
            style={
              addSiteOpen
                ? {
                    backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                    borderColor: "var(--eco-primary)",
                  }
                : undefined
            }
          >
            {/* Corner ticks */}
            <span
              className="pointer-events-none absolute -left-[1px] -top-[1px] h-1.5 w-1.5 border-l border-t"
              style={{ borderColor: "var(--eco-primary)" }}
            />
            <span
              className="pointer-events-none absolute -bottom-[1px] -right-[1px] h-1.5 w-1.5 border-b border-r"
              style={{ borderColor: "var(--eco-primary)" }}
            />

            <Plus
              className="h-3.5 w-3.5 transition-transform group-hover:rotate-90"
              style={{ color: "var(--eco-primary)" }}
            />
            <span>Добавить сайт</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
