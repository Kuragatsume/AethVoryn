"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ExternalNewsItem } from "@/app/api/news/route";

export type EcosystemPage = "news" | "notes" | "settings" | null;

export type SurfaceMode = "transparent" | "solid";

export type BackdropMode = "video" | "color";

export type VideoDisplayFit = "cover" | "contain" | "fill";

export type VideoQualitySettings = {
  fit: VideoDisplayFit;
  brightness: number; // 0.6 .. 1.4
  contrast: number; // 0.8 .. 1.4
  clearMode: boolean; // true = 100% direct 4K without muddy vignette overlays
};

export const DEFAULT_VIDEO_QUALITY: VideoQualitySettings = {
  fit: "cover",
  brightness: 1.0,
  contrast: 1.0,
  clearMode: true,
};

export type EtherDisplayMode =
  | "clock"
  | "stats"
  | "custom"
  | "particles_only"
  | "hidden";

export type EtherConfig = {
  displayMode: EtherDisplayMode;
  customTitle: string;
  customSubtitle: string;
};

export type WindowDimensions = {
  width: number;
  height: number;
  isMaximized: boolean;
};

export const DEFAULT_WINDOW_DIMENSIONS: WindowDimensions = {
  width: 960,
  height: 640,
  isMaximized: false,
};

export type FrameMargins = {
  enabled: boolean;
  top: number; // 0..180 px
  right: number; // 0..260 px
  bottom: number; // 0..180 px
  left: number; // 0..260 px
  color: string; // HEX, e.g. #000000
};

export const DEFAULT_FRAME_MARGINS: FrameMargins = {
  enabled: false,
  top: 24,
  right: 36,
  bottom: 24,
  left: 36,
  color: "#000000",
};

export type ThemeColors = {
  primary: string; // Основной акцент / рамки окон и уголков
  secondary: string; // Вторичный тон / детали
  surface: string; // Цвет поверхности окон, карточек и меню
  background: string; // Базовый цвет фона страницы
  text: string; // Цвет текста внутри окон
  glassOpacity: number;
  glassBlur: number;
  vignette: number;
};

export type ThemePresetItem = {
  id: string;
  name: string;
  isCustom?: boolean;
  colors: ThemeColors;
};

export type VideoPreset = {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  badge: string;
  isCustom?: boolean;
};

export type NoteItem = {
  id: string;
  title: string;
  content: string;
  tag: string;
  updatedAt: string;
  pinned?: boolean;
  drawing?: string; // Data URL PNG рисунка (Paint)
};

export const DEFAULT_THEME_COLORS: ThemeColors = {
  primary: "#CBD5E1",
  secondary: "#64748B",
  surface: "#0A0D12",
  background: "#05070A",
  text: "#F1F5F9",
  glassOpacity: 0.88,
  glassBlur: 16,
  vignette: 0.25,
};

export const INITIAL_THEMES: ThemePresetItem[] = [
  {
    id: "graphite-steel",
    name: "Графит и Сталь",
    colors: DEFAULT_THEME_COLORS,
  },
  {
    id: "cold-cobalt",
    name: "Холодный Кобальт",
    colors: {
      primary: "#3B82F6",
      secondary: "#64748B",
      surface: "#080D18",
      background: "#03060C",
      text: "#F1F5F9",
      glassOpacity: 0.88,
      glassBlur: 16,
      vignette: 0.25,
    },
  },
  {
    id: "monochrome-onyx",
    name: "Оникс Монохром",
    colors: {
      primary: "#F8FAFC",
      secondary: "#71717A",
      surface: "#09090B",
      background: "#000000",
      text: "#FAFAFA",
      glassOpacity: 0.92,
      glassBlur: 14,
      vignette: 0.3,
    },
  },
  {
    id: "emerald-slate",
    name: "Тёмный Изумруд",
    colors: {
      primary: "#10B981",
      secondary: "#64748B",
      surface: "#07120F",
      background: "#030807",
      text: "#ECFDF5",
      glassOpacity: 0.88,
      glassBlur: 16,
      vignette: 0.25,
    },
  },
  {
    id: "amber-bronze",
    name: "Строгая Бронза",
    colors: {
      primary: "#D97706",
      secondary: "#78716C",
      surface: "#100D09",
      background: "#070504",
      text: "#F5F5F4",
      glassOpacity: 0.88,
      glassBlur: 16,
      vignette: 0.25,
    },
  },
];

export const BUILTIN_VIDEOS: VideoPreset[] = [
  {
    id: "winter-lantern",
    title: "Зимний пейзаж",
    subtitle: "Оригинальный видеофон (1080p)",
    src: "/bg-video.mp4",
    badge: "Базовый",
  },
  {
    id: "arcane-sanctum",
    title: "Северный горизонт",
    subtitle: "Ночное небо и сияние",
    src: "/bg-aurora.webm",
    badge: "Сцена 02",
  },
  {
    id: "ember-rift",
    title: "Тёплый контур",
    subtitle: "Фоновая динамика частиц",
    src: "/bg-ember.webm",
    badge: "Сцена 03",
  },
];

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: "note-1",
    title: "Рабочие задачи и эскизы",
    content:
      "1. Настроить размеры и цвета окон в разделе «Настройки».\n2. В блокноте доступен холст Paint для быстрых схем и зарисовок.\n3. Схемы сохраняются автоматически вместе с текущей заметкой.",
    tag: "Система",
    updatedAt: "Сегодня, 18:20",
    pinned: true,
  },
  {
    id: "note-2",
    title: "Заметки по проектам",
    content:
      "Черновики, списки задач, архитектура сервисов и эскизы интерфейса.",
    tag: "Проекты",
    updatedAt: "Сегодня, 17:45",
  },
];

export const FALLBACK_TECH_NEWS: ExternalNewsItem[] = [
  {
    id: "fallback-1",
    title: "Искусственный интеллект и локальные нейросети: обзор новых архитектур",
    summary:
      "Компактные языковые и мультимодальные модели выходят на уровень облачных флагманов при запуске на потребительских GPU.",
    content:
      "Новое поколение квантованных моделей и движков инференса позволяет запускать сложные ИИ-пайплайны локально с минимальной задержкой.",
    source: "Habr Новости",
    category: "ИИ и Нейросети",
    tags: ["AI", "LLM", "GPU", "Технологии"],
    url: "https://habr.com/ru/news/",
    date: "Сегодня",
    timestamp: Date.now() - 600000,
  },
  {
    id: "fallback-2",
    title: "WebGPU и рендеринг нового поколения в браузерах",
    summary:
      "Стандарт WebGPU открывает прямой доступ к вычислительным шейдерам и трассировке лучей прямо в современных веб-приложениях.",
    content:
      "Разработчики всё активнее переходят с классического WebGL на WebGPU для сложных симуляций, 3D-сцен и запуска ML-моделей на стороне клиента.",
    source: "3DNews",
    category: "Графика и Web",
    tags: ["WebGPU", "Браузеры", "3D"],
    url: "https://3dnews.ru",
    date: "Сегодня",
    timestamp: Date.now() - 1200000,
  },
];

/* ----------------------------------------------------------------------------
 * IndexedDB helper for persisting uploaded custom video files across reloads
 * ------------------------------------------------------------------------- */

const IDB_NAME = "aethvoryn_media_db";
const IDB_STORE = "videos";

function openVideoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVideoBlob(id: string, blob: Blob): Promise<void> {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadVideoBlob(id: string): Promise<Blob | null> {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteVideoBlob(id: string): Promise<void> {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function hexToRgbTriplet(hex: string, fallback = "203, 213, 225"): string {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return fallback;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

type EcosystemContextValue = {
  activePage: EcosystemPage;
  setActivePage: (p: EcosystemPage) => void;
  surfaceMode: SurfaceMode;
  setSurfaceMode: (m: SurfaceMode) => void;
  backdropMode: BackdropMode;
  setBackdropMode: (m: BackdropMode) => void;
  solidBgColor: string;
  setSolidBgColor: (color: string) => void;
  videoQuality: VideoQualitySettings;
  updateVideoQuality: (patch: Partial<VideoQualitySettings>) => void;
  windowSize: WindowDimensions;
  updateWindowSize: (patch: Partial<WindowDimensions>) => void;
  resetWindowSize: () => void;
  frameMargins: FrameMargins;
  updateFrameMargins: (patch: Partial<FrameMargins>) => void;
  resetFrameMargins: () => void;
  themes: ThemePresetItem[];
  activeThemeId: string;
  theme: ThemeColors;
  selectTheme: (id: string) => void;
  updateActiveThemeColors: (patch: Partial<ThemeColors>) => void;
  setWindowSurfaceColor: (color: string) => void;
  setWindowBorderColor: (color: string) => void;
  setWindowTextColor: (color: string) => void;
  setWindowGlassOpacity: (opacity: number) => void;
  addCustomTheme: (name: string) => void;
  deleteCustomTheme: (id: string) => void;
  resetActiveTheme: () => void;
  etherConfig: EtherConfig;
  updateEtherConfig: (patch: Partial<EtherConfig>) => void;
  videos: VideoPreset[];
  activeVideoId: string;
  activeVideoSrc: string;
  selectVideo: (id: string) => void;
  addCustomVideoFile: (file: File) => Promise<void>;
  addCustomVideoUrl: (title: string, url: string) => void;
  removeCustomVideo: (id: string) => Promise<void>;
  loopVideo: boolean;
  setLoopVideo: (v: boolean) => void;
  replayToken: number;
  replayVideo: () => void;
  news: ExternalNewsItem[];
  newsLoading: boolean;
  refreshNews: () => Promise<void>;
  bookmarkedIds: string[];
  toggleBookmark: (id: string) => void;
  notes: NoteItem[];
  addNote: (note?: Partial<NoteItem>) => string;
  updateNote: (id: string, patch: Partial<NoteItem>) => void;
  deleteNote: (id: string) => void;
};

const EcosystemContext = createContext<EcosystemContextValue | null>(null);

const STORAGE_KEY = "aethvoryn_ecosystem_v5";
const STRICT_THEME_VERSION = 5;

export function EcosystemProvider({ children }: { children: ReactNode }) {
  const [activePage, setActivePage] = useState<EcosystemPage>("news");
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>("transparent");
  const [backdropMode, setBackdropMode] = useState<BackdropMode>("video");
  const [solidBgColor, setSolidBgColorState] = useState<string>("#05070A");
  const [videoQuality, setVideoQuality] = useState<VideoQualitySettings>(
    DEFAULT_VIDEO_QUALITY
  );

  const [windowSize, setWindowSize] = useState<WindowDimensions>(
    DEFAULT_WINDOW_DIMENSIONS
  );
  const [frameMargins, setFrameMargins] = useState<FrameMargins>(
    DEFAULT_FRAME_MARGINS
  );

  const [themes, setThemes] = useState<ThemePresetItem[]>(INITIAL_THEMES);
  const [activeThemeId, setActiveThemeId] = useState<string>("graphite-steel");

  const [etherConfig, setEtherConfig] = useState<EtherConfig>({
    displayMode: "clock",
    customTitle: "AETHVORYN",
    customSubtitle: "РАБОЧАЯ СРЕДА",
  });

  const [customVideos, setCustomVideos] = useState<VideoPreset[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string>("winter-lantern");
  const [loopVideo, setLoopVideo] = useState<boolean>(false);
  const [replayToken, setReplayToken] = useState<number>(0);

  const [news, setNews] = useState<ExternalNewsItem[]>(FALLBACK_TECH_NEWS);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const [notes, setNotes] = useState<NoteItem[]>(INITIAL_NOTES);
  const [hydrated, setHydrated] = useState(false);

  const activeThemeItem = useMemo(
    () => themes.find((t) => t.id === activeThemeId) ?? themes[0],
    [themes, activeThemeId]
  );
  const theme = activeThemeItem.colors;

  // Sync solidBgColor with theme background if not set independently
  useEffect(() => {
    if (theme.background && solidBgColor !== theme.background) {
      setSolidBgColorState(theme.background);
    }
  }, [theme.background]);

  // Fetch live technology news from /api/news
  const refreshNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          setNews(data.items);
        }
      }
    } catch {
      /* keep fallback or existing news */
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNews();
  }, [refreshNews]);

  // Hydrate saved settings from localStorage + IndexedDB
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.surfaceMode === "solid" || parsed.surfaceMode === "transparent") {
          setSurfaceMode(parsed.surfaceMode);
        }
        if (parsed.backdropMode === "color" || parsed.backdropMode === "video") {
          setBackdropMode(parsed.backdropMode);
        }
        if (parsed.solidBgColor && typeof parsed.solidBgColor === "string") {
          setSolidBgColorState(parsed.solidBgColor);
        }
        if (parsed.videoQuality) {
          setVideoQuality((prev) => ({ ...prev, ...parsed.videoQuality }));
        }
        if (parsed.windowSize && typeof parsed.windowSize.width === "number") {
          setWindowSize(parsed.windowSize);
        }
        if (parsed.frameMargins && typeof parsed.frameMargins.top === "number") {
          setFrameMargins(parsed.frameMargins);
        }

        if (
          parsed.themeVersion === STRICT_THEME_VERSION &&
          Array.isArray(parsed.themes) &&
          parsed.themes.length > 0
        ) {
          setThemes(parsed.themes);
          if (parsed.activeThemeId) {
            setActiveThemeId(parsed.activeThemeId);
          }
        } else if (Array.isArray(parsed.themes)) {
          const customOnly = parsed.themes.filter(
            (t: ThemePresetItem) => t && t.isCustom
          );
          const merged = [...INITIAL_THEMES, ...customOnly];
          setThemes(merged);
          const validSavedId = merged.some((t) => t.id === parsed.activeThemeId);
          setActiveThemeId(validSavedId ? parsed.activeThemeId : INITIAL_THEMES[0].id);
        }

        if (parsed.etherConfig) {
          setEtherConfig((prev) => ({ ...prev, ...parsed.etherConfig }));
        }
        if (typeof parsed.loopVideo === "boolean") {
          setLoopVideo(parsed.loopVideo);
        }
        if (parsed.activeVideoId) {
          setActiveVideoId(parsed.activeVideoId);
        }
        if (Array.isArray(parsed.bookmarkedIds)) {
          setBookmarkedIds(parsed.bookmarkedIds);
        }
        if (Array.isArray(parsed.notes) && parsed.notes.length > 0) {
          setNotes(parsed.notes);
        }
        if (Array.isArray(parsed.customVideos)) {
          const savedList: VideoPreset[] = parsed.customVideos;
          Promise.all(
            savedList.map(async (v) => {
              if (v.id.startsWith("idb-")) {
                const blob = await loadVideoBlob(v.id).catch(() => null);
                if (!blob) return null;
                return { ...v, src: URL.createObjectURL(blob) };
              }
              return v;
            })
          ).then((restored) => {
            setCustomVideos(restored.filter((x): x is VideoPreset => x !== null));
          });
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      const serializableCustom = customVideos.map((v) =>
        v.id.startsWith("idb-") ? { ...v, src: "idb://" + v.id } : v
      );
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          themeVersion: STRICT_THEME_VERSION,
          surfaceMode,
          backdropMode,
          solidBgColor,
          videoQuality,
          windowSize,
          frameMargins,
          themes,
          activeThemeId,
          etherConfig,
          activeVideoId,
          loopVideo,
          bookmarkedIds,
          notes,
          customVideos: serializableCustom,
        })
      );
    } catch {
      /* ignore */
    }
  }, [
    hydrated,
    surfaceMode,
    backdropMode,
    solidBgColor,
    videoQuality,
    windowSize,
    frameMargins,
    themes,
    activeThemeId,
    etherConfig,
    activeVideoId,
    loopVideo,
    bookmarkedIds,
    notes,
    customVideos,
  ]);

  // Apply CSS variables to :root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--eco-primary", theme.primary);
    root.style.setProperty("--eco-primary-rgb", hexToRgbTriplet(theme.primary, "203, 213, 225"));
    root.style.setProperty("--eco-secondary", theme.secondary);
    root.style.setProperty("--eco-secondary-rgb", hexToRgbTriplet(theme.secondary, "100, 116, 139"));
    root.style.setProperty("--eco-surface", theme.surface);
    root.style.setProperty("--eco-surface-rgb", hexToRgbTriplet(theme.surface, "10, 13, 18"));
    const effectiveBg = backdropMode === "color" && solidBgColor ? solidBgColor : (theme.background || "#05070A");
    root.style.setProperty("--eco-bg", effectiveBg);
    root.style.setProperty("--eco-bg-rgb", hexToRgbTriplet(effectiveBg, "5, 7, 10"));
    root.style.setProperty("--eco-text", theme.text);
    const effectiveOpacity = surfaceMode === "solid" ? 0.98 : theme.glassOpacity;
    root.style.setProperty("--eco-glass-opacity", String(effectiveOpacity));
    root.style.setProperty("--eco-glass-blur", `${theme.glassBlur}px`);
    root.style.setProperty("--eco-vignette", String(videoQuality.clearMode ? 0 : theme.vignette));
  }, [theme, surfaceMode, backdropMode, solidBgColor, videoQuality.clearMode]);

  const selectTheme = useCallback((id: string) => {
    setActiveThemeId(id);
  }, []);

  const updateActiveThemeColors = useCallback(
    (patch: Partial<ThemeColors>) => {
      setThemes((prev) =>
        prev.map((t) =>
          t.id === activeThemeId
            ? { ...t, colors: { ...t.colors, ...patch } }
            : t
        )
      );
    },
    [activeThemeId]
  );

  const setSolidBgColor = useCallback(
    (color: string) => {
      setSolidBgColorState(color);
      updateActiveThemeColors({ background: color });
    },
    [updateActiveThemeColors]
  );

  const updateVideoQuality = useCallback((patch: Partial<VideoQualitySettings>) => {
    setVideoQuality((prev) => ({ ...prev, ...patch }));
  }, []);

  const setWindowSurfaceColor = useCallback(
    (color: string) => {
      updateActiveThemeColors({ surface: color });
    },
    [updateActiveThemeColors]
  );

  const setWindowBorderColor = useCallback(
    (color: string) => {
      updateActiveThemeColors({ primary: color });
    },
    [updateActiveThemeColors]
  );

  const setWindowTextColor = useCallback(
    (color: string) => {
      updateActiveThemeColors({ text: color });
    },
    [updateActiveThemeColors]
  );

  const setWindowGlassOpacity = useCallback(
    (opacity: number) => {
      updateActiveThemeColors({ glassOpacity: opacity });
    },
    [updateActiveThemeColors]
  );

  const updateWindowSize = useCallback((patch: Partial<WindowDimensions>) => {
    setWindowSize((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetWindowSize = useCallback(() => {
    setWindowSize(DEFAULT_WINDOW_DIMENSIONS);
  }, []);

  const updateFrameMargins = useCallback((patch: Partial<FrameMargins>) => {
    setFrameMargins((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFrameMargins = useCallback(() => {
    setFrameMargins(DEFAULT_FRAME_MARGINS);
  }, []);

  const addCustomTheme = useCallback(
    (name: string) => {
      const id = `theme-${Date.now()}`;
      const newTheme: ThemePresetItem = {
        id,
        name: name.trim() || `Тема ${themes.length + 1}`,
        isCustom: true,
        colors: { ...theme },
      };
      setThemes((prev) => [...prev, newTheme]);
      setActiveThemeId(id);
    },
    [theme, themes.length]
  );

  const deleteCustomTheme = useCallback(
    (id: string) => {
      setThemes((prev) => prev.filter((t) => t.id !== id));
      if (activeThemeId === id) {
        setActiveThemeId(INITIAL_THEMES[0].id);
      }
    },
    [activeThemeId]
  );

  const resetActiveTheme = useCallback(() => {
    const builtin = INITIAL_THEMES.find((t) => t.id === activeThemeId);
    const baseColors = builtin ? builtin.colors : DEFAULT_THEME_COLORS;
    updateActiveThemeColors(baseColors);
  }, [activeThemeId, updateActiveThemeColors]);

  const updateEtherConfig = useCallback((patch: Partial<EtherConfig>) => {
    setEtherConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const videos = useMemo(() => [...BUILTIN_VIDEOS, ...customVideos], [customVideos]);

  const activeVideoSrc = useMemo(() => {
    const found = videos.find((v) => v.id === activeVideoId);
    return found ? found.src : BUILTIN_VIDEOS[0].src;
  }, [videos, activeVideoId]);

  const selectVideo = useCallback((id: string) => {
    setActiveVideoId(id);
    setBackdropMode("video");
    setReplayToken((t) => t + 1);
  }, []);

  const addCustomVideoFile = useCallback(async (file: File) => {
    const id = `idb-${Date.now()}`;
    await saveVideoBlob(id, file);
    const url = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^.]+$/, "");
    const preset: VideoPreset = {
      id,
      title: cleanName || "Пользовательское видео",
      subtitle: `${(file.size / (1024 * 1024)).toFixed(1)} МБ`,
      src: url,
      badge: "Файл",
      isCustom: true,
    };
    setCustomVideos((prev) => [preset, ...prev]);
    setActiveVideoId(id);
    setBackdropMode("video");
    setReplayToken((t) => t + 1);
  }, []);

  const addCustomVideoUrl = useCallback((title: string, url: string) => {
    const id = `url-${Date.now()}`;
    const preset: VideoPreset = {
      id,
      title: title.trim() || "Видео по ссылке",
      subtitle: url.trim(),
      src: url.trim(),
      badge: "URL",
      isCustom: true,
    };
    setCustomVideos((prev) => [preset, ...prev]);
    setActiveVideoId(id);
    setBackdropMode("video");
    setReplayToken((t) => t + 1);
  }, []);

  const removeCustomVideo = useCallback(
    async (id: string) => {
      if (id.startsWith("idb-")) {
        await deleteVideoBlob(id).catch(() => {});
      }
      setCustomVideos((prev) => prev.filter((v) => v.id !== id));
      if (activeVideoId === id) {
        setActiveVideoId("winter-lantern");
      }
    },
    [activeVideoId]
  );

  const replayVideo = useCallback(() => {
    setReplayToken((t) => t + 1);
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const addNote = useCallback((partial?: Partial<NoteItem>) => {
    const id = `note-${Date.now()}`;
    const newNote: NoteItem = {
      id,
      title: partial?.title ?? "Новая запись",
      content: partial?.content ?? "",
      tag: partial?.tag ?? "Заметки",
      updatedAt: new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      pinned: partial?.pinned ?? false,
      drawing: partial?.drawing,
    };
    setNotes((prev) => [newNote, ...prev]);
    return id;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<NoteItem>) => {
    const stamp = new Date().toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: stamp } : n))
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = useMemo<EcosystemContextValue>(
    () => ({
      activePage,
      setActivePage,
      surfaceMode,
      setSurfaceMode,
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
      etherConfig,
      updateEtherConfig,
      videos,
      activeVideoId,
      activeVideoSrc,
      selectVideo,
      addCustomVideoFile,
      addCustomVideoUrl,
      removeCustomVideo,
      loopVideo,
      setLoopVideo,
      replayToken,
      replayVideo,
      news,
      newsLoading,
      refreshNews,
      bookmarkedIds,
      toggleBookmark,
      notes,
      addNote,
      updateNote,
      deleteNote,
    }),
    [
      activePage,
      surfaceMode,
      backdropMode,
      solidBgColor,
      videoQuality,
      windowSize,
      frameMargins,
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
      etherConfig,
      updateEtherConfig,
      videos,
      activeVideoId,
      activeVideoSrc,
      selectVideo,
      addCustomVideoFile,
      addCustomVideoUrl,
      removeCustomVideo,
      loopVideo,
      replayToken,
      replayVideo,
      news,
      newsLoading,
      refreshNews,
      bookmarkedIds,
      toggleBookmark,
      notes,
      addNote,
      updateNote,
      deleteNote,
    ]
  );

  return (
    <EcosystemContext.Provider value={value}>
      {children}
    </EcosystemContext.Provider>
  );
}

export function useEcosystem() {
  const ctx = useContext(EcosystemContext);
  if (!ctx) throw new Error("useEcosystem must be used inside EcosystemProvider");
  return ctx;
}
