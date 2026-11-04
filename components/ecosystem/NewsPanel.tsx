"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  ChevronDown,
  Clock,
  ExternalLink,
  Newspaper,
  RefreshCw,
  Search,
  Tag,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ExternalNewsItem } from "@/app/api/news/route";
import SpotlightCard from "../ui/SpotlightCard";
import { useEcosystem } from "./EcosystemContext";

const SOURCES = [
  "Все",
  "Habr Новости",
  "3DNews",
  "Habr Статьи",
  "Dev.to",
  "Закладки",
] as const;

type SourceFilter = (typeof SOURCES)[number];

export default function NewsPanel() {
  const { news, newsLoading, refreshNews, bookmarkedIds, toggleBookmark } =
    useEcosystem();

  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("Все");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of news) {
      for (const t of item.tags) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([t]) => t);
  }, [news]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return news.filter((item) => {
      if (sourceFilter === "Закладки") {
        if (!bookmarkedIds.includes(item.id)) return false;
      } else if (sourceFilter !== "Все" && item.source !== sourceFilter) {
        return false;
      }
      if (selectedTag && !item.tags.includes(selectedTag)) return false;
      if (q) {
        const hay =
          `${item.title} ${item.summary} ${item.category} ${item.source} ${item.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [news, query, sourceFilter, selectedTag, bookmarkedIds]);

  const hasActiveFilters =
    sourceFilter !== "Все" || selectedTag !== null || query.trim() !== "";

  const resetFilters = () => {
    setQuery("");
    setSourceFilter("Все");
    setSelectedTag(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] uppercase tracking-widest opacity-45">
            01 //
          </span>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Новости технологий
          </h2>
          <span className="rounded-sm border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs tabular-nums opacity-80">
            {filtered.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => refreshNews()}
          disabled={newsLoading}
          title="Обновить ленту новостей"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium transition-colors hover:border-white/25 hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${newsLoading ? "animate-spin" : ""}`}
            style={{ color: "var(--eco-primary)" }}
          />
          Обновить
        </button>
      </div>

      {/* Search & Filters */}
      <div className="mt-3 space-y-2.5">
        <div className="glass-subtle flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-colors focus-within:border-white/25">
          <Search className="h-3.5 w-3.5 shrink-0 opacity-55" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по заголовкам, источникам и тегам..."
            aria-label="Поиск по новостям"
            className="min-w-0 flex-1 bg-transparent text-xs placeholder:text-slate-400/55 focus:outline-none sm:text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Очистить"
              className="rounded p-1 opacity-60 hover:bg-white/10 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Source filter tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {SOURCES.map((src) => {
              const active = sourceFilter === src;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSourceFilter(src)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "font-semibold"
                      : "border-white/10 bg-white/[0.03] opacity-75 hover:border-white/20 hover:opacity-100"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
                          borderColor: "var(--eco-primary)",
                          color: "var(--eco-text)",
                        }
                      : undefined
                  }
                >
                  {src}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="font-mono text-[11px] underline opacity-70 hover:opacity-100"
              style={{ color: "var(--eco-primary)" }}
            >
              Сбросить
            </button>
          )}
        </div>

        {/* Popular tags */}
        {popularTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {popularTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(active ? null : tag)}
                  className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                    active
                      ? "border-white/30 bg-white/15"
                      : "border-white/10 bg-white/[0.02] opacity-60 hover:opacity-100"
                  }`}
                  style={active ? { color: "var(--eco-primary)" } : undefined}
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* News Feed */}
      <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="glass-subtle flex flex-col items-center justify-center rounded-lg p-10 text-center">
            <Newspaper className="h-6 w-6 opacity-40" />
            <p className="mt-2.5 text-xs font-medium opacity-80">
              Публикаций по заданным критериям не найдено
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 rounded-md border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium hover:bg-white/10"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          filtered.map((item) => (
            <TechNewsCard
              key={item.id}
              item={item}
              bookmarked={bookmarkedIds.includes(item.id)}
              expanded={expandedId === item.id}
              onToggleExpand={() =>
                setExpandedId((c) => (c === item.id ? null : item.id))
              }
              onToggleBookmark={() => toggleBookmark(item.id)}
              onSelectTag={(t) =>
                setSelectedTag((c) => (c === t ? null : t))
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

function TechNewsCard({
  item,
  bookmarked,
  expanded,
  onToggleExpand,
  onToggleBookmark,
  onSelectTag,
}: {
  item: ExternalNewsItem;
  bookmarked: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleBookmark: () => void;
  onSelectTag: (t: string) => void;
}) {
  return (
    <SpotlightCard>
      <article className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(var(--eco-primary-rgb), 0.12)",
                color: "var(--eco-primary)",
                border: "1px solid rgba(var(--eco-primary-rgb), 0.3)",
              }}
            >
              {item.source}
            </span>
            <span className="rounded-sm border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] opacity-75">
              {item.category}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] opacity-55">
              <Clock className="h-3 w-3" /> {item.date}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleBookmark}
              title={bookmarked ? "Убрать из закладок" : "В закладки"}
              className="rounded p-1.5 transition-colors hover:bg-white/10"
              style={{
                color: bookmarked ? "var(--eco-primary)" : undefined,
                opacity: bookmarked ? 1 : 0.5,
              }}
            >
              <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Открыть источник"
              className="rounded p-1.5 opacity-60 transition-opacity hover:bg-white/10 hover:opacity-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          className="mt-2 flex w-full items-start justify-between gap-3 text-left"
        >
          <h3 className="text-sm font-semibold leading-snug tracking-tight sm:text-[15px]">
            {item.title}
          </h3>
          <ChevronDown
            className={`mt-1 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        <p className="mt-1.5 text-xs leading-relaxed opacity-75">
          {item.summary}
        </p>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed opacity-85">
                <p>{item.content}</p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[11px] font-medium underline"
                  style={{ color: "var(--eco-primary)" }}
                >
                  Перейти к публикации ({item.source})
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {item.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onSelectTag(t)}
                className="rounded-sm border border-white/10 bg-white/[0.02] px-1.5 py-0.5 font-mono text-[10px] opacity-65 transition-opacity hover:opacity-100"
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </article>
    </SpotlightCard>
  );
}
