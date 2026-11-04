"use client";

import {
  Activity,
  Check,
  Film,
  Link2,
  Palette,
  Play,
  Plus,
  RotateCcw,
  Sliders,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import SpotlightCard from "../ui/SpotlightCard";
import {
  useEcosystem,
  type EtherDisplayMode,
  type ThemeColors,
} from "./EcosystemContext";

const COLOR_FIELDS: {
  key: keyof Pick<
    ThemeColors,
    "primary" | "secondary" | "surface" | "background" | "text"
  >;
  label: string;
  tooltip: string;
}[] = [
  {
    key: "primary",
    label: "Основной акцент",
    tooltip: "Активные элементы, рамки и индикаторы",
  },
  {
    key: "secondary",
    label: "Вторичный тон",
    tooltip: "Вспомогательные метки и детали",
  },
  {
    key: "surface",
    label: "Поверхность панелей",
    tooltip: "Базовый цвет рабочих окон и карточек",
  },
  {
    key: "background",
    label: "Подложка экрана",
    tooltip: "Основной фоновый цвет страницы",
  },
  {
    key: "text",
    label: "Основной текст",
    tooltip: "Цвет типографики во всех разделах",
  },
];

const ETHER_MODES: { id: EtherDisplayMode; label: string; tooltip: string }[] = [
  { id: "clock", label: "Часы и дата", tooltip: "Отображать текущее время и дату" },
  { id: "stats", label: "Сводка", tooltip: "Количество публикаций и заметок" },
  { id: "custom", label: "Текст", tooltip: "Произвольная текстовая метка" },
  { id: "particles_only", label: "Матрица", tooltip: "Только точечная сетка без текста" },
  { id: "hidden", label: "Скрыть", tooltip: "Отключить нижний блок" },
];

export default function SettingsPanel() {
  const {
    themes,
    activeThemeId,
    theme,
    selectTheme,
    updateActiveThemeColors,
    addCustomTheme,
    deleteCustomTheme,
    resetActiveTheme,
    backdropMode,
    setBackdropMode,
    etherConfig,
    updateEtherConfig,
    videos,
    activeVideoId,
    selectVideo,
    addCustomVideoFile,
    addCustomVideoUrl,
    removeCustomVideo,
    loopVideo,
    setLoopVideo,
    replayVideo,
  } = useEcosystem();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlTitle, setUrlTitle] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlFormOpen, setUrlFormOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [addingTheme, setAddingTheme] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await addCustomVideoFile(file);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleUrlSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    addCustomVideoUrl(urlTitle, urlInput);
    setUrlTitle("");
    setUrlInput("");
    setUrlFormOpen(false);
  };

  const handleCreateTheme = (e: FormEvent) => {
    e.preventDefault();
    addCustomTheme(newThemeName);
    setNewThemeName("");
    setAddingTheme(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] uppercase tracking-widest opacity-45">
            03 //
          </span>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Конфигурация системы
          </h2>
        </div>

        <button
          type="button"
          onClick={resetActiveTheme}
          title="Вернуть стандартные параметры текущей темы"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium transition-colors hover:border-white/25 hover:bg-white/[0.08]"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Сбросить параметры
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
        {/* SECTION 1: Themes & Colors */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 opacity-75" style={{ color: "var(--eco-primary)" }} />
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider opacity-85">
                Цветовые схемы
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setAddingTheme((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs font-medium hover:bg-white/[0.08]"
            >
              <Plus className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
              Создать схему
            </button>
          </div>

          {addingTheme && (
            <form
              onSubmit={handleCreateTheme}
              className="glass-subtle flex items-center gap-2 rounded-lg p-2.5"
            >
              <input
                type="text"
                required
                placeholder="Название схемы..."
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-xs focus:border-white/25 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md border px-3.5 py-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                  borderColor: "var(--eco-primary)",
                }}
              >
                Сохранить
              </button>
            </form>
          )}

          {/* Theme List */}
          <div className="grid gap-2 sm:grid-cols-3">
            {themes.map((item) => {
              const isCurrent = item.id === activeThemeId;
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectTheme(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectTheme(item.id);
                    }
                  }}
                  className="glass-subtle flex cursor-pointer items-center justify-between gap-2 rounded-lg p-2.5 text-left transition-colors hover:border-white/25"
                  style={
                    isCurrent
                      ? {
                          borderColor: "var(--eco-primary)",
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.08)",
                        }
                      : undefined
                  }
                >
                  <span className="truncate text-xs font-medium">
                    {item.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <span
                      className="h-3 w-3 rounded-[2px] border border-white/20"
                      style={{ backgroundColor: item.colors.primary }}
                    />
                    <span
                      className="h-3 w-3 rounded-[2px] border border-white/20"
                      style={{ backgroundColor: item.colors.secondary }}
                    />
                    <span
                      className="h-3 w-3 rounded-[2px] border border-white/20"
                      style={{ backgroundColor: item.colors.background }}
                    />
                    {item.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomTheme(item.id);
                        }}
                        title="Удалить схему"
                        className="ml-1 rounded p-0.5 opacity-60 hover:text-rose-400 hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    {isCurrent && !item.isCustom && (
                      <Check
                        className="ml-1 h-3.5 w-3.5"
                        style={{ color: "var(--eco-primary)" }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color Pickers for Active Theme */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {COLOR_FIELDS.map((field) => {
              const value = theme[field.key];
              return (
                <div
                  key={field.key}
                  title={field.tooltip}
                  className="glass-subtle flex items-center justify-between gap-2 rounded-lg p-2.5"
                >
                  <span className="truncate text-xs font-medium opacity-85">
                    {field.label}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        updateActiveThemeColors({ [field.key]: e.target.value })
                      }
                      aria-label={`${field.label} HEX`}
                      className="w-20 rounded-md border border-white/10 bg-black/35 px-2 py-1 text-center font-mono text-xs uppercase focus:border-white/25 focus:outline-none"
                    />
                    <label className="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/20">
                      <span
                        className="block h-full w-full"
                        style={{ backgroundColor: value }}
                      />
                      <input
                        type="color"
                        value={
                          /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#CBD5E1"
                        }
                        onChange={(e) =>
                          updateActiveThemeColors({
                            [field.key]: e.target.value.toUpperCase(),
                          })
                        }
                        aria-label={field.label}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: Status Instrument Panel */}
        <section className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 opacity-75" style={{ color: "var(--eco-primary)" }} />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider opacity-85">
              Информационная панель
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ETHER_MODES.map((m) => {
              const active = etherConfig.displayMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  title={m.tooltip}
                  onClick={() => updateEtherConfig({ displayMode: m.id })}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "font-semibold"
                      : "border-white/10 bg-white/[0.03] opacity-75 hover:border-white/20 hover:opacity-100"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                          borderColor: "var(--eco-primary)",
                        }
                      : undefined
                  }
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {etherConfig.displayMode === "custom" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={etherConfig.customTitle}
                onChange={(e) =>
                  updateEtherConfig({ customTitle: e.target.value })
                }
                placeholder="Заголовок..."
                className="rounded-md border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs focus:border-white/25 focus:outline-none"
              />
              <input
                type="text"
                value={etherConfig.customSubtitle}
                onChange={(e) =>
                  updateEtherConfig({ customSubtitle: e.target.value })
                }
                placeholder="Подзаголовок..."
                className="rounded-md border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs focus:border-white/25 focus:outline-none"
              />
            </div>
          )}
        </section>

        {/* SECTION 3: Background Video & Backdrop Mode */}
        <section className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Film className="h-3.5 w-3.5 opacity-75" style={{ color: "var(--eco-primary)" }} />
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider opacity-85">
                Фоновый режим
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-md border border-white/10 bg-black/30 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setBackdropMode("video")}
                  className={`rounded-sm px-2.5 py-1 font-medium transition-colors ${
                    backdropMode === "video"
                      ? "font-semibold"
                      : "opacity-65 hover:opacity-100"
                  }`}
                  style={
                    backdropMode === "video"
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.18)",
                          color: "var(--eco-text)",
                        }
                      : undefined
                  }
                >
                  Видео
                </button>
                <button
                  type="button"
                  onClick={() => setBackdropMode("color")}
                  className={`rounded-sm px-2.5 py-1 font-medium transition-colors ${
                    backdropMode === "color"
                      ? "font-semibold"
                      : "opacity-65 hover:opacity-100"
                  }`}
                  style={
                    backdropMode === "color"
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.18)",
                          color: "var(--eco-text)",
                        }
                      : undefined
                  }
                >
                  Сплошной цвет
                </button>
              </div>

              <div className="flex rounded-md border border-white/10 bg-black/30 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setLoopVideo(false)}
                  title="Остановить на последнем кадре"
                  className={`rounded-sm px-2.5 py-1 font-medium transition-colors ${
                    !loopVideo
                      ? "font-semibold"
                      : "opacity-65 hover:opacity-100"
                  }`}
                  style={
                    !loopVideo
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.18)",
                          color: "var(--eco-text)",
                        }
                      : undefined
                  }
                >
                  Однократно
                </button>
                <button
                  type="button"
                  onClick={() => setLoopVideo(true)}
                  title="Зациклить воспроизведение"
                  className={`rounded-sm px-2.5 py-1 font-medium transition-colors ${
                    loopVideo
                      ? "font-semibold"
                      : "opacity-65 hover:opacity-100"
                  }`}
                  style={
                    loopVideo
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.18)",
                          color: "var(--eco-text)",
                        }
                      : undefined
                  }
                >
                  Цикл
                </button>
              </div>

              <button
                type="button"
                onClick={replayVideo}
                title="Перезапустить видео"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs font-medium hover:bg-white/[0.08]"
              >
                <Play className="h-3 w-3" style={{ color: "var(--eco-primary)" }} />
                Повтор
              </button>
            </div>
          </div>

          {/* Video Presets Grid */}
          <div className="grid gap-2 sm:grid-cols-3">
            {videos.map((v) => {
              const active = v.id === activeVideoId && backdropMode === "video";
              return (
                <SpotlightCard key={v.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    title={v.subtitle}
                    onClick={() => selectVideo(v.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectVideo(v.id);
                      }
                    }}
                    className="flex h-full cursor-pointer flex-col justify-between p-3 text-left transition-colors"
                    style={
                      active
                        ? {
                            boxShadow: "inset 0 0 0 1px var(--eco-primary)",
                            backgroundColor: "rgba(var(--eco-primary-rgb), 0.06)",
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider"
                        style={{
                          backgroundColor: active
                            ? "rgba(var(--eco-primary-rgb), 0.2)"
                            : "rgba(255,255,255,0.06)",
                          color: active ? "var(--eco-primary)" : undefined,
                          border: active
                            ? "1px solid rgba(var(--eco-primary-rgb), 0.45)"
                            : "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {active ? "АКТИВНО" : v.badge}
                      </span>
                      {v.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomVideo(v.id);
                          }}
                          title="Удалить видео"
                          className="rounded p-1 opacity-60 hover:bg-rose-500/20 hover:text-rose-300 hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-snug">
                      {v.title}
                    </p>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-dashed border-white/20 bg-white/[0.03] px-4 py-2 text-xs font-medium transition-colors hover:border-white/35 hover:bg-white/[0.06]"
            >
              <Upload className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
              {uploading ? "Загрузка..." : "Загрузить файл (.mp4 / .webm)"}
            </button>
            <button
              type="button"
              onClick={() => setUrlFormOpen((o) => !o)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/[0.03] px-3.5 py-2 text-xs font-medium transition-colors hover:bg-white/[0.06]"
            >
              <Link2 className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
              Указать URL
            </button>
          </div>

          {urlFormOpen && (
            <form
              onSubmit={handleUrlSubmit}
              className="glass-subtle flex flex-wrap items-center gap-2 rounded-lg p-2.5"
            >
              <input
                type="text"
                placeholder="Название..."
                value={urlTitle}
                onChange={(e) => setUrlTitle(e.target.value)}
                className="w-40 rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-xs focus:border-white/25 focus:outline-none"
              />
              <input
                type="url"
                required
                placeholder="https://example.com/video.mp4"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="min-w-[180px] flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-xs focus:border-white/25 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md border px-3.5 py-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                  borderColor: "var(--eco-primary)",
                }}
              >
                Добавить
              </button>
            </form>
          )}
        </section>

        {/* SECTION 4: Glass & Vignette Sliders */}
        <section className="space-y-2.5 border-t border-white/10 pb-1 pt-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 opacity-75" style={{ color: "var(--eco-primary)" }} />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider opacity-85">
              Параметры поверхности
            </h3>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <div className="glass-subtle rounded-lg p-3">
              <div className="mb-2 flex justify-between text-xs">
                <span className="opacity-75">Непрозрачность</span>
                <span className="font-mono tabular-nums">
                  {Math.round(theme.glassOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.94}
                step={0.02}
                value={theme.glassOpacity}
                onChange={(e) =>
                  updateActiveThemeColors({ glassOpacity: Number(e.target.value) })
                }
                aria-label="Плотность стекла"
                className="hud-range w-full"
              />
            </div>

            <div className="glass-subtle rounded-lg p-3">
              <div className="mb-2 flex justify-between text-xs">
                <span className="opacity-75">Размытие фона</span>
                <span className="font-mono tabular-nums">{theme.glassBlur}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={32}
                step={1}
                value={theme.glassBlur}
                onChange={(e) =>
                  updateActiveThemeColors({ glassBlur: Number(e.target.value) })
                }
                aria-label="Размытие"
                className="hud-range w-full"
              />
            </div>

            <div className="glass-subtle rounded-lg p-3">
              <div className="mb-2 flex justify-between text-xs">
                <span className="opacity-75">Затемнение краёв</span>
                <span className="font-mono tabular-nums">
                  {Math.round(theme.vignette * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.85}
                step={0.05}
                value={theme.vignette}
                onChange={(e) =>
                  updateActiveThemeColors({ vignette: Number(e.target.value) })
                }
                aria-label="Виньетка"
                className="hud-range w-full"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
