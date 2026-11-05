"use client";

import {
  Bot,
  Check,
  FilePlus2,
  KeyRound,
  ListChecks,
  Newspaper,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { soundEngine } from "@/utils/soundEngine";
import { useEcosystem } from "./EcosystemContext";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  timestamp: string;
};

export default function AiAssistantPanel() {
  const {
    news,
    notes,
    addNote,
    openWindow,
    themes,
    selectTheme,
    exportProfileJson,
  } = useEcosystem();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Система AETH-AI [v4.2] активна.\n\nДоступные модули:\n• Суммаризация технологических новостей в 1 клик\n• Структурирование рабочих заметок и формирование чек-листов\n• Голосовое/текстовое управление ОС (например: «создай заметку: ...», «смени тему на изумруд», «открой терминал»)\n• Сохранение любой аналитической выжимки напрямую в Блокнот.",
      timestamp: new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [savedMsgId, setSavedMsgId] = useState<string | null>(null);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aethvoryn_gemini_key") || "";
    }
    return "";
  });
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pushMessage = (role: "assistant" | "user", text: string) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      text,
      timestamp: new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, msg]);
    window.setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 40);
  };

  const generateNewsDigest = (): string => {
    if (!news || news.length === 0) {
      return "Лента новостей пуста. Откройте окно «Новости» для обновления источников.";
    }
    const topItems = news.slice(0, 8);
    const byCategory = new Map<string, number>();
    news.forEach((n) => {
      byCategory.set(n.category, (byCategory.get(n.category) || 0) + 1);
    });
    const catSummary = Array.from(byCategory.entries())
      .map(([c, count]) => `${c}: ${count}`)
      .join(" | ");

    const lines = topItems.map(
      (item, idx) =>
        `${idx + 1}. [${item.source}] ${item.title}\n   └ Категория: ${item.category} • ${item.summary.slice(0, 120)}...`
    );

    return [
      `⚡ АНАЛИТИЧЕСКАЯ СВОДКА НОВОСТЕЙ (${news.length} материалов)`,
      `Распределение по секторам: ${catSummary}`,
      ``,
      `Ключевые технологические тезисы дня:`,
      ...lines,
      ``,
      `Вывод системы: Основной фокус потоков сосредоточен на ИИ-архитектурах, системной разработке и аппаратной оптимизации.`,
    ].join("\n");
  };

  const generateNotesPlan = (): string => {
    if (!notes || notes.length === 0) {
      return "В Блокноте пока нет записей. Создайте первую заметку или используйте команду «создай заметку: текст».";
    }
    const pinned = notes.filter((n) => n.pinned);
    const list = notes.map(
      (n, idx) =>
        `[ ] ${idx + 1}. ${n.title} (${n.tag}) — ${
          n.content ? n.content.replace(/\n/g, " ").slice(0, 90) : "Без описания"
        }${n.drawing ? " [Прикреплена схема Paint]" : ""}`
    );

    return [
      `📋 СТРУКТУРИРОВАННЫЙ ПЛАН ПО ЗАМЕТКАМ (Всего: ${notes.length}, Закреплено: ${pinned.length})`,
      ``,
      ...list,
      ``,
      `Рекомендация: Приоритизируйте закреплённые записи (${
        pinned.map((p) => `«${p.title}»`).join(", ") || "нет закреплённых"
      }).`,
    ].join("\n");
  };

  const handleQuickSummarizeNews = () => {
    soundEngine.playClick();
    pushMessage("user", "Суммаризировать текущую ленту технологических новостей");
    const digest = generateNewsDigest();
    pushMessage("assistant", digest);
  };

  const handleQuickNotesPlan = () => {
    soundEngine.playClick();
    pushMessage("user", "Построить план задач на основе моих заметок");
    const plan = generateNotesPlan();
    pushMessage("assistant", plan);
  };

  const processPrompt = async (rawPrompt: string) => {
    const q = rawPrompt.trim();
    const lower = q.toLowerCase();

    // 1. Check direct OS commands first
    if (
      lower.includes("суммариз") ||
      lower.includes("сводк") ||
      lower.includes("дайджест") ||
      lower === "новости"
    ) {
      pushMessage("assistant", generateNewsDigest());
      return;
    }

    if (lower.includes("план") || lower.includes("анализ заметок")) {
      pushMessage("assistant", generateNotesPlan());
      return;
    }

    if (lower.startsWith("создай заметку") || lower.startsWith("запиши")) {
      const content = q.replace(/^(создай заметку|запиши)\s*:?\s*/i, "").trim();
      const title = content.slice(0, 42) || "Заметка от AETH-AI";
      addNote({
        title,
        content: content || "Создано через ИИ-Ассистента",
        tag: "AI",
      });
      pushMessage(
        "assistant",
        `✓ Заметка «${title}» успешно создана и сохранена в Блокноте [02].`
      );
      return;
    }

    if (lower.includes("тему") || lower.includes("тема")) {
      const matched = themes.find(
        (t) =>
          lower.includes(t.name.toLowerCase()) ||
          (lower.includes("изумруд") && t.id.includes("emerald")) ||
          (lower.includes("кобальт") && t.id.includes("cobalt")) ||
          (lower.includes("бронз") && t.id.includes("amber")) ||
          (lower.includes("оникс") && t.id.includes("onyx")) ||
          (lower.includes("графит") && t.id.includes("graphite"))
      );
      if (matched) {
        selectTheme(matched.id);
        pushMessage("assistant", `✓ Цветовая схема переключена на «${matched.name}».`);
        return;
      }
    }

    if (lower.includes("открой терминал")) {
      openWindow("terminal");
      pushMessage("assistant", "✓ Окно Кибер-Терминала [04] открыто.");
      return;
    }
    if (lower.includes("открой блокнот")) {
      openWindow("notes");
      pushMessage("assistant", "✓ Окно Блокнота [02] открыто.");
      return;
    }
    if (lower.includes("открой настройки")) {
      openWindow("settings");
      pushMessage("assistant", "✓ Окно Настроек [05] открыто.");
      return;
    }
    if (lower.includes("экспорт") || lower.includes("бэкап")) {
      exportProfileJson();
      pushMessage("assistant", "✓ Конфигурация системы экспортирована в файл .JSON.");
      return;
    }

    // 2. If user configured a Gemini API key, query Gemini API directly
    if (geminiKey.trim()) {
      setLoading(true);
      try {
        const contextStr = `Ты ИИ-ассистент системы AETHVORYN OS. Отвечай кратко, структурно, на русском языке. Текущие заголовки новостей: ${news
          .slice(0, 5)
          .map((n) => n.title)
          .join("; ")}. Заметки пользователя: ${notes
          .slice(0, 5)
          .map((n) => n.title)
          .join("; ")}.`;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
            geminiKey.trim()
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${contextStr}\n\nЗапрос: ${q}` }],
                },
              ],
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Ответ получен, но пуст.";
          pushMessage("assistant", reply);
          setLoading(false);
          return;
        }
      } catch {
        /* fallback to local intelligence */
      } finally {
        setLoading(false);
      }
    }

    // 3. Built-in Local Intelligence search across news & notes
    const matchingNews = news.filter(
      (n) =>
        n.title.toLowerCase().includes(lower) ||
        n.summary.toLowerCase().includes(lower) ||
        n.category.toLowerCase().includes(lower)
    );
    const matchingNotes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(lower) ||
        n.content.toLowerCase().includes(lower)
    );

    if (matchingNews.length > 0 || matchingNotes.length > 0) {
      const parts: string[] = [`Результаты анализа по запросу «${q}»:`];
      if (matchingNews.length > 0) {
        parts.push(
          `\nНайдено в новостях (${matchingNews.length}):`,
          ...matchingNews
            .slice(0, 4)
            .map((m) => `• [${m.source}] ${m.title} — ${m.summary.slice(0, 110)}...`)
        );
      }
      if (matchingNotes.length > 0) {
        parts.push(
          `\nНайдено в блокноте (${matchingNotes.length}):`,
          ...matchingNotes
            .slice(0, 4)
            .map((m) => `• «${m.title}»: ${m.content.slice(0, 100)}`)
        );
      }
      pushMessage("assistant", parts.join("\n"));
      return;
    }

    pushMessage(
      "assistant",
      `Запрос обработан локальным ядром AETH-AI.\n\nВы можете использовать быстрые команды:\n• «Суммаризируй новости» — сводка главных тех-событий\n• «План заметок» — чек-лист по вашему блокноту\n• «Создай заметку: [текст]» — мгновенная запись в блокнот\n• «Смени тему на кобальт / изумруд / бронза»\n• Либо укажите ключ Gemini API (кнопка сверху справа) для облачной генерации.`
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    soundEngine.playClick();
    pushMessage("user", text);
    processPrompt(text);
  };

  const handleSaveToNotes = (msg: ChatMessage) => {
    soundEngine.playSuccess();
    const firstLine = msg.text.split("\n")[0].replace(/[⚡📋✓]/g, "").trim();
    addNote({
      title: firstLine.slice(0, 48) || "Сводка AETH-AI",
      content: msg.text,
      tag: "AI-Сводка",
      pinned: true,
    });
    setSavedMsgId(msg.id);
    window.setTimeout(() => setSavedMsgId(null), 2000);
  };

  return (
    <div className="flex h-full flex-col font-mono text-xs">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/40 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleQuickSummarizeNews}
            className="inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-white/10"
            style={{
              borderColor: "var(--eco-primary)",
              backgroundColor: "rgba(var(--eco-primary-rgb), 0.14)",
            }}
          >
            <Newspaper className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
            <span>Суммаризировать новости</span>
          </button>

          <button
            type="button"
            onClick={handleQuickNotesPlan}
            className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] transition-colors hover:border-white/35 hover:bg-white/10"
          >
            <ListChecks className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
            <span>План по заметкам</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setApiKeyOpen((v) => !v)}
            title="Настроить облачный ключ Gemini API (необязательно)"
            className={`inline-flex items-center gap-1 border px-2 py-1 text-[10px] uppercase transition-colors ${
              geminiKey
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-white/15 bg-white/[0.03] opacity-70 hover:opacity-100"
            }`}
          >
            <KeyRound className="h-3 w-3" />
            <span>{geminiKey ? "API АКТИВЕН" : "API КЛЮЧ"}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setMessages([
                {
                  id: "reset",
                  role: "assistant",
                  text: "История диалога очищена. Готов к работе.",
                  timestamp: new Date().toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ])
            }
            title="Очистить чат"
            className="border border-white/10 bg-white/[0.03] p-1.5 opacity-60 hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Optional Gemini API Key Bar */}
      {apiKeyOpen && (
        <div className="flex items-center gap-2 border-b border-white/10 bg-black/70 px-4 py-2 text-[11px]">
          <span className="shrink-0 opacity-70">Gemini API Key:</span>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => {
              setGeminiKey(e.target.value);
              localStorage.setItem("aethvoryn_gemini_key", e.target.value);
            }}
            placeholder="AIzaSy... (оставьте пустым для локального режима)"
            className="w-full border border-white/15 bg-black/60 px-2.5 py-1 text-xs text-white focus:border-white/40 focus:outline-none"
          />
        </div>
      )}

      {/* Messages Feed */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.map((msg) => {
          const isAi = msg.role === "assistant";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAi ? "items-start" : "items-end"}`}
            >
              <div
                className={`max-w-[92%] border p-3 ${
                  isAi
                    ? "border-white/15 bg-black/55"
                    : "border-white/25 bg-white/[0.08]"
                }`}
                style={
                  isAi
                    ? { borderLeft: "2px solid var(--eco-primary)" }
                    : { borderRight: "2px solid var(--eco-primary)" }
                }
              >
                <div className="mb-1.5 flex items-center justify-between gap-4 border-b border-white/10 pb-1 text-[10px] opacity-60">
                  <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                    {isAi ? (
                      <>
                        <Bot
                          className="h-3 w-3"
                          style={{ color: "var(--eco-primary)" }}
                        />
                        AETH-AI CORE
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        ОПЕРАТОР
                      </>
                    )}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed text-white/90">
                  {msg.text}
                </div>

                {isAi && (
                  <div className="mt-2.5 flex justify-end border-t border-white/10 pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleSaveToNotes(msg)}
                      className="inline-flex items-center gap-1 border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[10px] opacity-75 transition-opacity hover:border-white/35 hover:opacity-100"
                    >
                      {savedMsgId === msg.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-300">Сохранено в Блокнот</span>
                        </>
                      ) : (
                        <>
                          <FilePlus2 className="h-3 w-3" />
                          <span>Сохранить в Блокнот</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="border border-white/10 bg-black/40 px-3 py-2 text-[11px] opacity-70">
            Генерация ответа нейросетью...
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-white/10 bg-black/60 p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Введите запрос или команду (напр. «суммаризируй новости», «создай заметку: ...»)..."
          className="flex-1 border border-white/15 bg-black/70 px-3 py-2 font-mono text-xs text-white placeholder-white/35 focus:border-white/40 focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
          style={{
            borderColor: "var(--eco-primary)",
            backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
          }}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Отправить</span>
        </button>
      </form>
    </div>
  );
}
