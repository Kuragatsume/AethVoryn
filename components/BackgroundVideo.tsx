"use client";

import { useEffect, useRef, useState } from "react";
import { useEcosystem } from "./ecosystem/EcosystemContext";

export default function BackgroundVideo() {
  const {
    activeVideoSrc,
    loopVideo,
    replayToken,
    theme,
    backdropMode,
    solidBgColor,
    frameMargins,
    videoQuality,
  } = useEcosystem();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || backdropMode !== "video") return;
    v.muted = true;
    v.defaultMuted = true;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [activeVideoSrc, replayToken, backdropMode]);

  const effectiveBgColor =
    backdropMode === "color" && solidBgColor
      ? solidBgColor
      : theme.background || "#05070a";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ backgroundColor: effectiveBgColor }}
    >
      {/* Subtle architectural grid when in color backdrop mode */}
      {backdropMode === "color" && (
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      )}

      {/* 4K ULTRA-CLEAR HIGH-DEFINITION VIDEO SURFACE */}
      {backdropMode === "video" && (
        <video
          key={activeVideoSrc}
          ref={videoRef}
          className={`h-full w-full transition-opacity duration-300 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          src={activeVideoSrc}
          autoPlay
          loop={loopVideo}
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          onLoadedData={() => setReady(true)}
          onCanPlay={() => setReady(true)}
          style={{
            objectFit: videoQuality.fit,
            imageRendering: "crisp-edges" as any,
            transform: "translate3d(0, 0, 0)",
            WebkitTransform: "translate3d(0, 0, 0)",
            backfaceVisibility: "hidden",
            filter:
              videoQuality.brightness !== 1.0 || videoQuality.contrast !== 1.0
                ? `brightness(${videoQuality.brightness}) contrast(${videoQuality.contrast})`
                : undefined,
          }}
        />
      )}

      {/* Only apply vignette if Clear Mode is disabled */}
      {!videoQuality.clearMode && theme.vignette > 0 && (
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: theme.vignette,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        />
      )}

      {/* EDGE FRAME MARGINS OVERLAY (LIES DIRECTLY ON TOP OF BACKGROUND WITHOUT SQUEEZING LAYOUT) */}
      {frameMargins.enabled && (
        <div className="pointer-events-none absolute inset-0 z-10 select-none">
          {/* Top Bar */}
          {frameMargins.top > 0 && (
            <div
              className="absolute inset-x-0 top-0"
              style={{
                height: `${frameMargins.top}px`,
                backgroundColor: frameMargins.color,
                borderBottom: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          )}
          {/* Bottom Bar */}
          {frameMargins.bottom > 0 && (
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: `${frameMargins.bottom}px`,
                backgroundColor: frameMargins.color,
                borderTop: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          )}
          {/* Left Bar */}
          {frameMargins.left > 0 && (
            <div
              className="absolute left-0"
              style={{
                width: `${frameMargins.left}px`,
                top: `${frameMargins.top}px`,
                bottom: `${frameMargins.bottom}px`,
                backgroundColor: frameMargins.color,
                borderRight: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          )}
          {/* Right Bar */}
          {frameMargins.right > 0 && (
            <div
              className="absolute right-0"
              style={{
                width: `${frameMargins.right}px`,
                top: `${frameMargins.top}px`,
                bottom: `${frameMargins.bottom}px`,
                backgroundColor: frameMargins.color,
                borderLeft: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
