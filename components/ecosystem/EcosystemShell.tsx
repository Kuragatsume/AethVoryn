"use client";

import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Command,
  FileText,
  Globe,
  Layers,
  Newspaper,
  Palette,
  Sliders,
  Terminal,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { soundEngine } from "@/utils/soundEngine";
import HologramCore from "../ui/HologramCore";
import AiAssistantPanel from "./AiAssistantPanel";
import CommandPalette from "./CommandPalette";
import DesktopWindow from "./DesktopWindow";
import DraggableAddSiteWidget from "./DraggableAddSiteWidget";
import DraggableTelemetryWidget from "./DraggableTelemetryWidget";
import { useEcosystem, type WorkspaceId } from "./EcosystemContext";
import NewsPanel from "./NewsPanel";
import NotesPanel from "./NotesPanel";
import SettingsPanel from "./SettingsPanel";
import SiteWindowPanel from "./SiteWindowPanel";
import TerminalPanel from "./TerminalPanel";

const BUILTIN_ICONS: Record<string, typeof Newspaper> = {
  news: Newspaper,
  notes: FileText,
  ai: Bot,
  terminal: Terminal,
  settings: Sliders,
};

export default function EcosystemShell() {
  const {
    windows,
    activeWindowId,
    toggleWindow,
    closeAllWindows,
    removeSiteWindow,
    activeWorkspace,
    setActiveWorkspace,
    commandPaletteOpen,
    setCommandPaletteOpen,
    hologramEnabled,
    surfaceMode,
    setSurfaceMode,
    themes,
    activeThemeId,
    selectTheme,
  } = useEcosystem();

  const [clock, setClock] = useState<{ time: string; date: string }>({
    time: "",
    date: "",
  });
  const [railCollapsed, setRailCollapsed] = useState(false);

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

  const visibleWindows = windows.filter(
    (w) =>
      w.isOpen &&
      (activeWorkspace === "all" ||
        !w.workspace ||
        w.workspace === activeWorkspace)
  );

  const anyWindowOpen = visibleWindows.length > 0;
  const anyWindowMaximized = visibleWindows.some((w) => w.isMaximized);
  const anyWindowOverTopBar = visibleWindows.some(
    (w) => !w.isMaximized && w.y < 58
  );

  // Hide top bar if a window is maximized or dragged directly over the top header bar
  const hideTopHeader = anyWindowMaximized || anyWindowOverTopBar;

  return (
    <div
      className="relative w-full"
      style={{ minHeight: "var(--bg-video-height, 100vh)" }}
    >
      {/* COMMAND PALETTE MODAL (CTRL+K) */}
      <CommandPalette />

      {/* TOP BAR (STANDS IN PLACE ON THE PAGE; HIDES WHEN WINDOW IS MAXIMIZED SO IT NEVER COVERS WINDOW BUTTONS) */}
      <header
        className={`pointer-events-none absolute left-4 right-4 top-4 z-[20] flex shrink-0 flex-wrap items-center justify-between gap-2.5 transition-opacity duration-200 sm:left-6 sm:right-6 sm:top-5 ${
          hideTopHeader
            ? "pointer-events-none invisible opacity-0"
            : "opacity-100"
        }`}
      >
        {/* Top-Left Brand Mark + Virtual Workspaces Switcher */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={closeAllWindows}
            title="Свернуть все окна (Чистый экран)"
            className="glass group relative inline-flex items-center gap-3 rounded-none px-3.5 py-2 text-left transition-colors hover:border-white/35"
          >
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

          {/* Virtual Workspaces Switcher (WS: ВСЕ / 01 / 02 / 03) */}
          <div
            className="glass hidden items-center rounded-none p-0.5 font-mono text-[10px] md:flex"
            role="group"
            aria-label="Виртуальные рабочие столы"
          >
            <span
              className="px-2 uppercase tracking-wider opacity-45"
              title="Виртуальные рабочие столы (группировка окон)"
            >
              WS:
            </span>
            {(
              [
                {
                  id: "all",
                  label: "ВСЕ",
                  tip: "Показать все открытые окна сразу",
                },
                {
                  id: "1",
                  label: "01",
                  tip: "Рабочий стол 01: Новости и ИИ-Ассистент",
                },
                {
                  id: "2",
                  label: "02",
                  tip: "Рабочий стол 02: Блокнот и Терминал",
                },
                {
                  id: "3",
                  label: "03",
                  tip: "Рабочий стол 03: Настройки и добавленные сайты",
                },
              ] as { id: WorkspaceId; label: string; tip: string }[]
            ).map((ws) => {
              const active = activeWorkspace === ws.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  title={ws.tip}
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveWorkspace(ws.id);
                  }}
                  className={`rounded-none px-2 py-1 transition-colors ${
                    active
                      ? "font-bold text-white"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                          border: "1px solid rgba(var(--eco-primary-rgb), 0.5)",
                        }
                      : { border: "1px solid transparent" }
                  }
                >
                  {ws.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Top-Right Controls */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {/* Command Palette Trigger (Ctrl+K) */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setCommandPaletteOpen(!commandPaletteOpen);
            }}
            title="Быстрый поиск, калькулятор и палитра команд (Ctrl+K)"
            className="glass inline-flex items-center gap-1.5 rounded-none px-2.5 py-1.5 font-mono text-xs transition-colors hover:border-white/35"
          >
            <Command
              className="h-3.5 w-3.5"
              style={{ color: "var(--eco-primary)" }}
            />
            <span className="hidden sm:inline">Команды</span>
            <kbd className="border border-white/15 bg-black/50 px-1 py-0.5 text-[9px] opacity-65">
              Ctrl+K
            </kbd>
          </button>

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
              onClick={() => {
                soundEngine.playClick();
                setSurfaceMode("transparent");
              }}
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
              onClick={() => {
                soundEngine.playClick();
                setSurfaceMode("solid");
              }}
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
              Сплошной
            </button>
          </div>

          {/* Quick Theme Selector */}
          <div className="glass relative flex items-center rounded-none px-2.5 py-1">
            <Palette
              className="mr-1.5 h-3.5 w-3.5 opacity-60"
              style={{ color: "var(--eco-primary)" }}
            />
            <select
              aria-label="Выбор цветовой схемы"
              value={activeThemeId}
              onChange={(e) => selectTheme(e.target.value)}
              className="cursor-pointer bg-transparent pr-2 text-xs font-medium focus:outline-none"
              style={{ color: "var(--eco-text)" }}
            >
              {themes.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  className="bg-[#0b0e14] text-white"
                >
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* 3D INTERACTIVE HOLOGRAM OBJECT (DRAGGABLE WITH LEFT MOUSE BUTTON) */}
      {hologramEnabled && !anyWindowMaximized && <HologramCore />}

      {/* CENTER WATERMARK WHEN NO WINDOWS ARE OPEN */}
      {!anyWindowOpen && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] flex h-[100svh] select-none items-center justify-center text-center">
          <div className="relative z-10 inline-flex flex-col items-center gap-2">
            <div className="h-[1px] w-20 bg-white/25" />
            <h1 className="text-shadow-crisp font-mono text-3xl font-semibold tracking-[0.32em] sm:text-5xl">
              <span className="text-gradient-amber">AETHVORYN</span>
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-55">
              DIGITAL WORKSPACE ARCHITECTURE
            </span>
            <div className="h-[1px] w-20 bg-white/25" />
          </div>
        </div>
      )}

      {/* MULTI-WINDOW DESKTOP LAYER (STANDS IN PLACE ON PAGE; MAXIMIZED WINDOWS TAKE FULL VIEWPORT) */}
      {visibleWindows.map((win) => {
        const isActive = win.id === activeWindowId;
        return (
          <DesktopWindow key={win.id} win={win} isActive={isActive}>
            {win.id === "news" && <NewsPanel />}
            {win.id === "notes" && <NotesPanel />}
            {win.id === "ai" && <AiAssistantPanel />}
            {win.id === "terminal" && <TerminalPanel />}
            {win.id === "settings" && <SettingsPanel />}
            {win.kind === "site" && <SiteWindowPanel win={win} />}
          </DesktopWindow>
        );
      })}

      {/* RIGHT VERTICAL COMMAND RAIL (ПРИКРЕПЛЕНА К ЭКРАНУ: СИСТЕМНЫЕ ОКНА + ДОБАВЛЕННЫЕ САЙТЫ) */}
      <nav
        aria-label="Меню окон и сайтов"
        className="glass fixed right-3 top-1/2 z-[9990] flex max-h-[82vh] -translate-y-1/2 flex-col items-stretch gap-1.5 overflow-y-auto rounded-none p-1.5 shadow-2xl sm:right-5"
      >
        {/* Top Rail Collapse / Quick Command Header */}
        <div className="flex items-center justify-between gap-1 border-b border-white/10 pb-1">
          {!railCollapsed && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setCommandPaletteOpen(true);
              }}
              title="Палитра команд (Ctrl+K)"
              className="flex flex-1 items-center justify-center gap-1 border border-white/10 bg-white/[0.04] px-1.5 py-1 font-mono text-[9px] uppercase tracking-wider opacity-75 hover:border-white/30 hover:opacity-100"
            >
              <Command className="h-2.5 w-2.5" style={{ color: "var(--eco-primary)" }} />
              <span>⌘K</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setRailCollapsed((v) => !v);
            }}
            title={
              railCollapsed
                ? "Развернуть боковое меню"
                : "Компактный режим меню (только иконки)"
            }
            className="flex items-center justify-center border border-white/10 bg-white/[0.04] p-1 opacity-70 hover:border-white/30 hover:opacity-100"
          >
            {railCollapsed ? (
              <ChevronLeft className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        </div>

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
            <div key={win.id} className=" flex flex-col gap-1.5">
              {isFirstSite && (
                <div className="my-0.5 border-t border-white/15 pt-1 text-center font-mono text-[8px] uppercase tracking-widest opacity-40">
                  {railCollapsed ? "•••" : "Сайты"}
                </div>
              )}

              <div className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      activeWorkspace !== "all" &&
                      win.workspace &&
                      win.workspace !== activeWorkspace
                    ) {
                      setActiveWorkspace("all");
                    }
                    toggleWindow(win.id);
                  }}
                  title={`${win.title} (${isOpen ? "Открыто" : "Закрыто"})`}
                  className={`relative flex w-full flex-col items-center gap-1 rounded-none px-2.5 py-2 font-mono transition-all ${
                    railCollapsed ? "min-w-[40px]" : "min-w-[60px]"
                  } ${
                    isOpen
                      ? "opacity-100"
                      : "opacity-60 hover:bg-white/[0.04] hover:opacity-100"
                  }`}
                  style={
                    isFocused
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.22)",
                          border: "1px solid var(--eco-primary)",
                          color: "var(--eco-text)",
                        }
                      : isOpen
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.09)",
                          border: "1px solid rgba(var(--eco-primary-rgb), 0.35)",
                          color: "var(--eco-text)",
                        }
                      : { border: "1px solid transparent" }
                  }
                >
                  {/* Open state indicator dot */}
                  {isOpen && (
                    <span
                      className="absolute left-1 top-1 h-1.5 w-1.5"
                      style={{ backgroundColor: "var(--eco-primary)" }}
                    />
                  )}

                  {!railCollapsed && (
                    <span className="text-[9px] tracking-widest opacity-45">
                      {win.code}
                    </span>
                  )}
                  <Icon
                    className="h-4 w-4"
                    style={{
                      color: isOpen ? "var(--eco-primary)" : "currentColor",
                    }}
                  />
                  {!railCollapsed && (
                    <span className="max-w-[68px] truncate text-[9px] font-medium uppercase tracking-wider">
                      {win.title}
                    </span>
                  )}
                </button>

                {/* Delete custom website button on hover */}
                {win.kind === "site" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSiteWindow(win.id);
                    }}
                    title={`Удалить сайт «${win.title}» из меню`}
                    className=" absolute -left-2 -top-1 hidden h-4 w-4 items-center justify-center border border-rose-500/50 bg-black text-rose-400 group-hover:flex hover:bg-rose-500 hover:text-white"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* DRAGGABLE HUD WIDGETS (STAND IN PLACE ON THE PAGE; HIDDEN WHEN A WINDOW IS MAXIMIZED) */}
      <DraggableTelemetryWidget
        clock={clock}
        hiddenByMaximize={anyWindowMaximized}
      />
      <DraggableAddSiteWidget hiddenByMaximize={anyWindowMaximized} />
    </div>
  );
}
