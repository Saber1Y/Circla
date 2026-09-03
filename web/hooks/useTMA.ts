"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Global TMA detection: only a real Telegram WebView carries launch data.
// The @twa-dev/sdk module object always exposes `ready`, so module presence
// alone is NOT a signal — window.Telegram.WebApp.initData must be non-empty.
function isRealTMA(tg: any): boolean {
  if (!tg) return false;
  if (typeof tg.initData === "string" && tg.initData.length > 0) return true;
  if (
    typeof tg.platform === "string" &&
    tg.platform !== "unknown" &&
    typeof tg.initDataUnsafe?.user !== "undefined"
  )
    return true;
  return false;
}

export function useTMA() {
  const [isTMA, setIsTMA] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (isRealTMA(tg)) {
        document.documentElement.setAttribute("data-tma", "true");
        tg.ready?.();
        tg.expand?.();
        const tp = tg.themeParams || {};
        const root = document.documentElement;
        if (tp.bg_color) root.style.setProperty("--tg-theme-bg-color", tp.bg_color);
        if (tp.text_color) root.style.setProperty("--tg-theme-text-color", tp.text_color);
        if (tp.hint_color) root.style.setProperty("--tg-theme-hint-color", tp.hint_color);
        if (!cancelled) setIsTMA(true);
        if (window.location.pathname === "/") {
          const last = localStorage.getItem("circla:lastSyndicate") || "demo";
          router.replace(`/syndicate/${last}`);
        }
      }
    } catch {
      // desktop web path
    } finally {
      if (!cancelled) setIsReady(true);
    }
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { isTMA, isReady };
}
