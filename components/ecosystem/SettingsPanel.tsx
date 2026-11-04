"use client";

import {
  Activity,
  Check,
  Crop,
  Film,
  Link2,
  Maximize2,
  Minimize2,
  Palette,
  Play,
  Plus,
  RotateCcw,
  Sliders,
  Square,
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
    label: "Контур и уголки окон",
    tooltip: "Цвет рамок окон, активных вкладок и угловых скобок",
  },
  {
    key: "surface",
    label: "Поверхность окон",
    tooltip: "Основной цвет фона окон, карточек и меню",
  },
  {
    key: "secondary",
    label: "Вторичный тон",
    tooltip: "Вспомогательные метки, разделители и технические индексы",
  },
  {
    key: "background",
    label: "Подложка экрана",
    tooltip: "Базовый цвет фона страницы",
  },
  {
    key: "text",
    label: "Текст в окнах",
    tooltip: "Основной цвет шрифта внутри всех окон и разделов",
  },
];

const ETHER_MODES: { id: EtherDisplayMode; label: string; tooltip: string }[] = [
  { id: "clock", label: "Часы и дата", tooltip: "Отображать точное время и дату" },
  { id: "stats", label: "Сводка", tooltip: "Количество публикаций и заметок" },
  { id: "custom", label: "Текст", tooltip: "Произвольная текстовая метка" },
  { id: "particles_only", label: "Матрица", tooltip: "Только точечная сетка без текста" },
  { id: "hidden", label: "Скрыть", tooltip: "Отключить нижний блок" },
];

const SOLID_BG_PRESETS = [
  { name: "Чёрный", hex: "#000000" },
  { name: "Обсидиан", hex: "#05070A" },
  { name: "Кобальт", hex: "#080D18" },
  { name: "Изумруд", hex: "#07120F" },
  { name: "Графит", hex: "#0F172A" },
  { name: "Нейтральный", hex: "#121212" },
  { name: "Оникс", hex: "#09090B" },
];

const WINDOW_SURFACE_PRESETS = [
  { name: "Обсидиан", hex: "#0A0D12" },
  { name: "Чёрный", hex: "#000000" },
  { name: "Сланец", hex: "#0F172A" },
  { name: "Холодный", hex: "#080D18" },
  { name: "Хвойный", hex: "#07120F" },
  { name: "Сталь", hex: "#141820" },
];

export default function SettingsPanel() {
  const {
    themes,
    activeThemeId,
    theme,
    selectTheme,
    updateActiveThemeColors,
    setWindowSurfaceColor,
    setWindowBorderColor,
    setWindowTextColor,
    setWindowGlassOpacity,
    addCustomTheme,
    deleteCustomTheme,
    resetActiveTheme,
    backdropMode,
    setBackdropMode,
    solidBgColor,
    setSolidBgColor,
    videoQuality,
    updateVideoQuality,
    windowSize,
    updateWindowSize,
    resetWindowSize,
    frameMargins,
    updateFrameMargins,
    resetFrameMargins,
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
  const [linkMargins, setLinkMargins] = useState(false);

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

  const handleMarginChange = (side: keyof typeof frameMargins, value: number) => {
    if (linkMargins) {
      updateFrameMargins({
        top: value,
        bottom: value,
        left: Math.round(value * 1.3),
        right: Math.round(value * 1.3),
      });
    } else {
      updateFrameMargins({ [side]: value });
    }
  };

  return (
    <div className="flex h-full flex-col font-sans">
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
          title="Вернуть стандартные параметры темы"
          className="inline-flex items-center gap-1.5 rounded-none border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium transition-colors hover:border-white/25 hover:bg-white/[0.08]"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Сбросить тему
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="mt-3.5 flex-1 space-y-6 overflow-y-auto pr-1">
        {/* SECTION 1: WINDOW DIMENSIONS & WINDOW COLOR (ОКНА И РАБОЧАЯ ОБЛАСТЬ) */}
        <section className="space-y-3.5 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Square className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider opacity-90">
                Размеры и цвет окон
              </h3>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="opacity-60">Текущий:</span>
              <span className="font-semibold" style={{ color: "var(--eco-primary)" }}>
                {windowSize.isMaximized
                  ? "НА ВЕСЬ ЭКРАН"
                  : `${Math.round(windowSize.width)} × ${Math.round(windowSize.height)} PX`}
              </span>
            </div>
          </div>

          {/* Quick Window Size Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[10px] uppercase opacity-45">Пресеты:</span>
            {[
              { label: "Компакт (780×520)", w: 780, h: 520 },
              { label: "Стандарт (940×640)", w: 940, h: 640 },
              { label: "Широкий (1200×720)", w: 1200, h: 720 },
              { label: "Максимальный (1440×820)", w: 1440, h: 820 },
            ].map((p) => {
              const active =
                !windowSize.isMaximized &&
                Math.abs(windowSize.width - p.w) < 15 &&
                Math.abs(windowSize.height - p.h) < 15;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() =>
                    updateWindowSize({ width: p.w, height: p.h, isMaximized: false })
                  }
                  className={`rounded-none border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                    active
                      ? "font-semibold"
                      : "border-white/10 bg-white/[0.03] opacity-70 hover:border-white/25 hover:opacity-100"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.18)",
                          borderColor: "var(--eco-primary)",
                          color: "var(--eco-primary)",
                        }
                      : undefined
                  }
                >
                  {p.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => updateWindowSize({ isMaximized: !windowSize.isMaximized })}
              className="inline-flex items-center gap-1 rounded-none border border-white/15 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] hover:bg-white/[0.08]"
            >
              {windowSize.isMaximized ? (
                <>
                  <Minimize2 className="h-3 w-3" /> Обычный размер
                </>
              ) : (
                <>
                  <Maximize2 className="h-3 w-3" /> 100% экрана
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetWindowSize}
              title="Сбросить размеры к 940×640"
              className="rounded-none border border-white/10 bg-white/[0.03] p-1 opacity-70 hover:opacity-100"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>

          {/* Window Sliders Grid */}
          {!windowSize.isMaximized && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="glass-subtle p-3">
                <div className="mb-1.5 flex justify-between font-mono text-xs">
                  <span className="opacity-75">Ширина окна (Width)</span>
                  <span className="font-semibold">{Math.round(windowSize.width)} px</span>
                </div>
                <input
                  type="range"
                  min={420}
                  max={1500}
                  step={10}
                  value={windowSize.width}
                  onChange={(e) => updateWindowSize({ width: Number(e.target.value) })}
                  aria-label="Ширина окна"
                  className="hud-range w-full"
                />
              </div>

              <div className="glass-subtle p-3">
                <div className="mb-1.5 flex justify-between font-mono text-xs">
                  <span className="opacity-75">Высота окна (Height)</span>
                  <span className="font-semibold">{Math.round(windowSize.height)} px</span>
                </div>
                <input
                  type="range"
                  min={320}
                  max={900}
                  step={10}
                  value={windowSize.height}
                  onChange={(e) => updateWindowSize({ height: Number(e.target.value) })}
                  aria-label="Высота окна"
                  className="hud-range w-full"
                />
              </div>
            </div>
          )}

          {/* WINDOW COLORS (ЦВЕТ ОКНА) */}
          <div className="space-y-2.5 pt-1">
            <span className="font-mono text-[11px] uppercase tracking-wider opacity-60">
              Цветовая настройка окон:
            </span>

            <div className="grid gap-2 sm:grid-cols-3">
              {/* Surface Window Color */}
              <div className="glass-subtle p-2.5">
                <span className="block truncate font-mono text-[11px] opacity-80">
                  Поверхность окна
                </span>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={theme.surface}
                    onChange={(e) => setWindowSurfaceColor(e.target.value)}
                    aria-label="Цвет поверхности окна"
                    className="w-20 rounded-none border border-white/10 bg-black/40 px-2 py-1 text-center font-mono text-xs uppercase focus:border-white/30 focus:outline-none"
                  />
                  <label className="relative h-6 w-6 shrink-0 cursor-pointer border border-white/20">
                    <span
                      className="block h-full w-full"
                      style={{ backgroundColor: theme.surface }}
                    />
                    <input
                      type="color"
                      value={theme.surface}
                      onChange={(e) => setWindowSurfaceColor(e.target.value.toUpperCase())}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>
                {/* Surface presets */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {WINDOW_SURFACE_PRESETS.slice(0, 5).map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      title={p.name}
                      onClick={() => setWindowSurfaceColor(p.hex)}
                      className="h-3 w-3 border border-white/20 transition-transform hover:scale-125"
                      style={{ backgroundColor: p.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Border / Corner Color */}
              <div className="glass-subtle p-2.5">
                <span className="block truncate font-mono text-[11px] opacity-80">
                  Контур и уголки
                </span>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={theme.primary}
                    onChange={(e) => setWindowBorderColor(e.target.value)}
                    aria-label="Цвет контура окна"
                    className="w-20 rounded-none border border-white/10 bg-black/40 px-2 py-1 text-center font-mono text-xs uppercase focus:border-white/30 focus:outline-none"
                  />
                  <label className="relative h-6 w-6 shrink-0 cursor-pointer border border-white/20">
                    <span
                      className="block h-full w-full"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <input
                      type="color"
                      value={theme.primary}
                      onChange={(e) => setWindowBorderColor(e.target.value.toUpperCase())}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>
              </div>

              {/* Text inside window */}
              <div className="glass-subtle p-2.5">
                <span className="block truncate font-mono text-[11px] opacity-80">
                  Текст в окнах
                </span>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={theme.text}
                    onChange={(e) => setWindowTextColor(e.target.value)}
                    aria-label="Цвет текста"
                    className="w-20 rounded-none border border-white/10 bg-black/40 px-2 py-1 text-center font-mono text-xs uppercase focus:border-white/30 focus:outline-none"
                  />
                  <label className="relative h-6 w-6 shrink-0 cursor-pointer border border-white/20">
                    <span
                      className="block h-full w-full"
                      style={{ backgroundColor: theme.text }}
                    />
                    <input
                      type="color"
                      value={theme.text}
                      onChange={(e) => setWindowTextColor(e.target.value.toUpperCase())}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: EDGE FRAMES / MARGINS WITHOUT BACKGROUND (ПОЛЯ ПО КРАЯМ БЕЗ ФОНА) */}
        <section className="space-y-3.5 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Crop className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider opacity-90">
                Поля по краям экрана (без фона)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Enable / Disable Toggle */}
              <button
                type="button"
                onClick={() => updateFrameMargins({ enabled: !frameMargins.enabled })}
                className={`rounded-none border px-3 py-1 font-mono text-xs transition-colors ${
                  frameMargins.enabled
                    ? "font-semibold"
                    : "border-white/15 bg-white/[0.04] opacity-70 hover:opacity-100"
                }`}
                style={
                  frameMargins.enabled
                    ? {
                        backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                        borderColor: "var(--eco-primary)",
                        color: "var(--eco-primary)",
                      }
                    : undefined
                }
              >
                {frameMargins.enabled ? "ВКЛЮЧЕНЫ" : "ОТКЛЮЧЕНЫ"}
              </button>

              <button
                type="button"
                onClick={resetFrameMargins}
                title="Сбросить поля"
                className="rounded-none border border-white/10 bg-white/[0.03] p-1 opacity-70 hover:opacity-100"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>

          <p className="font-mono text-[11px] leading-relaxed opacity-65">
            Позволяет добавить рамки по периметру экрана, полностью исключающие отображение фонового видео или подложки. Каждая сторона настраивается независимо.
          </p>

          {/* Color & Presets for Edge Fields */}
          <div className="glass-subtle flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs opacity-80">Цвет полей:</span>
              <input
                type="text"
                value={frameMargins.color}
                onChange={(e) => updateFrameMargins({ color: e.target.value })}
                aria-label="Цвет полей"
                className="w-20 rounded-none border border-white/10 bg-black/40 px-2 py-1 text-center font-mono text-xs uppercase focus:border-white/30 focus:outline-none"
              />
              <label className="relative h-6 w-6 shrink-0 cursor-pointer border border-white/20">
                <span
                  className="block h-full w-full"
                  style={{ backgroundColor: frameMargins.color }}
                />
                <input
                  type="color"
                  value={frameMargins.color}
                  onChange={(e) => updateFrameMargins({ color: e.target.value.toUpperCase() })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>

              {/* Quick color swatches */}
              <div className="ml-2 flex items-center gap-1">
                {["#000000", "#05070A", "#0A0D12", "#111827", "#1E1E1E"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateFrameMargins({ color: c })}
                    className="h-3.5 w-3.5 border border-white/20 transition-transform hover:scale-125"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Quick Margin Presets */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              <span className="opacity-45">Пресеты:</span>
              {[
                { label: "Кино (32px)", t: 32, b: 32, l: 0, r: 0 },
                { label: "Рамка (24/40)", t: 24, b: 24, l: 40, r: 40 },
                { label: "Студия (36/60)", t: 36, b: 36, l: 60, r: 60 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() =>
                    updateFrameMargins({
                      enabled: true,
                      top: p.t,
                      bottom: p.b,
                      left: p.l,
                      right: p.r,
                    })
                  }
                  className="rounded-none border border-white/10 bg-white/[0.03] px-2 py-0.5 opacity-75 hover:border-white/25 hover:opacity-100"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4-Side Sliders (Top, Bottom, Left, Right) */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-subtle p-2.5">
              <div className="mb-1 flex justify-between font-mono text-[11px]">
                <span className="opacity-75">Верх (Top)</span>
                <span className="font-semibold">{frameMargins.top} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={160}
                step={2}
                value={frameMargins.top}
                onChange={(e) => handleMarginChange("top", Number(e.target.value))}
                aria-label="Верхнее поле"
                className="hud-range w-full"
              />
            </div>

            <div className="glass-subtle p-2.5">
              <div className="mb-1 flex justify-between font-mono text-[11px]">
                <span className="opacity-75">Низ (Bottom)</span>
                <span className="font-semibold">{frameMargins.bottom} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={160}
                step={2}
                value={frameMargins.bottom}
                onChange={(e) => handleMarginChange("bottom", Number(e.target.value))}
                aria-label="Нижнее поле"
                className="hud-range w-full"
              />
            </div>

            <div className="glass-subtle p-2.5">
              <div className="mb-1 flex justify-between font-mono text-[11px]">
                <span className="opacity-75">Лево (Left)</span>
                <span className="font-semibold">{frameMargins.left} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={240}
                step={4}
                value={frameMargins.left}
                onChange={(e) => handleMarginChange("left", Number(e.target.value))}
                aria-label="Левое поле"
                className="hud-range w-full"
              />
            </div>

            <div className="glass-subtle p-2.5">
              <div className="mb-1 flex justify-between font-mono text-[11px]">
                <span className="opacity-75">Право (Right)</span>
                <span className="font-semibold">{frameMargins.right} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={240}
                step={4}
                value={frameMargins.right}
                onChange={(e) => handleMarginChange("right", Number(e.target.value))}
                aria-label="Правое поле"
                className="hud-range w-full"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: BACKDROP MODE & SOLID BACKGROUND COLOR CUSTOMIZATION */}
        <section className="space-y-3.5 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Film className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider opacity-90">
                Фоновый режим и цвет фона
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Video vs Solid Color Switch */}
              <div className="flex border border-white/10 bg-black/40 p-0.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setBackdropMode("video")}
                  className={`px-3 py-1 font-medium transition-colors ${
                    backdropMode === "video"
                      ? "font-semibold"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={
                    backdropMode === "video"
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                          color: "var(--eco-primary)",
                        }
                      : undefined
                  }
                >
                  Видеофон
                </button>
                <button
                  type="button"
                  onClick={() => setBackdropMode("color")}
                  className={`px-3 py-1 font-medium transition-colors ${
                    backdropMode === "color"
                      ? "font-semibold"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={
                    backdropMode === "color"
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                          color: "var(--eco-primary)",
                        }
                      : undefined
                  }
                >
                  Сплошной цвет
                </button>
              </div>

              {/* Loop Controls */}
              {backdropMode === "video" && (
                <>
                  <div className="flex border border-white/10 bg-black/40 p-0.5 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setLoopVideo(false)}
                      className={`px-2 py-0.5 transition-colors ${
                        !loopVideo ? "font-semibold text-white" : "opacity-50"
                      }`}
                      style={!loopVideo ? { backgroundColor: "rgba(255,255,255,0.12)" } : undefined}
                    >
                      Стоп
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoopVideo(true)}
                      className={`px-2 py-0.5 transition-colors ${
                        loopVideo ? "font-semibold text-white" : "opacity-50"
                      }`}
                      style={loopVideo ? { backgroundColor: "rgba(255,255,255,0.12)" } : undefined}
                    >
                      Цикл
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={replayVideo}
                    title="Перезапустить видео"
                    className="inline-flex items-center gap-1 border border-white/15 bg-white/[0.04] px-2 py-1 font-mono text-xs hover:bg-white/[0.08]"
                  >
                    <Play className="h-3 w-3" style={{ color: "var(--eco-primary)" }} />
                    Повтор
                  </button>
                </>
              )}
            </div>
          </div>

          {/* DEDICATED SOLID COLOR PICKER (WHEN SOLID COLOR IS SELECTED) */}
          {backdropMode === "color" && (
            <div className="glass-subtle space-y-2.5 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-medium opacity-90">
                    Цвет сплошного фона:
                  </span>
                  <input
                    type="text"
                    value={solidBgColor}
                    onChange={(e) => setSolidBgColor(e.target.value)}
                    aria-label="Цвет сплошного фона HEX"
                    className="w-24 border border-white/15 bg-black/50 px-2 py-1 text-center font-mono text-xs uppercase focus:border-white/35 focus:outline-none"
                  />
                  <label className="relative h-7 w-7 shrink-0 cursor-pointer border border-white/25">
                    <span
                      className="block h-full w-full"
                      style={{ backgroundColor: solidBgColor }}
                    />
                    <input
                      type="color"
                      value={solidBgColor}
                      onChange={(e) => setSolidBgColor(e.target.value.toUpperCase())}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>

                {/* Quick Solid Presets */}
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                  <span className="opacity-50">Палитра:</span>
                  {SOLID_BG_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setSolidBgColor(p.hex)}
                      title={p.name}
                      className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.03] px-2 py-0.5 opacity-80 transition-opacity hover:opacity-100"
                    >
                      <span
                        className="h-2.5 w-2.5 border border-white/30"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Video Presets Grid (When Video is active) */}
          {backdropMode === "video" && (
            <div className="space-y-3">
              {/* 4K ULTRA-CLEAR VIDEO QUALITY & SCALING CONTROLS */}
              <div className="glass-subtle space-y-3 p-3 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">4K ULTRA HD РЕЖИМ</span>
                    <span className="border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400">
                      DIRECT 1:1
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="opacity-70">Без затемняющих градиентов:</span>
                    <button
                      type="button"
                      onClick={() => updateVideoQuality({ clearMode: !videoQuality.clearMode })}
                      className={`border px-2.5 py-0.5 text-xs transition-colors ${
                        videoQuality.clearMode
                          ? "border-emerald-500/60 bg-emerald-500/20 font-semibold text-emerald-300"
                          : "border-white/10 bg-white/[0.03] opacity-60 hover:opacity-100"
                      }`}
                    >
                      {videoQuality.clearMode ? "ВКЛ (КРИСТАЛЬНАЯ ЧЁТКОСТЬ)" : "ВЫКЛ (ЗАТЕМНЕНИЕ)"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="opacity-70">Масштабирование кадра:</span>
                      <span className="font-semibold" style={{ color: "var(--eco-primary)" }}>
                        {videoQuality.fit === "cover"
                          ? "Заполнение (Cover)"
                          : videoQuality.fit === "contain"
                          ? "Без кадрирования (1:1)"
                          : "Растянуть"}
                      </span>
                    </div>
                    <div className="flex border border-white/10 bg-black/40 p-0.5 text-[11px]">
                      {[
                        { id: "cover", label: "Заполнить" },
                        { id: "contain", label: "Без обрезки (1:1)" },
                        { id: "fill", label: "Растянуть" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => updateVideoQuality({ fit: f.id as any })}
                          className={`flex-1 py-1 transition-colors ${
                            videoQuality.fit === f.id
                              ? "bg-white/15 font-semibold text-white"
                              : "opacity-60 hover:opacity-100"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="opacity-70">Яркость видео:</span>
                      <span className="font-semibold">{Math.round(videoQuality.brightness * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.6}
                      max={1.4}
                      step={0.05}
                      value={videoQuality.brightness}
                      onChange={(e) => updateVideoQuality({ brightness: Number(e.target.value) })}
                      className="hud-range w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {videos.map((v) => {
                  const active = v.id === activeVideoId;
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
                                backgroundColor: "rgba(var(--eco-primary-rgb), 0.08)",
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className="px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider"
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
                              className="p-1 opacity-60 hover:bg-rose-500/20 hover:text-rose-300 hover:opacity-100"
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
                  className="inline-flex flex-1 items-center justify-center gap-2 border border-dashed border-white/20 bg-white/[0.03] px-4 py-2 font-mono text-xs font-medium transition-colors hover:border-white/40 hover:bg-white/[0.06]"
                >
                  <Upload className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
                  {uploading ? "Загрузка..." : "Загрузить видеофайл (.mp4 / .webm)"}
                </button>
                <button
                  type="button"
                  onClick={() => setUrlFormOpen((o) => !o)}
                  className="inline-flex items-center justify-center gap-1.5 border border-white/15 bg-white/[0.03] px-3.5 py-2 font-mono text-xs font-medium transition-colors hover:bg-white/[0.06]"
                >
                  <Link2 className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
                  URL ссылка
                </button>
              </div>

              {urlFormOpen && (
                <form
                  onSubmit={handleUrlSubmit}
                  className="glass-subtle flex flex-wrap items-center gap-2 p-2.5"
                >
                  <input
                    type="text"
                    placeholder="Название..."
                    value={urlTitle}
                    onChange={(e) => setUrlTitle(e.target.value)}
                    className="w-40 border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs focus:border-white/25 focus:outline-none"
                  />
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/video.mp4"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="min-w-[180px] flex-1 border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs focus:border-white/25 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="border px-3.5 py-1.5 font-mono text-xs font-semibold"
                    style={{
                      backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                      borderColor: "var(--eco-primary)",
                    }}
                  >
                    Добавить
                  </button>
                </form>
              )}
            </div>
          )}
        </section>

        {/* SECTION 4: THEMES & SYSTEM COLOR MATRIX */}
        <section className="space-y-3.5 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider opacity-90">
                Темы оформления
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setAddingTheme((v) => !v)}
              className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2.5 py-1 font-mono text-xs font-medium hover:bg-white/[0.08]"
            >
              <Plus className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
              Сохранить свою тему
            </button>
          </div>

          {addingTheme && (
            <form onSubmit={handleCreateTheme} className="glass-subtle flex items-center gap-2 p-2.5">
              <input
                type="text"
                required
                placeholder="Название схемы..."
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                className="min-w-0 flex-1 border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs focus:border-white/25 focus:outline-none"
              />
              <button
                type="submit"
                className="border px-3.5 py-1.5 font-mono text-xs font-semibold"
                style={{
                  backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                  borderColor: "var(--eco-primary)",
                }}
              >
                Сохранить
              </button>
            </form>
          )}

          {/* Theme List Grid */}
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
                  className="glass-subtle flex cursor-pointer items-center justify-between gap-2 p-2.5 text-left transition-colors hover:border-white/25"
                  style={
                    isCurrent
                      ? {
                          borderColor: "var(--eco-primary)",
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.08)",
                        }
                      : undefined
                  }
                >
                  <span className="truncate font-mono text-xs font-medium">
                    {item.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <span
                      className="h-3 w-3 border border-white/20"
                      style={{ backgroundColor: item.colors.primary }}
                    />
                    <span
                      className="h-3 w-3 border border-white/20"
                      style={{ backgroundColor: item.colors.surface }}
                    />
                    <span
                      className="h-3 w-3 border border-white/20"
                      style={{ backgroundColor: item.colors.background }}
                    />
                    {item.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomTheme(item.id);
                        }}
                        title="Удалить тему"
                        className="ml-1 p-0.5 opacity-60 hover:text-rose-400 hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    {isCurrent && !item.isCustom && (
                      <Check className="ml-1 h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All Theme Colors Fields */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {COLOR_FIELDS.map((field) => {
              const value = theme[field.key];
              return (
                <div
                  key={field.key}
                  title={field.tooltip}
                  className="glass-subtle flex items-center justify-between gap-2 p-2.5"
                >
                  <span className="truncate font-mono text-[11px] opacity-85">
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
                      className="w-20 border border-white/10 bg-black/35 px-2 py-1 text-center font-mono text-xs uppercase focus:border-white/25 focus:outline-none"
                    />
                    <label className="relative h-6 w-6 shrink-0 cursor-pointer border border-white/20">
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

        {/* SECTION 5: LOWER INSTRUMENT FIELD CONFIG */}
        <section className="space-y-3.5 border-b border-white/10 pb-5">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider opacity-90">
              Нижний информационный блок
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
                  className={`border px-3 py-1 font-mono text-xs font-medium transition-colors ${
                    active
                      ? "font-semibold"
                      : "border-white/10 bg-white/[0.03] opacity-75 hover:border-white/20 hover:opacity-100"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                          borderColor: "var(--eco-primary)",
                          color: "var(--eco-primary)",
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
                className="border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs focus:border-white/25 focus:outline-none"
              />
              <input
                type="text"
                value={etherConfig.customSubtitle}
                onChange={(e) =>
                  updateEtherConfig({ customSubtitle: e.target.value })
                }
                placeholder="Подзаголовок..."
                className="border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs focus:border-white/25 focus:outline-none"
              />
            </div>
          )}
        </section>

        {/* SECTION 6: GLASS & VIGNETTE SLIDERS */}
        <section className="space-y-2.5 pb-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider opacity-90">
              Плотность и размытие
            </h3>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <div className="glass-subtle p-3">
              <div className="mb-2 flex justify-between font-mono text-xs">
                <span className="opacity-75">Непрозрачность окон</span>
                <span className="tabular-nums">
                  {Math.round(theme.glassOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.98}
                step={0.02}
                value={theme.glassOpacity}
                onChange={(e) => setWindowGlassOpacity(Number(e.target.value))}
                aria-label="Непрозрачность окон"
                className="hud-range w-full"
              />
            </div>

            <div className="glass-subtle p-3">
              <div className="mb-2 flex justify-between font-mono text-xs">
                <span className="opacity-75">Размытие (Blur)</span>
                <span className="tabular-nums">{theme.glassBlur}px</span>
              </div>
              <input
                type="range"
                min={2}
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

            <div className="glass-subtle p-3">
              <div className="mb-2 flex justify-between font-mono text-xs">
                <span className="opacity-75">Виньетка краёв</span>
                <span className="tabular-nums">
                  {Math.round(theme.vignette * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.0}
                max={0.9}
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
