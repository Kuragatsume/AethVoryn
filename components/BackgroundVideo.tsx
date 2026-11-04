"use client";

import { useEffect, useRef, useState } from "react";
import { useEcosystem } from "./ecosystem/EcosystemContext";

export default function BackgroundVideo() {
  const { activeVideoSrc, loopVideo, replayToken, theme, backdropMode } =
    useEcosystem();
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

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: "var(--eco-bg, #05070a)" }}
    >
      {/* Subtle architectural grid when in color backdrop mode */}
      {backdropMode === "color" && (
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      )}

      {backdropMode === "video" && (
        <video
          key={activeVideoSrc}
          ref={videoRef}
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          src={activeVideoSrc}
          autoPlay
          loop={loopVideo}
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setReady(true)}
          onCanPlay={() => setReady(true)}
        />
      )}

      {/* Clean linear & radial vignette */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: theme.vignette,
          background:
            "linear-gradient(to bottom, rgba(var(--eco-bg-rgb, 5,7,10), 0.65) 0%, rgba(var(--eco-bg-rgb, 5,7,10), 0.2) 45%, rgba(var(--eco-bg-rgb, 5,7,10), 0.88) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 48%, rgba(var(--eco-bg-rgb, 5,7,10), 0.72) 100%)",
        }}
      />
    </div>
  );
}
