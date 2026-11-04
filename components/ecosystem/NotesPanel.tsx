"use client";

import {
  Columns2,
  Download,
  FileText,
  Paintbrush,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useEcosystem } from "./EcosystemContext";
import PaintCanvas from "./PaintCanvas";

export default function NotesPanel() {
  const { notes, addNote, updateNote, deleteNote } = useEcosystem();

  const [selectedId, setSelectedId] = useState<string | null>(
    notes[0]?.id ?? null
  );
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"split" | "text" | "paint">("split");

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? notes.filter((n) =>
          `${n.title} ${n.content} ${n.tag}`.toLowerCase().includes(q)
        )
      : notes;
    return [...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [notes, search]);

  const activeNote = useMemo(
    () =>
      notes.find((n) => n.id === selectedId) ??
      filteredNotes[0] ??
      null,
    [notes, selectedId, filteredNotes]
  );

  const handleCreate = () => {
    const id = addNote({ title: "Без названия", content: "", tag: "Заметка" });
    setSelectedId(id);
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    if (selectedId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
    }
  };

  const handleExportText = () => {
    if (!activeNote) return;
    const blob = new Blob([`# ${activeNote.title}\n\n${activeNote.content}`], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeNote.title || "note"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] uppercase tracking-widest opacity-45">
            02 //
          </span>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Блокнот и Холст (Paint)
          </h2>
          <span className="border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs tabular-nums opacity-80">
            {notes.length}
          </span>
        </div>

        {/* View Mode Switcher + New Note Button */}
        <div className="flex items-center gap-2">
          {activeNote && (
            <div className="flex border border-white/10 bg-black/40 p-0.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                title="Сплит: Текст + Холст Paint"
                className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
                  viewMode === "split"
                    ? "font-semibold text-white"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={
                  viewMode === "split"
                    ? {
                        backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                        color: "var(--eco-primary)",
                      }
                    : undefined
                }
              >
                <Columns2 className="h-3 w-3" />
                <span className="hidden sm:inline">Сплит</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("text")}
                title="Только текст"
                className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
                  viewMode === "text"
                    ? "font-semibold text-white"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={
                  viewMode === "text"
                    ? {
                        backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                        color: "var(--eco-primary)",
                      }
                    : undefined
                }
              >
                <FileText className="h-3 w-3" />
                <span className="hidden sm:inline">Текст</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("paint")}
                title="Только холст для рисования"
                className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
                  viewMode === "paint"
                    ? "font-semibold text-white"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={
                  viewMode === "paint"
                    ? {
                        backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                        color: "var(--eco-primary)",
                      }
                    : undefined
                }
              >
                <Paintbrush className="h-3 w-3" />
                <span className="hidden sm:inline">Paint</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-xs font-medium transition-colors hover:bg-white/[0.08]"
            style={{
              backgroundColor: "rgba(var(--eco-primary-rgb), 0.16)",
              borderColor: "var(--eco-primary)",
              color: "var(--eco-text)",
            }}
          >
            <Plus className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
            Новая запись
          </button>
        </div>
      </div>

      {/* Main Split View: Left List + Right Editor/Paint Area */}
      <div className="mt-3 grid min-h-0 flex-1 gap-3.5 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Left List of Notes */}
        <div className="flex min-h-0 flex-col gap-2">
          <div className="glass-subtle flex items-center gap-2 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 opacity-55" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              aria-label="Поиск заметок"
              className="min-w-0 flex-1 bg-transparent font-mono text-xs placeholder:text-slate-400/55 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <p className="py-6 text-center font-mono text-xs opacity-50">
                НЕТ ЗАПИСЕЙ
              </p>
            ) : (
              filteredNotes.map((n) => {
                const isSelected = activeNote?.id === n.id;
                const hasDrawing = Boolean(n.drawing && n.drawing.length > 50);

                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(n.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(n.id);
                      }
                    }}
                    className={`group flex cursor-pointer flex-col border p-2.5 transition-colors ${
                      isSelected
                        ? "bg-white/[0.08]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                    style={
                      isSelected
                        ? { borderColor: "var(--eco-primary)" }
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        {hasDrawing && (
                          <span
                            title="Есть эскиз"
                            className="shrink-0 text-[10px]"
                            style={{ color: "var(--eco-primary)" }}
                          >
                            ✎
                          </span>
                        )}
                        <p className="truncate text-xs font-semibold">
                          {n.title || "Без названия"}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateNote(n.id, { pinned: !n.pinned });
                          }}
                          title={n.pinned ? "Открепить" : "Закрепить"}
                          className={`p-0.5 transition-opacity ${
                            n.pinned
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-60 hover:!opacity-100"
                          }`}
                          style={
                            n.pinned ? { color: "var(--eco-primary)" } : undefined
                          }
                        >
                          <Pin className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n.id);
                          }}
                          title="Удалить запись"
                          className="p-0.5 opacity-0 transition-opacity group-hover:opacity-60 hover:text-rose-400 hover:!opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-1 line-clamp-2 text-[11px] opacity-60">
                      {n.content || (hasDrawing ? "[Сохранённый эскиз]" : "Пустая запись...")}
                    </p>

                    <div className="mt-2 flex items-center justify-between font-mono text-[10px] opacity-50">
                      <span>#{n.tag}</span>
                      <span>{n.updatedAt}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Editor + Paint Canvas Area */}
        {activeNote ? (
          <div className="glass-subtle flex min-h-[320px] flex-col p-3 sm:p-4">
            {/* Note title, tag, actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) =>
                  updateNote(activeNote.id, { title: e.target.value })
                }
                placeholder="Заголовок записи..."
                aria-label="Заголовок заметки"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold focus:outline-none sm:text-base"
              />

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={activeNote.tag}
                  onChange={(e) =>
                    updateNote(activeNote.id, { tag: e.target.value })
                  }
                  placeholder="Категория"
                  aria-label="Тег заметки"
                  className="w-24 border border-white/10 bg-black/30 px-2 py-1 font-mono text-xs focus:border-white/25 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleExportText}
                  title="Экспорт текста (.txt)"
                  className="border border-white/10 bg-white/[0.04] p-1.5 opacity-75 transition-opacity hover:opacity-100"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(activeNote.id)}
                  title="Удалить запись"
                  className="border border-white/10 bg-white/[0.04] p-1.5 opacity-75 transition-colors hover:border-rose-400/40 hover:text-rose-300 hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Content Display based on viewMode (Split, Text, Paint) */}
            <div className="mt-3 grid min-h-0 flex-1 gap-3 overflow-hidden">
              {viewMode === "split" && (
                <div className="grid h-full min-h-0 gap-3 md:grid-cols-2">
                  {/* Left: Textarea */}
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider opacity-45">
                      ТЕКСТ ЗАПИСИ //
                    </div>
                    <textarea
                      value={activeNote.content}
                      onChange={(e) =>
                        updateNote(activeNote.id, { content: e.target.value })
                      }
                      placeholder="Начните писать текст заметки..."
                      aria-label="Текст заметки"
                      className="h-full w-full flex-1 resize-none border border-white/10 bg-black/25 p-3 font-sans text-xs leading-relaxed focus:border-white/30 focus:outline-none sm:text-sm"
                    />
                  </div>

                  {/* Right: Paint Window */}
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider opacity-45">
                      <span>ХОЛСТ ДЛЯ РИСОВАНИЯ (PAINT) //</span>
                      {activeNote.drawing && <span>✓ ЭСКИЗ СОХРАНЁН</span>}
                    </div>
                    <div className="h-full min-h-0 flex-1">
                      <PaintCanvas
                        key={activeNote.id}
                        activeNoteId={activeNote.id}
                        initialDrawing={activeNote.drawing}
                        onSaveDrawing={(dataUrl) =>
                          updateNote(activeNote.id, { drawing: dataUrl })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {viewMode === "text" && (
                <textarea
                  value={activeNote.content}
                  onChange={(e) =>
                    updateNote(activeNote.id, { content: e.target.value })
                  }
                  placeholder="Текст записи..."
                  aria-label="Текст заметки"
                  className="h-full w-full flex-1 resize-none border border-white/10 bg-black/25 p-3 font-sans text-sm leading-relaxed focus:border-white/30 focus:outline-none"
                />
              )}

              {viewMode === "paint" && (
                <div className="h-full min-h-0 flex-1">
                  <PaintCanvas
                    key={activeNote.id}
                    activeNoteId={activeNote.id}
                    initialDrawing={activeNote.drawing}
                    onSaveDrawing={(dataUrl) =>
                      updateNote(activeNote.id, { drawing: dataUrl })
                    }
                  />
                </div>
              )}
            </div>

            {/* Note Footer metadata */}
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[10px] uppercase tracking-wider opacity-50">
              <span>Символов: {activeNote.content.length}</span>
              <span>
                {activeNote.drawing ? "[Эскиз прикреплён] • " : ""}
                Изменено: {activeNote.updatedAt}
              </span>
            </div>
          </div>
        ) : (
          <div className="glass-subtle flex flex-col items-center justify-center p-8 text-center">
            <FileText className="h-7 w-7 opacity-35" />
            <p className="mt-2 font-mono text-xs opacity-70">
              Выберите существующую запись или создайте новую
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
