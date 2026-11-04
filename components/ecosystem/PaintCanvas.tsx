"use client";

import {
  Download,
  Eraser,
  Grid,
  Paintbrush,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const PALETTE = [
  "#FFFFFF",
  "#94A3B8",
  "#38BDF8",
  "#10B981",
  "#F59E0B",
  "#F43F5E",
  "#A855F7",
  "#000000",
];

const BRUSH_SIZES = [
  { label: "1", size: 1.5 },
  { label: "2", size: 3 },
  { label: "4", size: 6 },
  { label: "8", size: 12 },
];

export default function PaintCanvas({
  initialDrawing,
  onSaveDrawing,
  activeNoteId,
}: {
  initialDrawing?: string;
  onSaveDrawing: (dataUrl: string) => void;
  activeNoteId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [color, setColor] = useState<string>("#FFFFFF");
  const [brushSize, setBrushSize] = useState<number>(3);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Load drawing image onto canvas
  const loadDrawingToCanvas = useCallback((dataUrl?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (dataUrl && dataUrl.startsWith("data:image")) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = dataUrl;
    }
  }, []);

  // Initialize or resize canvas resolution to match container
  const syncCanvasResolution = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const currentImg = canvas.toDataURL("image/png");

    canvas.width = Math.round(rect.width);
    canvas.height = Math.round(rect.height);

    if (currentImg && currentImg.length > 100) {
      loadDrawingToCanvas(currentImg);
    } else if (initialDrawing) {
      loadDrawingToCanvas(initialDrawing);
    }
  }, [initialDrawing, loadDrawingToCanvas]);

  useEffect(() => {
    syncCanvasResolution();
    const ro = new ResizeObserver(() => {
      syncCanvasResolution();
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => ro.disconnect();
  }, [syncCanvasResolution]);

  // When active note changes, load its drawing
  useEffect(() => {
    loadDrawingToCanvas(initialDrawing);
  }, [activeNoteId, initialDrawing, loadDrawingToCanvas]);

  const saveCurrentState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSaveDrawing(dataUrl);
  }, [onSaveDrawing]);

  // Pointer event drawing handlers
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    lastPointRef.current = { x, y };

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }

    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = { x, y };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    saveCurrentState();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCurrentState();
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `sketch-${activeNoteId}.png`;
    a.click();
  };

  return (
    <div className="flex h-full min-h-[280px] flex-col border border-white/10 bg-black/40">
      {/* PAINT TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/50 px-3 py-1.5 font-mono text-xs">
        {/* Tools: Brush vs Eraser */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTool("brush")}
            title="Кисть для рисования"
            className={`border px-2 py-1 transition-colors ${
              tool === "brush"
                ? "border-white/35 font-semibold text-white"
                : "border-white/10 bg-white/[0.02] opacity-60 hover:opacity-100"
            }`}
            style={
              tool === "brush"
                ? {
                    backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                    borderColor: "var(--eco-primary)",
                  }
                : undefined
            }
          >
            <Paintbrush className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={() => setTool("eraser")}
            title="Ластик"
            className={`border px-2 py-1 transition-colors ${
              tool === "eraser"
                ? "border-white/35 font-semibold text-white"
                : "border-white/10 bg-white/[0.02] opacity-60 hover:opacity-100"
            }`}
            style={
              tool === "eraser"
                ? {
                    backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                    borderColor: "var(--eco-primary)",
                  }
                : undefined
            }
          >
            <Eraser className="h-3 w-3" />
          </button>

          {/* Brush Sizes */}
          <div className="ml-1 flex items-center gap-0.5">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                type="button"
                onClick={() => setBrushSize(b.size)}
                title={`Размер кисти: ${b.size}px`}
                className={`h-6 w-6 border text-[10px] transition-colors ${
                  brushSize === b.size
                    ? "border-white/40 font-bold"
                    : "border-white/10 bg-white/[0.02] opacity-50 hover:opacity-100"
                }`}
                style={
                  brushSize === b.size
                    ? {
                        backgroundColor: "rgba(var(--eco-primary-rgb), 0.2)",
                        borderColor: "var(--eco-primary)",
                        color: "var(--eco-primary)",
                      }
                    : undefined
                }
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        {tool === "brush" && (
          <div className="flex items-center gap-1">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                title={c}
                className={`h-4 w-4 border transition-transform hover:scale-125 ${
                  color.toUpperCase() === c.toUpperCase()
                    ? "ring-1 ring-white"
                    : "border-white/30"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="relative ml-1 h-5 w-5 cursor-pointer border border-white/20">
              <span className="block h-full w-full" style={{ backgroundColor: color }} />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            title="Вкл/выкл инженерную сетку"
            className={`border p-1 ${
              showGrid
                ? "border-white/25 bg-white/[0.08] text-white"
                : "border-white/10 opacity-50"
            }`}
          >
            <Grid className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={handleClear}
            title="Очистить холст"
            className="border border-white/10 bg-white/[0.02] p-1 opacity-70 transition-colors hover:border-rose-400/40 hover:text-rose-300 hover:opacity-100"
          >
            <Trash2 className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={handleExport}
            title="Экспорт рисунка (.png)"
            className="border border-white/10 bg-white/[0.02] p-1 opacity-70 transition-colors hover:border-white/30 hover:opacity-100"
          >
            <Download className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* DRAWING SURFACE */}
      <div
        ref={containerRef}
        className="relative flex-1 cursor-crosshair overflow-hidden bg-[#07090E]"
        style={
          showGrid
            ? {
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }
            : undefined
        }
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-0 touch-none block h-full w-full"
        />

        {/* Empty placeholder helper */}
        {!initialDrawing && (
          <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-[9px] uppercase tracking-widest opacity-25">
            ХОЛСТ ДЛЯ РИСОВАНИЯ // АВТОСОХРАНЕНИЕ
          </div>
        )}
      </div>
    </div>
  );
}
