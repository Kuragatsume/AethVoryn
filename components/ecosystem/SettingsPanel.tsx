"use client";

import {
  Activity,
  Box,
  Check,
  Crop,
  Download,
  Film,
  FolderOpen,
  Link2,
  Maximize2,
  Minimize2,
  Music,
  Palette,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  DEFAULT_LOCAL_MUSIC_PATH,
  RADIO_STATIONS,
  soundEngine,
  type LocalTrackItem,
} from "@/utils/soundEngine";
import SpotlightCard from "../ui/SpotlightCard";
import {
  useEcosystem,
  type EtherDisplayMode,
  type HologramShape,
  type ThemeColors,
} from "./EcosystemContext";

type SettingsCategory =
  | "themes"
  | "backdrop"
  | "hologram"
  | "audio"
  | "windows"
  | "system";

const CATEGORIES: {
  id: SettingsCategory;
  code: string;
  label: string;
  subtitle: string;
  icon: typeof Palette;
}[] = [
  {
    id: "themes",
    code: "01",
    label: "Темы и Палитра",
    subtitle: "Тёмная, Белая, Серая и цвета",
    icon: Palette,
  },
  {
    id: "backdrop",
    code: "02",
    label: "Фон и Видео",
    subtitle: "Видеофон, сетка и сплошной цвет",
    icon: Film,
  },
  {
    id: "hologram",
    code: "03",
    label: "3D-Объект",
    subtitle: "Форма, вращение, размер и позиция",
    icon: Box,
  },
  {
    id: "audio",
    code: "04",
    label: "Музыка и Радио",
    subtitle: "Папка MediaHuman и звук",
    icon: Music,
  },
  {
    id: "windows",
    code: "05",
    label: "Окна и Стекло",
    subtitle: "Размеры, прозрачность и поля",
    icon: Maximize2,
  },
  {
    id: "system",
    code: "06",
    label: "Система и Бэкап",
    subtitle: "Виджеты и профиль .JSON",
    icon: Activity,
  },
];

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
  { name: "Серая сталь", hex: "#181C24" },
  { name: "Светлый", hex: "#E2E8F0" },
  { name: "Белый", hex: "#F8FAFC" },
  { name: "Кобальт", hex: "#080D18" },
  { name: "Изумруд", hex: "#07120F" },
];

const WINDOW_SURFACE_PRESETS = [
  { name: "Тёмная", hex: "#080A0F" },
  { name: "Чёрный", hex: "#000000" },
  { name: "Серая", hex: "#232832" },
  { name: "Белая", hex: "#F8FAFC" },
  { name: "Сланец", hex: "#0F172A" },
  { name: "Холодный", hex: "#080D18" },
];

const HOLOGRAM_SHAPES: {
  id: HologramShape;
  label: string;
  desc: string;
}[] = [
  {
    id: "icosahedron",
    label: "Икосаэдр",
    desc: "Классическая геодезическая 20-гранная сфера",
  },
  {
    id: "cube",
    label: "Гиперкуб (Тессеракт)",
    desc: "Двойной 4D-куб с внутренними связями",
  },
  {
    id: "octahedron",
    label: "Октаэдр (Кристалл)",
    desc: "Двухъярусный энергетический кристалл",
  },
  {
    id: "torus",
    label: "Орбитальный Тор",
    desc: "Кольцевая тороидальная решётка",
  },
  {
    id: "helix",
    label: "Двойная Спираль",
    desc: "Вращающаяся геномная структура с перемычками",
  },
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
    sfxEnabled,
    setSfxEnabled,
    hologramEnabled,
    setHologramEnabled,
    hologramConfig,
    updateHologramConfig,
    resetHologramPosition,
    exportProfileJson,
    importProfileJson,
  } = useEcosystem();

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("themes");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlTitle, setUrlTitle] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlFormOpen, setUrlFormOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [addingTheme, setAddingTheme] = useState(false);
  const [linkMargins, setLinkMargins] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  // Local Music & Radio state for Category 04
  const [musicDirInput, setMusicDirInput] = useState(DEFAULT_LOCAL_MUSIC_PATH);
  const [trackSearch, setTrackSearch] = useState("");
  const [radioState, setRadioState] = useState(() => soundEngine.getRadioState());

  useEffect(() => {
    soundEngine.loadLocalTracks();
    const sync = () => {
      const st = soundEngine.getRadioState();
      setRadioState(st);
      if (st.folderPath) {
        setMusicDirInput(st.folderPath);
      }
    };
    sync();
    return soundEngine.subscribe(sync);
  }, []);

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
    if (!newThemeName.trim()) return;
    addCustomTheme(newThemeName.trim());
    setNewThemeName("");
    setAddingTheme(false);
  };

  const handleMarginChange = (
    side: "top" | "right" | "bottom" | "left",
    val: number
  ) => {
    if (linkMargins) {
      updateFrameMargins({ top: val, right: val, bottom: val, left: val });
    } else {
      updateFrameMargins({ [side]: val });
    }
  };

  const filteredTracks: { track: LocalTrackItem; index: number }[] = radioState.tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => {
      if (!trackSearch.trim()) return true;
      const q = trackSearch.toLowerCase();
      return (
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        track.fileName.toLowerCase().includes(q)
      );
    });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">
      {/* LEFT SIDEBAR: CATEGORY NAVIGATION MENU */}
      <aside className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b border-white/10 bg-black/25 p-2.5 md:w-60 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:p-3">
        <div className="mb-2 hidden border-b border-white/10 pb-2.5 md:block">
          <div className="flex items-center gap-2">
            <Sliders
              className="h-3.5 w-3.5"
              style={{ color: "var(--eco-primary)" }}
            />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              Разделы настроек
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[10px] opacity-55">
            Выберите категорию слева
          </p>
        </div>

        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveCategory(cat.id);
              }}
              className={`group relative flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-left font-mono transition-colors md:w-full ${
                active
                  ? "font-semibold"
                  : "opacity-70 hover:bg-white/[0.04] hover:opacity-100"
              }`}
              style={
                active
                  ? {
                      backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                      border: "1px solid var(--eco-primary)",
                      color: "var(--eco-text)",
                    }
                  : {
                      border: "1px solid rgba(255,255,255,0.06)",
                    }
              }
            >
              {active && (
                <span
                  className="absolute bottom-0 left-0 top-0 w-1"
                  style={{ backgroundColor: "var(--eco-primary)" }}
                />
              )}
              <Icon
                className="h-4 w-4 shrink-0"
                style={{
                  color: active ? "var(--eco-primary)" : "currentColor",
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs">{cat.label}</span>
                  <span className="text-[9px] opacity-45">{cat.code}</span>
                </div>
                <div className="hidden truncate text-[10px] opacity-55 md:block">
                  {cat.subtitle}
                </div>
              </div>
            </button>
          );
        })}

        <div className="mt-auto hidden pt-3 md:block">
          <button
            type="button"
            onClick={resetActiveTheme}
            className="flex w-full items-center justify-center gap-1.5 border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[11px] opacity-75 transition-opacity hover:border-white/25 hover:opacity-100"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Сбросить текущую тему</span>
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT PANE: OPENS ONLY THE SELECTED CATEGORY */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* =========================================================
            CATEGORY 01: ТЕМЫ И ПАЛИТРА (Тёмная, Белая, Серая + цвета)
           ========================================================= */}
        {activeCategory === "themes" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
                  01 // Цветовые темы и палитра окон
                </h2>
                <p className="mt-0.5 font-mono text-xs opacity-65">
                  Быстрое переключение между Тёмной, Белой, Серой и студийными темами
                </p>
              </div>
              {!addingTheme ? (
                <button
                  type="button"
                  onClick={() => setAddingTheme(true)}
                  className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono text-xs hover:border-white/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Создать свою тему</span>
                </button>
              ) : (
                <form onSubmit={handleCreateTheme} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder="Название темы..."
                    className="border border-white/20 bg-black/40 px-2.5 py-1 font-mono text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="border px-2.5 py-1 font-mono text-xs font-semibold"
                    style={{
                      borderColor: "var(--eco-primary)",
                      color: "var(--eco-primary)",
                    }}
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingTheme(false)}
                    className="border border-white/10 px-2 py-1 font-mono text-xs opacity-65"
                  >
                    Отмена
                  </button>
                </form>
              )}
            </div>

            {/* Theme Cards Grid */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((t) => {
                const active = t.id === activeThemeId;
                return (
                  <SpotlightCard key={t.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => selectTheme(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectTheme(t.id);
                        }
                      }}
                      className="flex cursor-pointer items-center justify-between p-3 transition-colors"
                      style={
                        active
                          ? {
                              boxShadow: "inset 0 0 0 1px var(--eco-primary)",
                              backgroundColor: "rgba(var(--eco-primary-rgb), 0.1)",
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex shrink-0 -space-x-1">
                          <span
                            className="h-4 w-4 border border-white/30"
                            style={{ backgroundColor: t.colors.surface }}
                            title="Поверхность окон"
                          />
                          <span
                            className="h-4 w-4 border border-white/30"
                            style={{ backgroundColor: t.colors.primary }}
                            title="Акцент и контур"
                          />
                          <span
                            className="h-4 w-4 border border-white/30"
                            style={{ backgroundColor: t.colors.text }}
                            title="Текст"
                          />
                        </div>
                        <span className="truncate font-mono text-xs font-semibold">
                          {t.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {active && (
                          <Check
                            className="h-3.5 w-3.5"
                            style={{ color: "var(--eco-primary)" }}
                          />
                        )}
                        {t.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCustomTheme(t.id);
                            }}
                            className="p-1 opacity-55 hover:text-rose-400 hover:opacity-100"
                            title="Удалить тему"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>

            {/* Quick Window Surface Presets */}
            <div className="glass-subtle space-y-2.5 p-3.5 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">Быстрый цвет поверхности окон:</span>
                <div className="flex flex-wrap gap-1.5">
                  {WINDOW_SURFACE_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setWindowSurfaceColor(p.hex)}
                      className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] hover:border-white/35"
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

            {/* 5-Channel Color Pickers */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              {COLOR_FIELDS.map((f) => {
                const value = theme[f.key];
                return (
                  <div
                    key={f.key}
                    title={f.tooltip}
                    className="glass-subtle flex flex-col justify-between gap-2 p-3"
                  >
                    <span className="font-mono text-[11px] opacity-80">
                      {f.label}
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold uppercase">
                        {value}
                      </span>
                      <label className="relative h-6 w-9 cursor-pointer border border-white/25">
                        <span
                          className="block h-full w-full"
                          style={{ backgroundColor: value }}
                        />
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => {
                            const hex = e.target.value;
                            if (f.key === "surface") setWindowSurfaceColor(hex);
                            else if (f.key === "primary") setWindowBorderColor(hex);
                            else if (f.key === "text") setWindowTextColor(hex);
                            else updateActiveThemeColors({ [f.key]: hex });
                          }}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            CATEGORY 02: ФОН И ВИДЕО (Видеофон, Сетка во весь экран, Цвет)
           ========================================================= */}
        {activeCategory === "backdrop" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
                  02 // Режим фона и 4K Видеосцена
                </h2>
                <p className="mt-0.5 font-mono text-xs opacity-65">
                  Управление видеофоном, полноэкранной архитектурной сеткой и подложкой
                </p>
              </div>

              <div className="flex border border-white/15 bg-black/40 p-0.5 font-mono text-xs">
                {(
                  [
                    { id: "video", label: "Видеофон" },
                    { id: "ether", label: "Сетка (без видео)" },
                    { id: "color", label: "Сплошной цвет" },
                  ] as const
                ).map((m) => {
                  const active = backdropMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setBackdropMode(m.id)}
                      className={`px-3 py-1.5 transition-colors ${
                        active
                          ? "font-semibold"
                          : "opacity-65 hover:opacity-100"
                      }`}
                      style={
                        active
                          ? {
                              backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
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
            </div>

            {backdropMode !== "video" && (
              <div className="glass-subtle space-y-3 p-4 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      Цвет фона экрана ({backdropMode === "ether" ? "Сетка до самого низа экрана" : "Сплошной тон"}):
                    </div>
                    <div className="text-[11px] opacity-65">
                      Сетка автоматически растягивается на 100% высоты экрана без обрезки снизу
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="uppercase">{solidBgColor}</span>
                    <label className="relative h-7 w-12 cursor-pointer border border-white/25">
                      <span
                        className="block h-full w-full"
                        style={{ backgroundColor: solidBgColor }}
                      />
                      <input
                        type="color"
                        value={solidBgColor}
                        onChange={(e) => setSolidBgColor(e.target.value)}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SOLID_BG_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setSolidBgColor(p.hex)}
                      className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] hover:border-white/35"
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
            )}

            {backdropMode === "video" && (
              <div className="space-y-4">
                <div className="glass-subtle space-y-3 p-3.5 font-mono text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div>
                      <span className="font-semibold">Подстройка высоты страницы под видео:</span>
                      <p className="text-[10px] opacity-60">
                        Страница автоматически подстраивается под любое видео с вертикальной прокруткой
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateVideoQuality({
                          ultrawideScroll: !(videoQuality.ultrawideScroll ?? true),
                        })
                      }
                      className={`border px-3 py-1 text-xs font-semibold transition-colors ${
                        (videoQuality.ultrawideScroll ?? true)
                          ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                          : "border-white/15 bg-white/[0.04] opacity-70"
                      }`}
                    >
                      {(videoQuality.ultrawideScroll ?? true)
                        ? "ВКЛ (АДАПТИВНАЯ ВЫСОТА + СКРОЛЛ)"
                        : "ФИКСИРОВАННЫЙ ЭКРАН (100VH)"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <span>Кристальная чёткость (без затемнения):</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateVideoQuality({ clearMode: !videoQuality.clearMode })
                      }
                      className={`border px-3 py-1 text-xs font-semibold ${
                        videoQuality.clearMode
                          ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                          : "border-white/15 bg-white/[0.04] opacity-70"
                      }`}
                    >
                      {videoQuality.clearMode ? "ВКЛ (100% ЧЁТКОСТЬ)" : "ВЫКЛ (ВИНЬЕТКА)"}
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="opacity-75">Выравнивание кадра:</span>
                      </div>
                      <div className="flex border border-white/10 bg-black/40 p-0.5 text-[11px]">
                        {[
                          { id: "top", label: "Верх" },
                          { id: "center", label: "Центр" },
                          { id: "bottom", label: "Низ" },
                        ].map((pos) => {
                          const isSelected =
                            (videoQuality.position || "center") === pos.id;
                          return (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() =>
                                updateVideoQuality({ position: pos.id as any })
                              }
                              className={`flex-1 py-1 ${
                                isSelected
                                  ? "bg-white/15 font-semibold"
                                  : "opacity-60 hover:opacity-100"
                              }`}
                            >
                              {pos.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="opacity-75">Яркость видео:</span>
                        <span className="font-semibold">
                          {Math.round(videoQuality.brightness * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.6}
                        max={1.4}
                        step={0.05}
                        value={videoQuality.brightness}
                        onChange={(e) =>
                          updateVideoQuality({ brightness: Number(e.target.value) })
                        }
                        className="hud-range w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Video Presets & Upload */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setLoopVideo(!loopVideo)}
                      className={`border px-3 py-1 ${
                        loopVideo
                          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                          : "border-white/15 bg-white/[0.04]"
                      }`}
                    >
                      Повтор: {loopVideo ? "ВКЛ" : "ВЫКЛ"}
                    </button>
                    <button
                      type="button"
                      onClick={replayVideo}
                      className="inline-flex items-center gap-1 border border-white/15 bg-white/[0.04] px-3 py-1 hover:border-white/30"
                    >
                      <Play className="h-3 w-3" /> Перезапустить
                    </button>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 border px-3 py-1 font-semibold"
                      style={{
                        borderColor: "var(--eco-primary)",
                        color: "var(--eco-primary)",
                      }}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{uploading ? "Загрузка..." : "Загрузить видеофайл"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrlFormOpen((v) => !v)}
                      className="inline-flex items-center gap-1 border border-white/15 bg-white/[0.04] px-2.5 py-1"
                    >
                      <Link2 className="h-3.5 w-3.5" /> По ссылке
                    </button>
                  </div>
                </div>

                {urlFormOpen && (
                  <form
                    onSubmit={handleUrlSubmit}
                    className="glass-subtle grid gap-2 p-3 sm:grid-cols-3"
                  >
                    <input
                      type="text"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      placeholder="Название сцены"
                      className="border border-white/15 bg-black/40 px-2.5 py-1.5 font-mono text-xs"
                    />
                    <input
                      type="url"
                      required
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://.../video.mp4"
                      className="border border-white/15 bg-black/40 px-2.5 py-1.5 font-mono text-xs"
                    />
                    <button
                      type="submit"
                      className="border px-3 py-1.5 font-mono text-xs font-semibold"
                      style={{
                        borderColor: "var(--eco-primary)",
                        color: "var(--eco-primary)",
                      }}
                    >
                      Добавить видео
                    </button>
                  </form>
                )}

                <div className="grid gap-2.5 sm:grid-cols-3">
                  {videos.map((v) => {
                    const active = v.id === activeVideoId;
                    return (
                      <SpotlightCard key={v.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => selectVideo(v.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              selectVideo(v.id);
                            }
                          }}
                          className="flex h-full cursor-pointer flex-col justify-between p-3 text-left"
                          style={
                            active
                              ? {
                                  boxShadow: "inset 0 0 0 1px var(--eco-primary)",
                                  backgroundColor:
                                    "rgba(var(--eco-primary-rgb), 0.1)",
                                }
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between">
                            <span className="border border-white/15 px-1.5 py-0.5 font-mono text-[10px] uppercase">
                              {active ? "АКТИВНО" : v.badge}
                            </span>
                            {v.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustomVideo(v.id);
                                }}
                                className="p-1 opacity-60 hover:text-rose-400 hover:opacity-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="mt-2">
                            <div className="font-mono text-xs font-semibold">
                              {v.title}
                            </div>
                            <div className="font-mono text-[10px] opacity-60">
                              {v.subtitle}
                            </div>
                          </div>
                        </div>
                      </SpotlightCard>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            CATEGORY 03: 3D-ОБЪЕКТ (Форма, размер, скорость, перетаскивание ЛКМ)
           ========================================================= */}
        {activeCategory === "hologram" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
                  03 // Интерактивный 3D-Объект рабочего стола
                </h2>
                <p className="mt-0.5 font-mono text-xs opacity-65">
                  Чтобы передвинуть 3D-объект, просто зажмите на нём ЛКМ и перетащите в любое место экрана
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={resetHologramPosition}
                  className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-3 py-1.5 hover:border-white/35"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Вернуть в центр</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHologramEnabled(!hologramEnabled)}
                  className={`border px-3.5 py-1.5 font-semibold ${
                    hologramEnabled
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                      : "border-white/15 bg-white/[0.04] opacity-70"
                  }`}
                >
                  {hologramEnabled ? "3D ОБЪЕКТ: ВКЛ" : "3D ОБЪЕКТ: ВЫКЛ"}
                </button>
              </div>
            </div>

            {/* 3D Shape Selector */}
            <div className="space-y-2">
              <div className="font-mono text-xs font-semibold uppercase opacity-80">
                Геометрия 3D-объекта:
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {HOLOGRAM_SHAPES.map((s) => {
                  const active = hologramConfig.shape === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        updateHologramConfig({ shape: s.id });
                      }}
                      className="glass-subtle flex flex-col items-start justify-between gap-1 p-3 text-left font-mono transition-colors"
                      style={
                        active
                          ? {
                              borderColor: "var(--eco-primary)",
                              backgroundColor: "rgba(var(--eco-primary-rgb), 0.14)",
                            }
                          : undefined
                      }
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-bold">{s.label}</span>
                        {active && (
                          <Check
                            className="h-3.5 w-3.5"
                            style={{ color: "var(--eco-primary)" }}
                          />
                        )}
                      </div>
                      <span className="text-[10px] opacity-65">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders: Scale, Speed, Opacity */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="glass-subtle p-3.5 font-mono text-xs">
                <div className="mb-2 flex justify-between">
                  <span className="opacity-75">Размер 3D-объекта</span>
                  <span className="font-semibold tabular-nums">
                    {Math.round(hologramConfig.scale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1.8}
                  step={0.05}
                  value={hologramConfig.scale}
                  onChange={(e) =>
                    updateHologramConfig({ scale: Number(e.target.value) })
                  }
                  className="hud-range w-full"
                />
              </div>

              <div className="glass-subtle p-3.5 font-mono text-xs">
                <div className="mb-2 flex justify-between">
                  <span className="opacity-75">Скорость вращения</span>
                  <span className="font-semibold tabular-nums">
                    {hologramConfig.speed.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  value={hologramConfig.speed}
                  onChange={(e) =>
                    updateHologramConfig({ speed: Number(e.target.value) })
                  }
                  className="hud-range w-full"
                />
              </div>

              <div className="glass-subtle p-3.5 font-mono text-xs">
                <div className="mb-2 flex justify-between">
                  <span className="opacity-75">Яркость голограммы</span>
                  <span className="font-semibold tabular-nums">
                    {Math.round(hologramConfig.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.0}
                  step={0.05}
                  value={hologramConfig.opacity}
                  onChange={(e) =>
                    updateHologramConfig({ opacity: Number(e.target.value) })
                  }
                  className="hud-range w-full"
                />
              </div>
            </div>

            {/* Rings & Nodes Toggles */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="glass-subtle flex items-center justify-between p-3.5 font-mono text-xs">
                <div>
                  <div className="font-semibold">Гироскопические кольца орбиты</div>
                  <div className="text-[10px] opacity-60">
                    Внешние телеметрические кольца вокруг 3D-ядра
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateHologramConfig({ showRings: !hologramConfig.showRings })
                  }
                  className={`border px-3 py-1 font-semibold ${
                    hologramConfig.showRings
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                      : "border-white/15 bg-white/[0.04] opacity-65"
                  }`}
                >
                  {hologramConfig.showRings ? "ВКЛ" : "ВЫКЛ"}
                </button>
              </div>

              <div className="glass-subtle flex items-center justify-between p-3.5 font-mono text-xs">
                <div>
                  <div className="font-semibold">Узловые точки вершин</div>
                  <div className="text-[10px] opacity-60">
                    Подсветка вершин каркасной сетки
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateHologramConfig({ showNodes: !hologramConfig.showNodes })
                  }
                  className={`border px-3 py-1 font-semibold ${
                    hologramConfig.showNodes
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                      : "border-white/15 bg-white/[0.04] opacity-65"
                  }`}
                >
                  {hologramConfig.showNodes ? "ВКЛ" : "ВЫКЛ"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            CATEGORY 04: МУЗЫКА И РАДИО (Папка C:\Users\dakos\Downloads\MediaHuman\Music)
           ========================================================= */}
        {activeCategory === "audio" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
                  04 // Моя музыка и Радиоплеер
                </h2>
                <p className="mt-0.5 font-mono text-xs opacity-65">
                  Прямое воспроизведение треков из вашей папки без копирования и дублирования файлов ({radioState.tracks.length} треков найдено)
                </p>
              </div>
            </div>

            {/* Folder Path & Rescan Bar */}
            <div className="glass-subtle flex flex-wrap items-center gap-2 p-3 font-mono text-xs">
              <FolderOpen
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--eco-primary)" }}
              />
              <input
                type="text"
                value={musicDirInput}
                onChange={(e) => setMusicDirInput(e.target.value)}
                placeholder="C:\Users\dakos\Downloads\MediaHuman\Music"
                className="min-w-[240px] flex-1 border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => soundEngine.loadLocalTracks(musicDirInput)}
                className="inline-flex items-center gap-1.5 border px-3 py-1.5 font-semibold"
                style={{
                  borderColor: "var(--eco-primary)",
                  color: "var(--eco-primary)",
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Сканировать папку</span>
              </button>
            </div>

            {/* Player Transport Bar */}
            <div className="glass-subtle flex flex-wrap items-center justify-between gap-3 p-3.5 font-mono text-xs">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase opacity-55">
                  Сейчас выбрано:
                </div>
                <div className="truncate text-sm font-bold">
                  {radioState.stationId === "local-music" && radioState.currentTrack
                    ? `${radioState.currentTrack.artist} — ${radioState.currentTrack.title}`
                    : RADIO_STATIONS.find((s) => s.id === radioState.stationId)
                        ?.name}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => soundEngine.prevTrack()}
                  className="border border-white/15 bg-white/[0.04] p-2 hover:border-white/35"
                  title="Предыдущий трек"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => soundEngine.toggleRadio(radioState.stationId)}
                  className="inline-flex items-center gap-1.5 border px-4 py-2 font-bold uppercase"
                  style={{
                    borderColor: "var(--eco-primary)",
                    backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                  }}
                >
                  {radioState.isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5" /> Пауза
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" /> Играть
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => soundEngine.nextTrack()}
                  className="border border-white/15 bg-white/[0.04] p-2 hover:border-white/35"
                  title="Следующий трек"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => soundEngine.toggleShuffle()}
                  className={`border p-2 ${
                    radioState.shuffle
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                      : "border-white/15 bg-white/[0.04] opacity-65"
                  }`}
                  title="Случайный порядок (Shuffle)"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 opacity-75" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={radioState.volume}
                  onChange={(e) => soundEngine.setVolume(Number(e.target.value))}
                  className="hud-range w-24"
                />
                <span className="w-9 text-right tabular-nums">
                  {Math.round(radioState.volume * 100)}%
                </span>
              </div>
            </div>

            {/* Search & Tracklist from C:\Users\dakos\Downloads\MediaHuman\Music */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    value={trackSearch}
                    onChange={(e) => setTrackSearch(e.target.value)}
                    placeholder="Поиск по песням и исполнителям в папке MediaHuman..."
                    className="w-full border border-white/15 bg-black/35 py-1.5 pl-8 pr-3 font-mono text-xs focus:outline-none"
                  />
                </div>
                <span className="font-mono text-xs opacity-65">
                  Показано: {filteredTracks.length} из {radioState.tracks.length}
                </span>
              </div>

              <div className="max-h-[290px] overflow-y-auto border border-white/10 bg-black/25 divide-y divide-white/5 font-mono text-xs">
                {filteredTracks.map(({ track, index }) => {
                  const isCurrent =
                    radioState.stationId === "local-music" &&
                    radioState.currentTrackIndex === index;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => soundEngine.playLocalTrack(index)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-white/[0.06] ${
                        isCurrent ? "font-semibold" : "opacity-80"
                      }`}
                      style={
                        isCurrent
                          ? {
                              backgroundColor:
                                "rgba(var(--eco-primary-rgb), 0.16)",
                              color: "var(--eco-primary)",
                            }
                          : undefined
                      }
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="w-7 text-[10px] opacity-50 tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate">
                          <span className="font-semibold">{track.artist}</span>
                          <span className="mx-1.5 opacity-50">—</span>
                          <span>{track.title}</span>
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] opacity-55">
                        {(track.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            CATEGORY 05: ОКНА И СТЕКЛО (Габариты, плотность, размытие, поля)
           ========================================================= */}
        {activeCategory === "windows" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
                  05 // Габариты окон, плотность стекла и поля экрана
                </h2>
                <p className="mt-0.5 font-mono text-xs opacity-65">
                  Настройка прозрачности, размытия фона и размеров окон
                </p>
              </div>
              <button
                type="button"
                onClick={resetWindowSize}
                className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Сбросить размеры окон</span>
              </button>
            </div>

            {/* Glass Opacity, Blur & Vignette */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="glass-subtle p-3.5 font-mono text-xs">
                <div className="mb-2 flex justify-between">
                  <span className="opacity-75">Непрозрачность окон</span>
                  <span className="font-semibold tabular-nums">
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
                  className="hud-range w-full"
                />
              </div>

              <div className="glass-subtle p-3.5 font-mono text-xs">
                <div className="mb-2 flex justify-between">
                  <span className="opacity-75">Размытие стекла (Blur)</span>
                  <span className="font-semibold tabular-nums">
                    {theme.glassBlur}px
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={28}
                  step={1}
                  value={theme.glassBlur}
                  onChange={(e) =>
                    updateActiveThemeColors({ glassBlur: Number(e.target.value) })
                  }
                  className="hud-range w-full"
                />
              </div>

              <div className="glass-subtle p-3.5 font-mono text-xs">
                <div className="mb-2 flex justify-between">
                  <span className="opacity-75">Виньетка краёв</span>
                  <span className="font-semibold tabular-nums">
                    {Math.round(theme.vignette * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.85}
                  step={0.05}
                  value={theme.vignette}
                  onChange={(e) =>
                    updateActiveThemeColors({ vignette: Number(e.target.value) })
                  }
                  className="hud-range w-full"
                />
              </div>
            </div>

            {/* Window Size Sliders */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="glass-subtle p-3.5 font-mono text-xs">
                <div className="mb-2 flex justify-between">
                  <span className="opacity-75">Ширина окна по умолчанию</span>
                  <span className="font-semibold tabular-nums">
                    {windowSize.width} px
                  </span>
                </div>
                <input
                  type="range"
                  min={520}
                  max={1600}
                  step={20}
                  value={windowSize.width}
                  onChange={(e) =>
                    updateWindowSize({
                      width: Number(e.target.value),
                      isMaximized: false,
                    })
                  }
                  className="hud-range w-full"
                />
              </div>

              <div className="glass-subtle p-3.5 font-mono text-xs">
                <div className="mb-2 flex justify-between">
                  <span className="opacity-75">Высота окна по умолчанию</span>
                  <span className="font-semibold tabular-nums">
                    {windowSize.height} px
                  </span>
                </div>
                <input
                  type="range"
                  min={380}
                  max={1000}
                  step={20}
                  value={windowSize.height}
                  onChange={(e) =>
                    updateWindowSize({
                      height: Number(e.target.value),
                      isMaximized: false,
                    })
                  }
                  className="hud-range w-full"
                />
              </div>
            </div>

            {/* Screen Edge Frame Margins */}
            <div className="glass-subtle space-y-3 p-4 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Crop
                    className="h-4 w-4"
                    style={{ color: "var(--eco-primary)" }}
                  />
                  <span className="font-semibold">
                    Кинематографические рамки по краям экрана
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLinkMargins((v) => !v)}
                    className={`border px-2.5 py-1 text-[11px] ${
                      linkMargins
                        ? "border-white/40 bg-white/15"
                        : "border-white/15 opacity-65"
                    }`}
                  >
                    Связать 4 стороны
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateFrameMargins({ enabled: !frameMargins.enabled })
                    }
                    className={`border px-3 py-1 font-semibold ${
                      frameMargins.enabled
                        ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                        : "border-white/15 bg-white/[0.04] opacity-70"
                    }`}
                  >
                    {frameMargins.enabled ? "ВКЛ" : "ВЫКЛ"}
                  </button>
                </div>
              </div>

              {frameMargins.enabled && (
                <div className="grid gap-3 pt-2 sm:grid-cols-4">
                  {(
                    [
                      { key: "top", label: "Сверху", max: 160 },
                      { key: "bottom", label: "Снизу", max: 160 },
                      { key: "left", label: "Слева", max: 240 },
                      { key: "right", label: "Справа", max: 240 },
                    ] as const
                  ).map((side) => (
                    <div key={side.key}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span>{side.label}</span>
                        <span>{frameMargins[side.key]}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={side.max}
                        step={4}
                        value={frameMargins[side.key]}
                        onChange={(e) =>
                          handleMarginChange(side.key, Number(e.target.value))
                        }
                        className="hud-range w-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            CATEGORY 06: СИСТЕМА И БЭКАП (.JSON)
           ========================================================= */}
        {activeCategory === "system" && (
          <div className="space-y-5">
            <div className="border-b border-white/10 pb-3">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
                06 // Системные виджеты и Резервная копия профиля (.JSON)
              </h2>
              <p className="mt-0.5 font-mono text-xs opacity-65">
                Управление нижним блоком телеметрии и сохранение всех настроек в файл
              </p>
            </div>

            <div className="glass-subtle space-y-3 p-4 font-mono text-xs">
              <div className="font-semibold">Режим нижнего виджета телеметрии:</div>
              <div className="flex flex-wrap gap-1.5">
                {ETHER_MODES.map((m) => {
                  const active = etherConfig.displayMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateEtherConfig({ displayMode: m.id })}
                      className={`border px-3 py-1.5 text-xs ${
                        active
                          ? "font-semibold"
                          : "border-white/15 bg-white/[0.03] opacity-75"
                      }`}
                      style={
                        active
                          ? {
                              borderColor: "var(--eco-primary)",
                              backgroundColor:
                                "rgba(var(--eco-primary-rgb), 0.16)",
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
            </div>

            <div className="glass-subtle flex flex-wrap items-center justify-between gap-4 p-4 font-mono text-xs">
              <div>
                <div className="text-sm font-bold">
                  Полное резервное копирование профиля ОС (.JSON)
                </div>
                <div className="mt-0.5 text-[11px] opacity-65">
                  Экспортирует или восстанавливает все заметки, темы, открытые сайты, 3D-настройки и конфигурацию окон
                </div>
                {backupStatus && (
                  <div className="mt-1.5 text-xs font-semibold text-emerald-400">
                    {backupStatus}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    exportProfileJson();
                    setBackupStatus("✓ Профиль экспортирован в .JSON файл");
                  }}
                  className="inline-flex items-center gap-1.5 border px-3.5 py-2 text-xs font-semibold"
                  style={{
                    borderColor: "var(--eco-primary)",
                    backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                    color: "var(--eco-primary)",
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Экспорт .JSON</span>
                </button>

                <input
                  ref={backupInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    const ok = importProfileJson(text);
                    setBackupStatus(
                      ok
                        ? "✓ Профиль успешно импортирован!"
                        : "✕ Ошибка чтения файла резервной копии"
                    );
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => backupInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs hover:border-white/35"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Импорт .JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
