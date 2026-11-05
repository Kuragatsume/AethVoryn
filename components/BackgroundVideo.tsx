"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  // Measure actual intrinsic video dimensions and sync page height to match the video
  const syncVideoDimensions = useCallback(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    const v = videoRef.current;
    let ar = aspectRatio;
    if (v && v.videoWidth > 0 && v.videoHeight > 0) {
      ar = v.videoWidth / v.videoHeight;
      if (Math.abs(ar - aspectRatio) > 0.001) {
        setAspectRatio(ar);
      }
    }

    if (backdropMode !== "video" || videoQuality.ultrawideScroll === false) {
      document.documentElement.style.setProperty("--bg-video-height", "100vh");
      return;
    }

    const clientW = document.documentElement.clientWidth || window.innerWidth;
    const naturalVideoHeight = Math.ceil(clientW / ar);
    document.documentElement.style.setProperty("--video-aspect-ratio", String(ar));
    document.documentElement.style.setProperty(
      "--bg-video-height",
      `max(100vh, ${naturalVideoHeight}px)`
    );
  }, [aspectRatio, backdropMode, videoQuality.ultrawideScroll]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || backdropMode !== "video") return;
    v.muted = true;
    v.defaultMuted = true;
    v.currentTime = 0;
    if (v.readyState >= 1 && v.videoWidth > 0 && v.videoHeight > 0) {
      setReady(true);
      syncVideoDimensions();
    }
    v.play().catch(() => {});
  }, [activeVideoSrc, replayToken, backdropMode, syncVideoDimensions]);

  useEffect(() => {
    syncVideoDimensions();
    window.addEventListener("resize", syncVideoDimensions, { passive: true });
    return () => window.removeEventListener("resize", syncVideoDimensions);
  }, [syncVideoDimensions]);

  const effectiveBgColor =
    backdropMode === "color" && solidBgColor
      ? solidBgColor
      : theme.background || "#05070a";

  const objectPosStyle =
    videoQuality.position === "top"
      ? "top center"
      : videoQuality.position === "bottom"
      ? "bottom center"
      : "center center";

  const effectiveFit = videoQuality.fit === "fill" ? "fill" : "cover";

  const hasCustomVideoFilter =
    Math.abs(videoQuality.brightness - 1.0) > 0.01 ||
    Math.abs(videoQuality.contrast - 1.0) > 0.01;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 min-h-full w-full overflow-hidden"
      style={{
        backgroundColor: effectiveBgColor,
        minHeight: "var(--bg-video-height, 100vh)",
      }}
    >
      {/* FULL-SCREEN ARCHITECTURAL GRID WHEN VIDEO IS OFF ("ether" OR "color")
          Uses fixed inset-0 + h-screen so the grid ALWAYS goes 100% to the very bottom edge of the screen */}
      {backdropMode !== "video" && (
        <div
          className="pointer-events-none fixed inset-0 h-screen w-screen"
          style={{
            backgroundColor: effectiveBgColor,
            backgroundImage:
              backdropMode === "ether"
                ? `
                  linear-gradient(to right, rgba(var(--eco-primary-rgb), 0.11) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(var(--eco-primary-rgb), 0.11) 1px, transparent 1px),
                  linear-gradient(to right, rgba(var(--eco-primary-rgb), 0.04) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(var(--eco-primary-rgb), 0.04) 1px, transparent 1px)
                `
                : `
                  linear-gradient(to right, rgba(var(--eco-primary-rgb), 0.06) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(var(--eco-primary-rgb), 0.06) 1px, transparent 1px)
                `,
            backgroundSize:
              backdropMode === "ether"
                ? "144px 144px, 144px 144px, 36px 36px, 36px 36px"
                : "40px 40px",
            backgroundPosition: "top left",
          }}
        />
      )}

      {/* 4K HARDWARE-ACCELERATED VIDEO SURFACE */}
      {backdropMode === "video" && (
        <video
          key={activeVideoSrc}
          ref={videoRef}
          className={`block h-full w-full object-cover transition-opacity duration-300 ${
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
          onLoadedMetadata={() => {
            setReady(true);
            syncVideoDimensions();
          }}
          onLoadedData={() => {
            setReady(true);
            syncVideoDimensions();
          }}
          onCanPlay={() => {
            setReady(true);
            syncVideoDimensions();
          }}
          style={{
            objectFit: effectiveFit,
            objectPosition: objectPosStyle,
            transform: "translate3d(0, 0, 0)",
            backfaceVisibility: "hidden",
            filter: hasCustomVideoFilter
              ? `brightness(${videoQuality.brightness}) contrast(${videoQuality.contrast})`
              : undefined,
          }}
        />
      )}

      {/* Only apply vignette on video when Clear Mode is disabled (never fade out the bottom of the grid) */}
      {backdropMode === "video" && !videoQuality.clearMode && theme.vignette > 0 && (
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: theme.vignette,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        />
      )}

      {/* EDGE FRAME MARGINS OVERLAY */}
      {frameMargins.enabled && (
        <div className="pointer-events-none fixed inset-0 z-10 select-none">
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
