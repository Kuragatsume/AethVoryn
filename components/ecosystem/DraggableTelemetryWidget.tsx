"use client";

import {
  Activity,
  BatteryCharging,
  CloudSun,
  FolderOpen,
  GripHorizontal,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Timer,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  RADIO_STATIONS,
  soundEngine,
  type LocalTrackItem,
} from "@/utils/soundEngine";
import ParticleRipple from "../ui/ParticleRipple";
import { useEcosystem } from "./EcosystemContext";

type Props = {
  clock: { time: string; date: string };
  hiddenByMaximize?: boolean;
};

type WidgetTab = "sys" | "weather" | "crypto" | "pomodoro" | "radio";

const CITIES = [
  { name: "Москва", lat: 55.7558, lon: 37.6173 },
  { name: "СПб", lat: 59.9343, lon: 30.3351 },
  { name: "Екатеринбург", lat: 56.8389, lon: 60.6057 },
  { name: "Алматы", lat: 43.222, lon: 76.8512 },
  { name: "Токио", lat: 35.6762, lon: 139.6503 },
];

const STORAGE_KEY = "aethvoryn_telemetry_pos";
const WIDGET_WIDTH = 440;

export default function DraggableTelemetryWidget({
  clock,
  hiddenByMaximize = false,
}: Props) {
  const { etherConfig, news, notes } = useEcosystem();

  const elRef = useRef<HTMLElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const posRef = useRef<{ x: number; y: number } | null>(null);

  const [activeTab, setActiveTab] = useState<WidgetTab>("sys");

  // Live Hardware & Network Telemetry
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [pingMs, setPingMs] = useState<number>(12);

  // Weather state
  const [cityIdx, setCityIdx] = useState(0);
  const [weather, setWeather] = useState<{
    temp: number;
    wind: number;
    humidity: number;
  } | null>(null);

  // Crypto Market Ticker state
  const [tickers, setTickers] = useState<
    { symbol: string; price: string; change: number }[]
  >([
    { symbol: "BTC", price: "94,250", change: 2.4 },
    { symbol: "ETH", price: "2,780", change: 1.8 },
    { symbol: "SOL", price: "188.4", change: 4.1 },
    { symbol: "TON", price: "5.42", change: 0.9 },
  ]);

  // Pomodoro Timer state
  const [pomoMode, setPomoMode] = useState<"work" | "break">("work");
  const [pomoSeconds, setPomoSeconds] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoSessions, setPomoSessions] = useState(0);

  // Radio, Local Music Folder & Audio Visualizer state
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [stationId, setStationId] = useState(RADIO_STATIONS[0].id);
  const [volume, setVolume] = useState(0.45);
  const [localTracks, setLocalTracks] = useState<LocalTrackItem[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync with SoundEngine & load local tracks from C:\Users\dakos\Downloads\MediaHuman\Music
  useEffect(() => {
    soundEngine.loadLocalTracks();
    const sync = () => {
      const st = soundEngine.getRadioState();
      setRadioPlaying(st.isPlaying);
      setStationId(st.stationId);
      setVolume(st.volume);
      setLocalTracks(st.tracks);
      setCurrentTrackIndex(st.currentTrackIndex);
      setShuffle(st.shuffle);
    };
    sync();
    return soundEngine.subscribe(sync);
  }, []);

  // Load saved position on the page
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

  // Battery & Ping polling
  useEffect(() => {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      (navigator as any)
        .getBattery()
        .then((bat: any) => {
          setBatteryLevel(Math.round(bat.level * 100));
          bat.addEventListener("levelchange", () => {
            setBatteryLevel(Math.round(bat.level * 100));
          });
        })
        .catch(() => {});
    }

    const measurePing = async () => {
      const t0 = performance.now();
      try {
        await fetch("/icon.svg", { cache: "no-store" });
        setPingMs(Math.max(1, Math.round(performance.now() - t0)));
      } catch {
        /* ignore */
      }
    };
    measurePing();
    const id = window.setInterval(measurePing, 20000);
    return () => window.clearInterval(id);
  }, []);

  // Fetch Weather from Open-Meteo
  useEffect(() => {
    const city = CITIES[cityIdx] || CITIES[0];
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            wind: Math.round(data.current.wind_speed_10m),
            humidity: Math.round(data.current.relative_humidity_2m),
          });
        }
      })
      .catch(() => {});
  }, [cityIdx]);

  // Fetch Live Crypto Ticker from Binance Public API
  useEffect(() => {
    const loadTickers = () => {
      fetch(
        'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","TONUSDT"]'
      )
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setTickers(
              data.map((d: any) => {
                const p = Number(d.lastPrice);
                return {
                  symbol: d.symbol.replace("USDT", ""),
                  price:
                    p >= 100
                      ? p.toLocaleString("en-US", { maximumFractionDigits: 0 })
                      : p.toFixed(2),
                  change: Number(Number(d.priceChangePercent).toFixed(1)),
                };
              })
            );
          }
        })
        .catch(() => {});
    };
    loadTickers();
    const id = window.setInterval(loadTickers, 30000);
    return () => window.clearInterval(id);
  }, []);

  // Pomodoro countdown
  useEffect(() => {
    if (!pomoRunning) return;
    const id = window.setInterval(() => {
      setPomoSeconds((prev) => {
        if (prev <= 1) {
          soundEngine.playSuccess();
          if (pomoMode === "work") {
            setPomoSessions((s) => s + 1);
            setPomoMode("break");
            return 5 * 60;
          } else {
            setPomoMode("work");
            return 25 * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [pomoRunning, pomoMode]);

  // Audio Spectrum Visualizer animation when on Radio tab (zero DOM reflow per frame)
  useEffect(() => {
    if (activeTab !== "radio") return;
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const primary =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--eco-primary")
        .trim() || "#CBD5E1";

    let animId = 0;
    const bars = 20;
    const render = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = primary;

      const barW = Math.floor(w / bars) - 2;
      for (let i = 0; i < bars; i++) {
        const amp = radioPlaying
          ? 0.18 +
            0.78 *
              Math.abs(
                Math.sin(t * 0.0055 + i * 0.45) *
                  Math.cos(t * 0.0032 - i * 0.22)
              )
          : 0.08;
        const barH = Math.max(2, Math.round(amp * h));
        ctx.fillRect(i * (barW + 2), h - barH, barW, barH);
      }
      if (radioPlaying) {
        animId = window.requestAnimationFrame(render);
      }
    };
    render(performance.now());
    return () => window.cancelAnimationFrame(animId);
  }, [activeTab, radioPlaying]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
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
        Math.min(maxPageH - 90, origY + (ev.clientY - startY))
      );

      posRef.current = { x: nextX, y: nextY };
      el.style.left = `${nextX}px`;
      el.style.top = `${nextY}px`;
      el.style.bottom = "auto";
      el.style.right = "auto";
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (posRef.current) {
        setPos(posRef.current);
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
      el.style.left = "24px";
      el.style.top = "calc(100svh - 115px)";
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  if (etherConfig.displayMode === "hidden") return null;

  const formatTimer = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <aside
      ref={elRef}
      className={`glass pointer-events-auto group/widget absolute z-[25] flex max-w-[calc(100vw-32px)] flex-col rounded-none shadow-2xl transition-opacity duration-200 ${
        hiddenByMaximize ? "pointer-events-none invisible opacity-0" : "opacity-100"
      }`}
      style={{
        position: "absolute",
        left: pos ? `${pos.x}px` : "24px",
        top: pos ? `${pos.y}px` : "calc(100svh - 115px)",
        width: `${WIDGET_WIDTH}px`,
        willChange: "left, top",
      }}
    >
      {/* SHARP HUD CORNER BRACKETS (┌ ┐ └ ┘) */}
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

      {/* TOP DRAG HANDLE & MODULE SWITCHER TABS */}
      <div
        onPointerDown={handlePointerDown}
        title="Зажмите и тяните для перемещения по странице"
        className="flex cursor-grab items-center justify-between border-b border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] uppercase tracking-wider active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-1">
          <GripHorizontal
            className="mr-1 h-3 w-3 shrink-0 opacity-70"
            style={{ color: "var(--eco-primary)" }}
          />
          {(
            [
              { id: "sys", label: "SYS", icon: Activity },
              { id: "weather", label: "МЕТЕО", icon: CloudSun },
              { id: "crypto", label: "РЫНОК", icon: TrendingUp },
              { id: "pomodoro", label: "ФОКУС", icon: Timer },
              { id: "radio", label: "РАДИО", icon: Radio },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const isAct = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playClick();
                  setActiveTab(t.id);
                }}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] transition-colors ${
                  isAct
                    ? "bg-white/15 font-bold text-white"
                    : "opacity-55 hover:opacity-100"
                }`}
                style={
                  isAct
                    ? { borderBottom: "1px solid var(--eco-primary)" }
                    : undefined
                }
              >
                <Icon className="h-2.5 w-2.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {pos && (
          <button
            type="button"
            onClick={handleReset}
            title="Вернуть на исходное место"
            className="opacity-50 transition-opacity hover:text-white hover:opacity-100"
          >
            <RotateCcw className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {/* WIDGET CONTENT BODY */}
      <div
        data-ripple-host
        className="relative h-18 w-full overflow-hidden px-3.5 py-2 font-mono"
      >
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <ParticleRipple />
        </div>

        {/* TAB 1: SYSTEM CLOCK & HARDWARE TELEMETRY */}
        {activeTab === "sys" && (
          <div className="relative z-10 flex h-full items-center justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tabular-nums tracking-wider sm:text-2xl">
                  {clock.time || "—:—"}
                </span>
                <span className="text-[10px] opacity-60">{clock.date}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-[10px] opacity-70">
                <span>НОВОСТЕЙ: {news.length}</span>
                <span>ЗАМЕТОК: {notes.length}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-[10px]">
              <div className="flex items-center gap-2">
                <span className="border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300">
                  PING {pingMs}ms
                </span>
                {batteryLevel !== null && (
                  <span className="inline-flex items-center gap-1 border border-white/15 bg-black/40 px-1.5 py-0.5 text-[9px]">
                    <BatteryCharging className="h-2.5 w-2.5 text-emerald-400" />
                    {batteryLevel}%
                  </span>
                )}
              </div>
              <span className="text-[9px] uppercase tracking-widest opacity-50">
                {etherConfig.customTitle || "AETHVORYN"} • ONLINE
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE WEATHER (OPEN-METEO) */}
        {activeTab === "weather" && (
          <div className="relative z-10 flex h-full items-center justify-between gap-2 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xl font-bold tabular-nums"
                  style={{ color: "var(--eco-primary)" }}
                >
                  {weather ? `${weather.temp > 0 ? "+" : ""}${weather.temp}°C` : "Загрузка..."}
                </span>
                <span className="text-[11px] font-semibold">
                  {CITIES[cityIdx].name}
                </span>
              </div>
              {weather && (
                <div className="mt-0.5 text-[10px] opacity-70">
                  Ветер: {weather.wind} км/ч • Влажность: {weather.humidity}%
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {CITIES.map((c, idx) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setCityIdx(idx);
                  }}
                  className={`border px-1.5 py-0.5 text-[9px] transition-colors ${
                    cityIdx === idx
                      ? "border-white/50 bg-white/15 font-semibold text-white"
                      : "border-white/10 bg-black/40 opacity-60 hover:opacity-100"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CRYPTO & TECH TICKER */}
        {activeTab === "crypto" && (
          <div className="relative z-10 grid h-full grid-cols-4 items-center gap-1.5 text-center">
            {tickers.map((t) => (
              <div
                key={t.symbol}
                className="border border-white/10 bg-black/50 px-1.5 py-1"
              >
                <div className="flex items-center justify-between text-[9px] opacity-65">
                  <span className="font-bold text-white">{t.symbol}</span>
                  <span
                    className={
                      t.change >= 0 ? "text-emerald-400" : "text-rose-400"
                    }
                  >
                    {t.change >= 0 ? "+" : ""}
                    {t.change}%
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[11px] font-semibold tabular-nums">
                  ${t.price}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: POMODORO FOCUS TIMER */}
        {activeTab === "pomodoro" && (
          <div className="relative z-10 flex h-full items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-xl font-bold tabular-nums"
                  style={{ color: "var(--eco-primary)" }}
                >
                  {formatTimer(pomoSeconds)}
                </span>
                <span className="border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase">
                  {pomoMode === "work" ? "ФОКУС 25М" : "ОТДЫХ 5М"}
                </span>
              </div>
              <div className="mt-0.5 text-[9px] opacity-60">
                Завершено циклов: {pomoSessions}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPomoRunning((r) => !r);
                }}
                className="inline-flex items-center gap-1 border px-2.5 py-1 text-[10px] font-semibold uppercase"
                style={{
                  borderColor: "var(--eco-primary)",
                  backgroundColor: "rgba(var(--eco-primary-rgb), 0.18)",
                }}
              >
                {pomoRunning ? (
                  <>
                    <Pause className="h-3 w-3" /> Пауза
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" /> Старт
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPomoRunning(false);
                  setPomoMode("work");
                  setPomoSeconds(25 * 60);
                }}
                className="border border-white/15 bg-black/50 px-2 py-1 text-[10px] opacity-75 hover:opacity-100"
              >
                Сброс
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: LOCAL MUSIC FOLDER & AMBIENT RADIO PLAYER */}
        {activeTab === "radio" && (
          <div className="relative z-10 flex h-full items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {/* Row 1: Controls + Track / Station Picker */}
              <div className="flex items-center gap-1">
                {stationId === "local-music" && (
                  <button
                    type="button"
                    onClick={() => soundEngine.prevTrack()}
                    title="Предыдущий трек"
                    className="border border-white/15 bg-black/50 p-1 opacity-80 hover:border-white/40 hover:opacity-100"
                  >
                    <SkipBack className="h-2.5 w-2.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => soundEngine.toggleRadio(stationId)}
                  className="inline-flex shrink-0 items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={{
                    borderColor: "var(--eco-primary)",
                    backgroundColor: radioPlaying
                      ? "rgba(var(--eco-primary-rgb), 0.28)"
                      : "rgba(0,0,0,0.5)",
                  }}
                >
                  {radioPlaying ? (
                    <>
                      <Pause className="h-2.5 w-2.5" /> ПАУЗА
                    </>
                  ) : (
                    <>
                      <Play className="h-2.5 w-2.5" /> ИГРАТЬ
                    </>
                  )}
                </button>

                {stationId === "local-music" && (
                  <>
                    <button
                      type="button"
                      onClick={() => soundEngine.nextTrack()}
                      title="Следующий трек"
                      className="border border-white/15 bg-black/50 p-1 opacity-80 hover:border-white/40 hover:opacity-100"
                    >
                      <SkipForward className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => soundEngine.toggleShuffle()}
                      title="Перемешать треки (Shuffle)"
                      className={`border p-1 transition-colors ${
                        shuffle
                          ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300"
                          : "border-white/15 bg-black/50 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Shuffle className="h-2.5 w-2.5" />
                    </button>
                  </>
                )}

                {stationId === "local-music" && localTracks.length > 0 ? (
                  <select
                    value={currentTrackIndex}
                    onChange={(e) => {
                      soundEngine.playLocalTrack(Number(e.target.value));
                    }}
                    title="Выбрать трек из C:\Users\dakos\Downloads\MediaHuman\Music"
                    className="min-w-0 flex-1 truncate border border-white/15 bg-black/80 px-1.5 py-0.5 text-[10px] text-white focus:outline-none"
                  >
                    {localTracks.map((tr, idx) => (
                      <option key={tr.id} value={idx} className="bg-[#0a0d12]">
                        {idx + 1}. {tr.artist} — {tr.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-[10px] opacity-80">
                    {stationId === "local-music"
                      ? `Папка: ${localTracks.length} треков`
                      : RADIO_STATIONS.find((s) => s.id === stationId)?.name}
                  </span>
                )}
              </div>

              {/* Row 2: Source Switcher (Local Folder vs Online Radio) + Volume */}
              <div className="flex items-center justify-between gap-2 text-[9px]">
                <div className="flex items-center gap-1 min-w-0">
                  <FolderOpen
                    className="h-2.5 w-2.5 shrink-0"
                    style={{ color: "var(--eco-primary)" }}
                  />
                  <select
                    value={stationId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setStationId(nextId);
                      soundEngine.startRadio(nextId);
                    }}
                    className="max-w-[155px] truncate border border-white/10 bg-black/60 px-1 py-0.5 text-[9px] text-white focus:outline-none"
                  >
                    {RADIO_STATIONS.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0a0d12]">
                        {s.id === "local-music"
                          ? `📁 Моя музыка (${localTracks.length})`
                          : s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 opacity-80">
                  <Volume2 className="h-2.5 w-2.5 shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setVolume(v);
                      soundEngine.setVolume(v);
                    }}
                    className="hud-range w-16"
                  />
                  <span className="w-6 text-right tabular-nums">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <canvas
              ref={spectrumCanvasRef}
              width={86}
              height={36}
              className="shrink-0 border border-white/10 bg-black/40 p-1"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
