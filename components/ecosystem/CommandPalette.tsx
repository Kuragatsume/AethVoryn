"use client";

import {
  Bot,
  Calculator,
  Check,
  Copy,
  Download,
  FileText,
  Globe,
  Layers,
  Newspaper,
  Palette,
  Plus,
  Search,
  Sliders,
  Terminal,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { soundEngine } from "@/utils/soundEngine";
import { useEcosystem } from "./EcosystemContext";

function evaluateMathExpression(expr: string): string | null {
  const cleaned = expr.trim().replace(/,/g, ".");
  // Only evaluate if it looks like a math expression with at least one operator
  if (!/^[0-9+\-*/().\s%^]+$/.test(cleaned)) return null;
  if (!/[+\-*/%^]/.test(cleaned)) return null;
  try {
    const normalized = cleaned.replace(/\^/g, "**");
    // Safe evaluation on strictly numeric expression
    const result = Function(`"use strict"; return (${normalized});`)();
    if (typeof result === "number" && Number.isFinite(result)) {
      return Number.isInteger(result)
        ? String(result)
        : Number(result.toFixed(6)).toString();
    }
  } catch {
    /* ignore invalid syntax */
  }
  return null;
}

export default function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    windows,
    openWindow,
    closeAllWindows,
    activeWorkspace,
    setActiveWorkspace,
    themes,
    activeThemeId,
    selectTheme,
    surfaceMode,
    setSurfaceMode,
    sfxEnabled,
    setSfxEnabled,
    news,
    notes,
    addNote,
    exportProfileJson,
  } = useEcosystem();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedMath, setCopiedMath] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        soundEngine.playClick();
        setCommandPaletteOpen(!commandPaletteOpen);
      } else if (e.key === "Escape" && commandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [commandPaletteOpen]);

  const mathResult = useMemo(() => evaluateMathExpression(query), [query]);

  const actions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: {
      id: string;
      category: string;
      title: string;
      subtitle: string;
      icon: typeof Search;
      run: () => void;
    }[] = [];

    // 1. Windows
    windows.forEach((w) => {
      const icon =
        w.id === "news"
          ? Newspaper
          : w.id === "notes"
          ? FileText
          : w.id === "ai"
          ? Bot
          : w.id === "terminal"
          ? Terminal
          : w.id === "settings"
          ? Sliders
          : Globe;
      list.push({
        id: `win-${w.id}`,
        category: "Окна",
        title: `Открыть: ${w.title} [${w.code}]`,
        subtitle: w.isOpen ? "Активно на рабочем столе" : "Свёрнуто",
        icon,
        run: () => {
          openWindow(w.id);
          setCommandPaletteOpen(false);
        },
      });
    });

    // 2. Quick Actions
    list.push({
      id: "act-new-note",
      category: "Действия",
      title: q ? `Создать заметку: «${query.trim()}»` : "Создать новую заметку",
      subtitle: "Блокнот [02]",
      icon: Plus,
      run: () => {
        addNote({
          title: q ? query.trim() : "Быстрая заметка",
          content: "",
          tag: "Быстрое",
        });
        openWindow("notes");
        setCommandPaletteOpen(false);
      },
    });

    list.push({
      id: "act-clean-desktop",
      category: "Система",
      title: "Свернуть все окна (Чистый экран)",
      subtitle: "Показать видеофон и 3D-голограмму",
      icon: Layers,
      run: () => {
        closeAllWindows();
        setCommandPaletteOpen(false);
      },
    });

    list.push({
      id: "act-surface-toggle",
      category: "Система",
      title: `Режим панелей: переключить на ${
        surfaceMode === "transparent" ? "Сплошной" : "Прозрачный"
      }`,
      subtitle: `Сейчас: ${surfaceMode === "transparent" ? "Прозрачный" : "Сплошной"}`,
      icon: Layers,
      run: () => {
        setSurfaceMode(surfaceMode === "transparent" ? "solid" : "transparent");
        setCommandPaletteOpen(false);
      },
    });

    list.push({
      id: "act-sfx-toggle",
      category: "Аудио",
      title: sfxEnabled ? "Отключить звуки интерфейса (Mute SFX)" : "Включить звуки интерфейса (SFX)",
      subtitle: "Sci-Fi тактильный аудио-отклик",
      icon: sfxEnabled ? Volume2 : VolumeX,
      run: () => {
        setSfxEnabled(!sfxEnabled);
        setCommandPaletteOpen(false);
      },
    });

    list.push({
      id: "act-export-json",
      category: "Система",
      title: "Экспортировать профиль и бэкап (.JSON)",
      subtitle: "Сохранить заметки, рисунки Paint, сайты и темы",
      icon: Download,
      run: () => {
        exportProfileJson();
        setCommandPaletteOpen(false);
      },
    });

    // 3. Workspaces
    (["all", "1", "2", "3"] as const).forEach((ws) => {
      list.push({
        id: `ws-${ws}`,
        category: "Пространства",
        title:
          ws === "all"
            ? "Показать все окна (Все рабочие столы)"
            : `Переключить на Рабочий стол 0${ws}`,
        subtitle: activeWorkspace === ws ? "Активно сейчас" : "Виртуальный стол",
        icon: Layers,
        run: () => {
          setActiveWorkspace(ws);
          setCommandPaletteOpen(false);
        },
      });
    });

    // 4. Themes
    themes.forEach((t) => {
      list.push({
        id: `theme-${t.id}`,
        category: "Темы",
        title: `Тема: ${t.name}`,
        subtitle: t.id === activeThemeId ? "Установлена" : t.colors.primary,
        icon: Palette,
        run: () => {
          selectTheme(t.id);
          setCommandPaletteOpen(false);
        },
      });
    });

    // 5. Matching Notes
    notes.forEach((n) => {
      list.push({
        id: `note-${n.id}`,
        category: "Заметки",
        title: n.title,
        subtitle: n.content.slice(0, 75) || n.tag,
        icon: FileText,
        run: () => {
          openWindow("notes");
          setCommandPaletteOpen(false);
        },
      });
    });

    // 6. Matching News
    news.slice(0, 12).forEach((item) => {
      list.push({
        id: `news-${item.id}`,
        category: "Новости",
        title: item.title,
        subtitle: `${item.source} • ${item.category}`,
        icon: Newspaper,
        run: () => {
          openWindow("news");
          setCommandPaletteOpen(false);
        },
      });
    });

    if (!q) return list.slice(0, 14);
    return list
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
      .slice(0, 16);
  }, [
    query,
    windows,
    openWindow,
    setCommandPaletteOpen,
    addNote,
    closeAllWindows,
    surfaceMode,
    setSurfaceMode,
    sfxEnabled,
    setSfxEnabled,
    exportProfileJson,
    activeWorkspace,
    setActiveWorkspace,
    themes,
    activeThemeId,
    selectTheme,
    notes,
    news,
  ]);

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="glass relative w-full max-w-2xl overflow-hidden rounded-none border shadow-2xl"
        style={{ borderColor: "var(--eco-primary)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner brackets */}
        <span
          className="pointer-events-none absolute -left-[1px] -top-[1px] h-2.5 w-2.5 border-l-2 border-t-2"
          style={{ borderColor: "var(--eco-primary)" }}
        />
        <span
          className="pointer-events-none absolute -right-[1px] -top-[1px] h-2.5 w-2.5 border-r-2 border-t-2"
          style={{ borderColor: "var(--eco-primary)" }}
        />
        <span
          className="pointer-events-none absolute -bottom-[1px] -left-[1px] h-2.5 w-2.5 border-b-2 border-l-2"
          style={{ borderColor: "var(--eco-primary)" }}
        />
        <span
          className="pointer-events-none absolute -bottom-[1px] -right-[1px] h-2.5 w-2.5 border-b-2 border-r-2"
          style={{ borderColor: "var(--eco-primary)" }}
        />

        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-white/15 bg-black/50 px-4 py-3">
          <Search
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--eco-primary)" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              soundEngine.playKey();
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(actions.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (actions[selectedIndex]) {
                  actions[selectedIndex].run();
                }
              }
            }}
            placeholder="Поиск окон, заметок, новостей, тем или расчёт (напр. 1920 * 9 / 16)..."
            className="w-full bg-transparent font-mono text-xs text-white placeholder-white/40 focus:outline-none sm:text-sm"
          />
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(false)}
            className="border border-white/15 px-1.5 py-0.5 font-mono text-[10px] uppercase opacity-60 hover:opacity-100"
          >
            ESC
          </button>
        </div>

        {/* Instant Calculator Result Banner */}
        {mathResult !== null && (
          <div
            className="flex items-center justify-between border-b border-white/15 px-4 py-2.5 font-mono"
            style={{ backgroundColor: "rgba(var(--eco-primary-rgb), 0.14)" }}
          >
            <div className="flex items-center gap-2.5">
              <Calculator
                className="h-4 w-4"
                style={{ color: "var(--eco-primary)" }}
              />
              <span className="text-xs opacity-70">{query} =</span>
              <span
                className="text-base font-bold"
                style={{ color: "var(--eco-primary)" }}
              >
                {mathResult}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(mathResult);
                setCopiedMath(true);
                window.setTimeout(() => setCopiedMath(false), 1500);
              }}
              className="inline-flex items-center gap-1 border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-wider hover:border-white/50"
            >
              {copiedMath ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" /> Скопировано
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Копировать
                </>
              )}
            </button>
          </div>
        )}

        {/* Action Results List */}
        <div className="max-h-[55vh] overflow-y-auto divide-y divide-white/5 p-1.5 font-mono">
          {actions.length === 0 ? (
            <div className="py-8 text-center text-xs opacity-50">
              Команды не найдены. Нажмите Enter для создания заметки.
            </div>
          ) : (
            actions.map((item, idx) => {
              const Icon = item.icon;
              const active = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={item.run}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors ${
                    active ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                  style={
                    active
                      ? {
                          borderLeft: "2px solid var(--eco-primary)",
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.14)",
                        }
                      : { borderLeft: "2px solid transparent" }
                  }
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: active ? "var(--eco-primary)" : undefined }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-white">
                        {item.title}
                      </div>
                      <div className="truncate text-[10px] opacity-55">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 border border-white/10 bg-black/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider opacity-65">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="flex items-center justify-between border-t border-white/10 bg-black/60 px-4 py-1.5 font-mono text-[10px] opacity-60">
          <span>↑↓ Навигация • Enter Выполнить</span>
          <span>AETHVORYN COMMAND PALETTE [CTRL+K]</span>
        </div>
      </div>
    </div>
  );
}
