"use client";

import {
  Maximize2,
  Minimize2,
  PanelLeft,
  PanelRight,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  useEcosystem,
  type DesktopWindowState,
} from "./EcosystemContext";

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type Props = {
  win: DesktopWindowState;
  isActive: boolean;
  children: ReactNode;
};

const MIN_W = 360;
const MIN_H = 260;

export default function DesktopWindow({ win, isActive, children }: Props) {
  const {
    focusWindow,
    closeWindow,
    updateWindow,
    snapWindow,
    resetWindowPositionAndSize,
    setIsAnyWindowDragging,
  } = useEcosystem();

  const winRef = useRef<HTMLElement>(null);
  const dimTextRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [snapHint, setSnapHint] = useState<"left" | "right" | "maximize" | null>(
    null
  );
  const snapHintRef = useRef<"left" | "right" | "maximize" | null>(null);

  // Keep live geometry in a mutable ref so pointermove never triggers React re-renders
  const geomRef = useRef({
    x: win.x,
    y: win.y,
    width: win.width,
    height: win.height,
  });

  // Sync ref when state updates from outside (e.g. presets in Settings or reset button)
  useEffect(() => {
    geomRef.current = {
      x: win.x,
      y: win.y,
      width: win.width,
      height: win.height,
    };
    const el = winRef.current;
    if (!el) return;
    if (win.isMaximized) {
      el.style.left = "0px";
      el.style.top = "0px";
      el.style.width = "100vw";
      el.style.height = "100vh";
    } else {
      el.style.left = `${win.x}px`;
      el.style.top = `${win.y}px`;
      el.style.width = `${win.width}px`;
      el.style.height = `${win.height}px`;
    }
    if (dimTextRef.current) {
      dimTextRef.current.textContent = win.isMaximized
        ? "100% ЭКРАНА"
        : `${Math.round(win.width)}×${Math.round(win.height)} PX`;
    }
  }, [win.x, win.y, win.width, win.height, win.isMaximized]);

  // DRAG WINDOW BY TOP TITLE BAR (WINDOWS-STYLE + MAGNETIC SNAP ASSIST)
  const handleTitleBarPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (e.button !== 0) return;

    e.preventDefault();
    focusWindow(win.id);

    const el = winRef.current;
    if (!el) return;

    let startX = e.clientX;
    let startY = e.clientY;
    let origX = geomRef.current.x;
    let origY = geomRef.current.y;
    let currentlyMax = win.isMaximized;
    const vw = window.innerWidth;
    const maxPageH = Math.max(
      document.documentElement.scrollHeight,
      window.innerHeight
    );

    el.style.backdropFilter = "none";
    (el.style as any).webkitBackdropFilter = "none";
    setIsAnyWindowDragging(true);

    const onPointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      // If maximized and user drags down/away, unmaximize onto cursor like Windows
      if (currentlyMax) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        currentlyMax = false;
        const restoreW = geomRef.current.width || 960;
        const restoreH = geomRef.current.height || 640;
        origX = Math.max(
          0,
          Math.min(
            vw - restoreW,
            ev.clientX - Math.round(restoreW / 2)
          )
        );
        origY = Math.max(0, window.scrollY + ev.clientY - 18);
        startX = ev.clientX;
        startY = ev.clientY;
        geomRef.current.x = origX;
        geomRef.current.y = origY;
        el.style.position = "absolute";
        el.style.width = `${restoreW}px`;
        el.style.height = `${restoreH}px`;
        updateWindow(win.id, { isMaximized: false, x: origX, y: origY });
      }

      const nextX = Math.max(
        -Math.round(geomRef.current.width * 0.6),
        Math.min(
          vw - 100,
          Math.round(origX + (ev.clientX - startX))
        )
      );
      const nextY = Math.max(
        0,
        Math.min(maxPageH - 48, Math.round(origY + (ev.clientY - startY)))
      );

      geomRef.current.x = nextX;
      geomRef.current.y = nextY;

      // Edge Snap detection
      let nextSnap: "left" | "right" | "maximize" | null = null;
      if (ev.clientY <= 12) {
        nextSnap = "maximize";
      } else if (ev.clientX <= 18) {
        nextSnap = "left";
      } else if (ev.clientX >= vw - 18) {
        nextSnap = "right";
      }
      if (nextSnap !== snapHintRef.current) {
        snapHintRef.current = nextSnap;
        setSnapHint(nextSnap);
      }

      // Direct DOM mutation -> 0 React re-renders, 144+ FPS smooth
      el.style.left = `${nextX}px`;
      el.style.top = `${nextY}px`;
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.style.backdropFilter = "";
      (el.style as any).webkitBackdropFilter = "";
      setIsAnyWindowDragging(false);

      const activeSnap = snapHintRef.current;
      snapHintRef.current = null;
      setSnapHint(null);

      if (activeSnap) {
        snapWindow(win.id, activeSnap);
        return;
      }

      if (!currentlyMax) {
        updateWindow(win.id, {
          x: geomRef.current.x,
          y: geomRef.current.y,
        });
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // RESIZE WINDOW FROM ANY EDGE OR CORNER (8-WAY WINDOWS RESIZE)
  const handleResizePointerDown =
    (dir: ResizeDir) => (e: React.PointerEvent) => {
      if (e.button !== 0 || win.isMaximized) return;
      e.preventDefault();
      e.stopPropagation();

      focusWindow(win.id);

      const el = winRef.current;
      if (!el) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startGeom = { ...geomRef.current };

      setIsAnyWindowDragging(true);
      if (tooltipRef.current) {
        tooltipRef.current.style.display = "block";
        tooltipRef.current.textContent = `${Math.round(
          startGeom.width
        )} × ${Math.round(startGeom.height)} PX`;
      }

      const onPointerMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        let nextX = startGeom.x;
        let nextY = startGeom.y;
        let nextW = startGeom.width;
        let nextH = startGeom.height;

        const maxW = window.innerWidth;
        const maxH = Math.max(
          document.documentElement.scrollHeight,
          window.innerHeight
        );

        if (dir.includes("e")) {
          nextW = Math.max(
            MIN_W,
            Math.min(maxW - startGeom.x, startGeom.width + dx)
          );
        }
        if (dir.includes("s")) {
          nextH = Math.max(
            MIN_H,
            Math.min(maxH - startGeom.y, startGeom.height + dy)
          );
        }
        if (dir.includes("w")) {
          const possibleW = startGeom.width - dx;
          if (possibleW >= MIN_W && startGeom.x + dx >= 0) {
            nextW = possibleW;
            nextX = startGeom.x + dx;
          } else if (startGeom.x + dx < 0) {
            nextX = 0;
            nextW = startGeom.x + startGeom.width;
          } else {
            nextW = MIN_W;
            nextX = startGeom.x + (startGeom.width - MIN_W);
          }
        }
        if (dir.includes("n")) {
          const possibleH = startGeom.height - dy;
          if (possibleH >= MIN_H && startGeom.y + dy >= 0) {
            nextH = possibleH;
            nextY = startGeom.y + dy;
          } else if (startGeom.y + dy < 0) {
            nextY = 0;
            nextH = startGeom.y + startGeom.height;
          } else {
            nextH = MIN_H;
            nextY = startGeom.y + (startGeom.height - MIN_H);
          }
        }

        nextX = Math.round(nextX);
        nextY = Math.round(nextY);
        nextW = Math.round(nextW);
        nextH = Math.round(nextH);

        geomRef.current = { x: nextX, y: nextY, width: nextW, height: nextH };

        el.style.left = `${nextX}px`;
        el.style.top = `${nextY}px`;
        el.style.width = `${nextW}px`;
        el.style.height = `${nextH}px`;

        if (dimTextRef.current) {
          dimTextRef.current.textContent = `${nextW}×${nextH} PX`;
        }
        if (tooltipRef.current) {
          tooltipRef.current.textContent = `${nextW} × ${nextH} PX`;
        }
      };

      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
        setIsAnyWindowDragging(false);
        updateWindow(win.id, {
          x: geomRef.current.x,
          y: geomRef.current.y,
          width: geomRef.current.width,
          height: geomRef.current.height,
        });
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    };

  const cornerBorderColor = isActive
    ? "var(--eco-primary)"
    : "rgba(255,255,255,0.22)";

  // Ensure open windows ALWAYS sit above desktop logo, top controls (z-20) and widgets (z-25)
  const effectiveZIndex = win.isMaximized ? 9980 : 100 + win.zIndex;

  return (
    <>
      {/* SNAP ASSIST PREVIEW OVERLAY */}
      {snapHint && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[9978] border-2 transition-all duration-150"
          style={{
            borderColor: "var(--eco-primary)",
            backgroundColor: "rgba(var(--eco-primary-rgb), 0.14)",
            top: snapHint === "maximize" ? "0px" : "68px",
            left:
              snapHint === "right"
                ? "calc(50vw - 28px)"
                : snapHint === "left"
                ? "12px"
                : "0px",
            width:
              snapHint === "maximize"
                ? "100vw"
                : "calc(50vw - 48px)",
            height:
              snapHint === "maximize"
                ? "100vh"
                : "calc(100vh - 88px)",
          }}
        />
      )}

      <section
        ref={winRef}
        onPointerDownCapture={() => {
          if (!isActive) focusWindow(win.id);
        }}
        className={`glass flex flex-col overflow-hidden rounded-none ${
          win.isMaximized ? "fixed inset-0" : "absolute"
        }`}
        style={{
          position: win.isMaximized ? "fixed" : "absolute",
          left: win.isMaximized ? "0px" : `${win.x}px`,
          top: win.isMaximized ? "0px" : `${win.y}px`,
          width: win.isMaximized ? "100vw" : `${win.width}px`,
          height: win.isMaximized ? "100vh" : `${win.height}px`,
          zIndex: effectiveZIndex,
          borderColor: isActive
            ? "rgba(var(--eco-primary-rgb), 0.55)"
            : "rgba(255, 255, 255, 0.14)",
          boxShadow: isActive
            ? "0 26px 80px rgba(0, 0, 0, 0.92)"
            : "0 14px 40px rgba(0, 0, 0, 0.7)",
          willChange: "left, top, width, height",
        }}
      >
        {/* SHARP HUD CORNER BRACKETS (┌ ┐ └ ┘) */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-[1px] -top-[1px] z-30 h-3 w-3 border-l-2 border-t-2"
          style={{ borderColor: cornerBorderColor }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-[1px] -top-[1px] z-30 h-3 w-3 border-r-2 border-t-2"
          style={{ borderColor: cornerBorderColor }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-[1px] -left-[1px] z-30 h-3 w-3 border-b-2 border-l-2"
          style={{ borderColor: cornerBorderColor }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-[1px] -right-[1px] z-30 h-3 w-3 border-b-2 border-r-2"
          style={{ borderColor: cornerBorderColor }}
        />

        {/* 8-DIRECTIONAL RESIZE HANDLES (EDGES & CORNERS LIKE WINDOWS) */}
        {!win.isMaximized && (
          <>
            <div
              onPointerDown={handleResizePointerDown("n")}
              className="absolute inset-x-3 top-0 z-40 h-1.5 cursor-ns-resize"
            />
            <div
              onPointerDown={handleResizePointerDown("s")}
              className="absolute inset-x-3 bottom-0 z-40 h-1.5 cursor-ns-resize"
            />
            <div
              onPointerDown={handleResizePointerDown("w")}
              className="absolute inset-y-3 left-0 z-40 w-1.5 cursor-ew-resize"
            />
            <div
              onPointerDown={handleResizePointerDown("e")}
              className="absolute inset-y-3 right-0 z-40 w-1.5 cursor-ew-resize"
            />
            <div
              onPointerDown={handleResizePointerDown("nw")}
              className="absolute left-0 top-0 z-40 h-3 w-3 cursor-nwse-resize"
            />
            <div
              onPointerDown={handleResizePointerDown("ne")}
              className="absolute right-0 top-0 z-40 h-3 w-3 cursor-nesw-resize"
            />
            <div
              onPointerDown={handleResizePointerDown("sw")}
              className="absolute bottom-0 left-0 z-40 h-3 w-3 cursor-nesw-resize"
            />
            <div
              role="button"
              aria-label="Изменить размер окна"
              title="Потяните для изменения размера"
              onPointerDown={handleResizePointerDown("se")}
              className="group/resize absolute bottom-0 right-0 z-40 flex h-6 w-6 cursor-nwse-resize items-end justify-end p-1 select-none"
            >
              <div
                ref={tooltipRef}
                style={{ display: "none" }}
                className="pointer-events-none absolute bottom-7 right-1 whitespace-nowrap border border-white/25 bg-black/95 px-2 py-0.5 font-mono text-[10px] text-white shadow-lg"
              />
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
                className="opacity-50 transition-opacity group-hover/resize:opacity-100"
                style={{ color: "var(--eco-primary)" }}
              >
                <path
                  d="M10 2L2 10M10 6L6 10M10 10H10.01"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
              </svg>
            </div>
          </>
        )}

        {/* DRAGGABLE WINDOWS-STYLE TOP TITLE BAR */}
        <div
          onPointerDown={handleTitleBarPointerDown}
          onDoubleClick={() =>
            updateWindow(win.id, { isMaximized: !win.isMaximized })
          }
          className={`relative z-20 flex shrink-0 cursor-move select-none items-center justify-between border-b px-3.5 py-2 font-mono text-xs ${
            isActive
              ? "border-white/15 bg-black/55"
              : "border-white/10 bg-black/30 opacity-85"
          }`}
        >
          {/* Window Identity & Live Pixel Dimensions */}
          <div className="pointer-events-none flex min-w-0 items-center gap-2.5">
            <span
              className="inline-block h-2 w-2 shrink-0"
              style={{
                backgroundColor: isActive
                  ? "var(--eco-primary)"
                  : "rgba(255,255,255,0.25)",
              }}
            />
            <span className="font-mono text-[10px] opacity-45">
              [{win.code}]
            </span>
            <span className="truncate font-semibold uppercase tracking-wider">
              {win.title}
            </span>
            <span className="hidden opacity-30 sm:inline">|</span>
            <span
              ref={dimTextRef}
              className="hidden font-mono text-[11px] tabular-nums opacity-60 sm:inline"
            >
              {win.isMaximized
                ? "100% ЭКРАНА"
                : `${Math.round(win.width)}×${Math.round(win.height)} PX`}
            </span>
          </div>

          {/* Window Control Buttons (Snap Left, Snap Right, Reset, Maximize/Restore, Close) */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => snapWindow(win.id, "left")}
              title="Примагнитить к левой половине экрана (50%)"
              className="hidden cursor-pointer rounded-none border border-white/10 bg-white/[0.03] p-1 opacity-65 transition-colors hover:border-white/30 hover:bg-white/[0.1] hover:opacity-100 sm:inline-flex"
            >
              <PanelLeft className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => snapWindow(win.id, "right")}
              title="Примагнитить к правой половине экрана (50%)"
              className="hidden cursor-pointer rounded-none border border-white/10 bg-white/[0.03] p-1 opacity-65 transition-colors hover:border-white/30 hover:bg-white/[0.1] hover:opacity-100 sm:inline-flex"
            >
              <PanelRight className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => resetWindowPositionAndSize(win.id)}
              title="Сбросить размер и расположение по центру"
              className="cursor-pointer rounded-none border border-white/10 bg-white/[0.03] p-1 opacity-70 transition-colors hover:border-white/30 hover:bg-white/[0.1] hover:opacity-100"
            >
              <RotateCcw className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() =>
                updateWindow(win.id, { isMaximized: !win.isMaximized })
              }
              title={
                win.isMaximized
                  ? "Восстановить в окно"
                  : "Развернуть на весь экран (100%)"
              }
              className="cursor-pointer rounded-none border border-white/10 bg-white/[0.03] p-1 opacity-70 transition-colors hover:border-white/30 hover:bg-white/[0.1] hover:opacity-100"
            >
              {win.isMaximized ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </button>

            <button
              type="button"
              onClick={() => closeWindow(win.id)}
              title="Закрыть окно"
              aria-label="Закрыть окно"
              className="cursor-pointer rounded-none border border-white/10 bg-white/[0.03] p-1 opacity-70 transition-colors hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-rose-300 hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* WINDOW CONTENT AREA */}
        <div
          className={`relative z-10 flex h-full min-h-0 flex-1 flex-col overflow-hidden ${
            win.kind === "site" ? "p-0" : "p-4 sm:p-5"
          }`}
        >
          {children}
        </div>
      </section>
    </>
  );
}
