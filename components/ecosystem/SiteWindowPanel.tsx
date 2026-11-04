"use client";

import {
  ExternalLink,
  Globe,
  RefreshCw,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  normalizeWebsiteUrl,
  useEcosystem,
  type DesktopWindowState,
} from "./EcosystemContext";

type Props = {
  win: DesktopWindowState;
};

export default function SiteWindowPanel({ win }: Props) {
  const { updateWindow, isAnyWindowDragging } = useEcosystem();
  const [addressInput, setAddressInput] = useState(win.url || "");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentUrl = win.url || "https://example.com";
  const useProxy = Boolean(win.useProxy);

  const iframeSrc = useProxy
    ? `/api/proxy?url=${encodeURIComponent(currentUrl)}`
    : currentUrl;

  const handleNavigate = (e: FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;
    const nextUrl = normalizeWebsiteUrl(addressInput);
    setAddressInput(nextUrl);
    setLoading(true);
    updateWindow(win.id, { url: nextUrl });
  };

  const handleReload = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const toggleProxy = () => {
    setLoading(true);
    updateWindow(win.id, { useProxy: !useProxy });
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-black/50">
      {/* Compact Browser HUD Toolbar */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-white/10 bg-black/60 px-2.5 py-1.5 font-mono text-xs">
        <button
          type="button"
          onClick={handleReload}
          title="Перезагрузить страницу"
          className="rounded-none border border-white/10 bg-white/[0.04] p-1.5 opacity-75 transition-colors hover:border-white/30 hover:bg-white/[0.1] hover:opacity-100"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>

        {/* Address Bar */}
        <form onSubmit={handleNavigate} className="flex min-w-0 flex-1 items-center">
          <div className="flex w-full items-center gap-1.5 border border-white/10 bg-black/60 px-2.5 py-1 focus-within:border-white/30">
            <Globe
              className="h-3 w-3 shrink-0 opacity-60"
              style={{ color: "var(--eco-primary)" }}
            />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="https://..."
              aria-label="Адрес сайта"
              className="w-full min-w-0 bg-transparent font-mono text-[11px] text-white/90 focus:outline-none"
            />
          </div>
        </form>

        {/* Direct vs Proxy Mode Switch (bypasses X-Frame-Options when needed) */}
        <button
          type="button"
          onClick={toggleProxy}
          title={
            useProxy
              ? "Прокси-режим включен (обход блокировки фреймов). Нажмите для прямого режима."
              : "Если сайт не открывается во фрейме (Refused to connect), включите ПРОКСИ"
          }
          className={`inline-flex shrink-0 items-center gap-1 rounded-none border px-2 py-1 font-mono text-[10px] uppercase transition-colors ${
            useProxy
              ? "border-emerald-500/60 bg-emerald-500/15 font-semibold text-emerald-300"
              : "border-white/10 bg-white/[0.04] opacity-70 hover:border-white/25 hover:opacity-100"
          }`}
        >
          {useProxy ? (
            <>
              <Shield className="h-3 w-3" /> Прокси ВКЛ
            </>
          ) : (
            <>
              <ShieldAlert className="h-3 w-3" /> Прямой
            </>
          )}
        </button>

        {/* Open in external browser tab */}
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Открыть сайт в новой вкладке браузера"
          className="inline-flex shrink-0 items-center gap-1 rounded-none border border-white/10 bg-white/[0.04] p-1.5 opacity-75 transition-colors hover:border-white/30 hover:bg-white/[0.1] hover:opacity-100"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Main Website Iframe Viewport */}
      <div className="relative flex-1 overflow-hidden bg-white/[0.02]">
        {/* Transparent pointer shield during window drag/resize so iframe never swallows cursor events */}
        {isAnyWindowDragging && (
          <div className="absolute inset-0 z-30 cursor-grabbing bg-transparent" />
        )}

        <iframe
          key={`${win.id}-${reloadKey}-${useProxy ? "proxy" : "direct"}`}
          src={iframeSrc}
          title={win.title}
          onLoad={() => setLoading(false)}
          className="h-full w-full border-0 bg-white"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
