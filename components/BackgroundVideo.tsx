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

  const containerStyle: React.CSSProperties = frameMargins.enabled
    ? {
        position: "fixed",
        top: `${frameMargins.top}px`,
        right: `${frameMargins.right}px`,
        bottom: `${frameMargins.bottom}px`,
        left: `${frameMargins.left}px`,
        backgroundColor: effectiveBgColor,
      }
    : {
        position: "fixed",
        inset: 0,
        backgroundColor: effectiveBgColor,
      };

  return (
    <div
      aria-hidden
      className="pointer-events-none -z-10 overflow-hidden transition-[top,right,bottom,left,background-color] duration-150"
      style={containerStyle}
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
    </div>
  );
}
