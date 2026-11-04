"use client";

import {
  Download,
  FileText,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useEcosystem } from "./EcosystemContext";

export default function NotesPanel() {
  const { notes, addNote, updateNote, deleteNote } = useEcosystem();

  const [selectedId, setSelectedId] = useState<string | null>(
    notes[0]?.id ?? null
  );
  const [search, setSearch] = useState("");

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

  const handleExport = () => {
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] uppercase tracking-widest opacity-45">
            02 //
          </span>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Блокнот
          </h2>
          <span className="rounded-sm border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs tabular-nums opacity-80">
            {notes.length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.08]"
          style={{
            backgroundColor: "rgba(var(--eco-primary-rgb), 0.14)",
            borderColor: "var(--eco-primary)",
            color: "var(--eco-text)",
          }}
        >
          <Plus className="h-3.5 w-3.5" style={{ color: "var(--eco-primary)" }} />
          Новая запись
        </button>
      </div>

      {/* Main Split View */}
      <div className="mt-3 grid min-h-0 flex-1 gap-3.5 md:grid-cols-[240px_minmax(0,1fr)]">
        {/* Left List */}
        <div className="flex min-h-0 flex-col gap-2">
          <div className="glass-subtle flex items-center gap-2 rounded-lg px-3 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 opacity-55" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Фильтр записей..."
              aria-label="Поиск заметок"
              className="min-w-0 flex-1 bg-transparent text-xs placeholder:text-slate-400/55 focus:outline-none"
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
                    className={`group flex cursor-pointer flex-col rounded-lg border p-2.5 transition-colors ${
                      isSelected
                        ? "bg-white/[0.07]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                    style={
                      isSelected
                        ? { borderColor: "var(--eco-primary)" }
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-xs font-semibold">
                        {n.title || "Без названия"}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateNote(n.id, { pinned: !n.pinned });
                          }}
                          title={n.pinned ? "Открепить" : "Закрепить"}
                          className={`rounded p-0.5 transition-opacity ${
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
                          className="rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-60 hover:text-rose-400 hover:!opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] opacity-60">
                      {n.content || "Пустая запись..."}
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

        {/* Right Editor */}
        {activeNote ? (
          <div className="glass-subtle flex min-h-[300px] flex-col rounded-lg p-4">
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
                  className="w-24 rounded-md border border-white/10 bg-black/30 px-2 py-1 font-mono text-xs focus:border-white/25 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleExport}
                  title="Экспорт в .txt"
                  className="rounded-md border border-white/10 bg-white/[0.04] p-1.5 opacity-75 transition-opacity hover:opacity-100"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(activeNote.id)}
                  title="Удалить запись"
                  className="rounded-md border border-white/10 bg-white/[0.04] p-1.5 opacity-75 transition-colors hover:border-rose-400/40 hover:text-rose-300 hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <textarea
              value={activeNote.content}
              onChange={(e) =>
                updateNote(activeNote.id, { content: e.target.value })
              }
              placeholder="Текст записи..."
              aria-label="Текст заметки"
              className="mt-3 w-full flex-1 resize-none bg-transparent font-sans text-sm leading-relaxed focus:outline-none"
            />

            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[10px] uppercase tracking-wider opacity-50">
              <span>Символов: {activeNote.content.length}</span>
              <span>Изменено: {activeNote.updatedAt}</span>
            </div>
          </div>
        ) : (
          <div className="glass-subtle flex flex-col items-center justify-center rounded-lg p-8 text-center">
            <FileText className="h-7 w-7 opacity-35" />
            <p className="mt-2 text-xs opacity-70">
              Выберите существующую запись или создайте новую
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
