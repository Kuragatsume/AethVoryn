"use client";

import { Terminal as TerminalIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { soundEngine } from "@/utils/soundEngine";
import { useEcosystem } from "./EcosystemContext";

type LogLine = {
  id: string;
  kind: "cmd" | "out" | "accent" | "err";
  text: string;
};

const ASCII_BANNER = `   ___    ______ ______ __  __ _    __ ____   ____ __  __ _   __
  /   |  / ____//_  __// / / /| |  / // __ \\ / __ \\\\ \\/ // | / /
 / /| | / __/    / /  / /_/ / | | / // / / // /_/ / \\  //  |/ / 
/ ___ |/ /___   / /  / __  /  | |/ // /_/ // _, _/  / // /|  /  
/_/  |_/_____/  /_/  /_/ /_/   |___/ \\____//_/ |_|  /_//_/ |_/   [OS v4.2]`;

const QUICK_COMMANDS = [
  "help",
  "sysinfo",
  "news",
  "notes",
  "weather",
  "crypto",
  "ping",
  "matrix",
  "export",
  "clear",
];

export default function TerminalPanel() {
  const {
    news,
    refreshNews,
    notes,
    addNote,
    themes,
    activeThemeId,
    selectTheme,
    openWindow,
    exportProfileJson,
  } = useEcosystem();

  const [lines, setLines] = useState<LogLine[]>([
    { id: "init-1", kind: "accent", text: ASCII_BANNER },
    {
      id: "init-2",
      kind: "out",
      text: "Ядро терминала AETH-CLI инициализировано. Введите 'help' или нажмите на быстрые команды выше.",
    },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [matrixMode, setMatrixMode] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);

  const appendLog = (kind: LogLine["kind"], text: string) => {
    setLines((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind, text },
    ]);
    window.setTimeout(() => {
      outputRef.current?.scrollTo({
        top: outputRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 20);
  };

  // Optional Matrix digital rain canvas inside terminal
  useEffect(() => {
    if (!matrixMode) return;
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = (canvas.width = canvas.offsetWidth || 640);
    const h = (canvas.height = canvas.offsetHeight || 420);
    const cols = Math.floor(w / 14);
    const drops = Array(cols).fill(1);
    const chars = "AETHVORYN0123456789ABCDEF<>[]/#$%&*+=-";

    const id = window.setInterval(() => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, w, h);
      const primary =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--eco-primary")
          .trim() || "#10B981";
      ctx.fillStyle = primary;
      ctx.font = "11px monospace";
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * 14, drops[i] * 14);
        if (drops[i] * 14 > h && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }, 45);

    return () => window.clearInterval(id);
  }, [matrixMode]);

  const executeCommand = async (raw: string) => {
    const cmdLine = raw.trim();
    if (!cmdLine) return;
    appendLog("cmd", `operator@aethvoryn:~$ ${cmdLine}`);
    setHistory((prev) => [cmdLine, ...prev.slice(0, 30)]);
    setHistIdx(-1);

    const [cmd, ...args] = cmdLine.split(/\s+/);
    const lowerCmd = cmd.toLowerCase();
    const argStr = args.join(" ");

    switch (lowerCmd) {
      case "help":
        appendLog(
          "out",
          [
            "ДОСТУПНЫЕ КОМАНДЫ AETH-CLI:",
            "  sysinfo            — Сведения о системе, аппаратуре и активных модулях",
            "  news [refresh]     — Вывести топ-6 свежих технологических новостей (или обновить)",
            "  notes              — Список заметок в Блокноте",
            "  note <текст>       — Быстро создать новую заметку",
            "  calc <выражение>   — Вычислить математическое выражение (напр. calc 1920*9/16)",
            "  weather            — Текущая метеосводка (Open-Meteo API)",
            "  crypto             — Живые котировки BTC / ETH / SOL",
            "  ping               — Замерить реальную сетевую задержку (мс)",
            "  theme <название>   — Переключить тему (graphite, cobalt, emerald, onyx, bronze)",
            "  open <window>      — Открыть окно (news, notes, ai, settings)",
            "  matrix             — Вкл/Выкл цифровой дождь в терминале",
            "  export             — Скачать полный JSON-бэкап профиля",
            "  clear              — Очистить консоль",
          ].join("\n")
        );
        break;

      case "clear":
      case "cls":
        setLines([]);
        break;

      case "sysinfo":
      case "neofetch": {
        const cores =
          typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 8 : 8;
        const screenRes =
          typeof window !== "undefined"
            ? `${window.screen.width}x${window.screen.height} (Viewport: ${window.innerWidth}x${window.innerHeight})`
            : "1920x1080";
        const currentTheme =
          themes.find((t) => t.id === activeThemeId)?.name || activeThemeId;
        appendLog("accent", ASCII_BANNER);
        appendLog(
          "out",
          [
            `ОС:           AETHVORYN Digital Workspace [OS v4.2]`,
            `Ядро:         Next.js 16 / React 19 / WebAudio HUD Engine`,
            `Логич. ядра:  ${cores} потоков CPU`,
            `Разрешение:   ${screenRes}`,
            `Активная тема:${currentTheme}`,
            `База данных:  Новостей: ${news.length} | Заметок: ${notes.length}`,
          ].join("\n")
        );
        break;
      }

      case "news":
        if (argStr.toLowerCase() === "refresh") {
          appendLog("out", "Запрос свежего потока технологических новостей...");
          await refreshNews();
          appendLog("accent", `✓ Поток обновлён (${news.length} материалов).`);
        } else {
          const top = news.slice(0, 6);
          appendLog(
            "out",
            [
              `СВЕЖИЕ ТЕХНОЛОГИЧЕСКИЕ НОВОСТИ (${top.length} из ${news.length}):`,
              ...top.map(
                (n, i) => `  0${i + 1}. [${n.source}] ${n.title} (${n.category})`
              ),
            ].join("\n")
          );
        }
        break;

      case "notes":
        if (notes.length === 0) {
          appendLog("out", "Блокнот пуст.");
        } else {
          appendLog(
            "out",
            [
              `ЗАПИСИ В БЛОКНОТЕ (${notes.length}):`,
              ...notes.map(
                (n, i) =>
                  `  ${i + 1}. [${n.tag}] ${n.title} — ${n.content
                    .replace(/\n/g, " ")
                    .slice(0, 65)}`
              ),
            ].join("\n")
          );
        }
        break;

      case "note":
        if (!argStr) {
          appendLog("err", "Укажите текст заметки: note Проверить конфигурацию");
        } else {
          addNote({
            title: argStr.slice(0, 40),
            content: argStr,
            tag: "CLI",
          });
          appendLog("accent", `✓ Заметка «${argStr.slice(0, 40)}» сохранена в Блокнот.`);
        }
        break;

      case "calc": {
        if (!argStr) {
          appendLog("err", "Пример: calc (1920 * 9) / 16");
          break;
        }
        try {
          const cleaned = argStr.replace(/[^0-9+\-*/().\s^%]/g, "").replace(/\^/g, "**");
          const val = Function(`"use strict"; return (${cleaned});`)();
          appendLog("accent", `${argStr} = ${val}`);
        } catch {
          appendLog("err", "Ошибка вычисления выражения.");
        }
        break;
      }

      case "ping": {
        const t0 = performance.now();
        try {
          await fetch("/icon.svg", { cache: "no-store" });
          const dt = Math.round(performance.now() - t0);
          appendLog(
            "accent",
            `PING localhost:3456 — 64 bytes: time=${dt}ms TTL=64 (Статус: ОПТИМАЛЬНО)`
          );
        } catch {
          appendLog("err", "Сбой сетевого эхо-запроса.");
        }
        break;
      }

      case "weather": {
        appendLog("out", "Запрос метеоданных со спутника Open-Meteo (Москва)...");
        try {
          const res = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=55.7558&longitude=37.6173&current=temperature_2m,wind_speed_10m,relative_humidity_2m"
          );
          const data = await res.json();
          const cur = data?.current;
          if (cur) {
            appendLog(
              "accent",
              `МЕТЕОСВОДКА [55.75°N, 37.61°E]: Температура: ${cur.temperature_2m}°C | Ветер: ${cur.wind_speed_10m} км/ч | Влажность: ${cur.relative_humidity_2m}%`
            );
          } else {
            appendLog("err", "Не удалось декодировать ответ метеостанции.");
          }
        } catch {
          appendLog("err", "Нет соединения с метеосервером.");
        }
        break;
      }

      case "crypto": {
        appendLog("out", "Запрос биржевых котировок (BTC / ETH / SOL)...");
        try {
          const res = await fetch(
            'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]'
          );
          const data = await res.json();
          if (Array.isArray(data)) {
            const formatted = data
              .map((item: any) => {
                const sym = item.symbol.replace("USDT", "");
                const price = Number(item.lastPrice).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                });
                const chg = Number(item.priceChangePercent).toFixed(2);
                return `  • ${sym}/USD: $${price} (${Number(chg) >= 0 ? "+" : ""}${chg}%)`;
              })
              .join("\n");
            appendLog("accent", `КОТИРОВКИ РЫНКА (24Ч):\n${formatted}`);
          }
        } catch {
          appendLog(
            "out",
            "Рыночный шлюз в автономном режиме. Смотрите виджет ТЕЛЕМЕТРИЯ → РЫНОК."
          );
        }
        break;
      }

      case "theme": {
        const q = argStr.toLowerCase();
        const found = themes.find(
          (t) =>
            t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
        );
        if (found) {
          selectTheme(found.id);
          appendLog("accent", `✓ Активирована тема «${found.name}».`);
        } else {
          appendLog(
            "out",
            `Доступные темы: ${themes.map((t) => `${t.id} (${t.name})`).join(", ")}`
          );
        }
        break;
      }

      case "open": {
        const target = argStr.toLowerCase();
        if (["news", "notes", "ai", "settings", "terminal"].includes(target)) {
          openWindow(target);
          appendLog("accent", `✓ Открыто окно [${target.toUpperCase()}].`);
        } else {
          appendLog("err", "Укажите окно: open news | notes | ai | settings");
        }
        break;
      }

      case "matrix":
        setMatrixMode((v) => {
          const next = !v;
          appendLog(
            "accent",
            next
              ? "✓ Матричный поток активирован."
              : "Матричный поток деактивирован."
          );
          return next;
        });
        break;

      case "export":
        exportProfileJson();
        appendLog("accent", "✓ Файл резервной копии профиля (.JSON) сформирован.");
        break;

      default:
        appendLog(
          "err",
          `Неизвестная команда: '${cmd}'. Введите 'help' для списка команд.`
        );
        break;
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    soundEngine.playClick();
    const raw = input;
    setInput("");
    executeCommand(raw);
  };

  return (
    <div
      className="relative flex h-full flex-col bg-black/75 font-mono text-xs"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Matrix Rain Canvas Overlay */}
      {matrixMode && (
        <canvas
          ref={matrixCanvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
        />
      )}

      {/* Quick Command Bar */}
      <div className="relative z-10 flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-black/60 px-3 py-2">
        <TerminalIcon
          className="mr-1 h-3.5 w-3.5 shrink-0"
          style={{ color: "var(--eco-primary)" }}
        />
        {QUICK_COMMANDS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundEngine.playClick();
              executeCommand(c);
            }}
            className="border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors hover:border-white/40 hover:bg-white/10"
          >
            {c}
          </button>
        ))}
      </div>

      {/* Console Log Area */}
      <div
        ref={outputRef}
        className="relative z-10 flex-1 space-y-2 overflow-y-auto p-4 select-text"
      >
        {lines.map((l) => (
          <pre
            key={l.id}
            className={`whitespace-pre-wrap break-words font-mono text-xs leading-relaxed ${
              l.kind === "cmd"
                ? "font-bold text-white"
                : l.kind === "err"
                ? "text-rose-400"
                : l.kind === "accent"
                ? "font-semibold"
                : "text-white/80"
            }`}
            style={
              l.kind === "accent" ? { color: "var(--eco-primary)" } : undefined
            }
          >
            {l.text}
          </pre>
        ))}
      </div>

      {/* Prompt Input */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex items-center gap-2 border-t border-white/15 bg-black/80 px-4 py-2.5"
      >
        <span
          className="shrink-0 font-bold"
          style={{ color: "var(--eco-primary)" }}
        >
          operator@aethvoryn:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            soundEngine.playKey();
            setInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              if (history.length > 0) {
                const nextIdx = Math.min(history.length - 1, histIdx + 1);
                setHistIdx(nextIdx);
                setInput(history[nextIdx]);
              }
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              if (histIdx > 0) {
                const nextIdx = histIdx - 1;
                setHistIdx(nextIdx);
                setInput(history[nextIdx]);
              } else {
                setHistIdx(-1);
                setInput("");
              }
            }
          }}
          placeholder="Введите команду (help, sysinfo, news, weather, crypto, calc 2+2)..."
          className="w-full bg-transparent font-mono text-xs text-white placeholder-white/30 focus:outline-none"
        />
      </form>
    </div>
  );
}
