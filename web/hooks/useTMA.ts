"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Global TMA detection: if running inside Telegram WebView,
// inherit native theme vars and route straight to the syndicate dashboard.
export function useTMA() {
  const [isTMA, setIsTMA] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const applyTheme = (tp: Record<string, string | undefined>) => {
      const root = document.documentElement;
      if (tp.bg_color) root.style.setProperty("--tg-theme-bg-color", tp.bg_color);
      if (tp.text_color) root.style.setProperty("--tg-theme-text-color", tp.text_color);
      if (tp.hint_color) root.style.setProperty("--tg-theme-hint-color", tp.hint_color);
    };

    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        document.documentElement.setAttribute("data-tma", "true");
        tg.ready?.();
        tg.expand?.();
        if (tg.themeParams) applyTheme(tg.themeParams);
        if (!cancelled) setIsTMA(true);
        const path = window.location.pathname;
        if (path === "/") {
          const last = localStorage.getItem("circla:lastSyndicate") || "demo";
          router.replace(`/syndicate/${last}`);
        }
      }
    } catch {
      // not in Telegram — desktop web path
    }

    import("@twa-dev/sdk")
      .then((mod: any) => {
        try {
          const WebApp = mod.default || mod;
          if (WebApp?.ready && !cancelled) {
            setIsTMA(true);
            document.documentElement.setAttribute("data-tma", "true");
          }
        } catch {
          // ignore
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    const t = setTimeout(() => !cancelled && setIsReady(true), 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [router]);

  return { isTMA, isReady };
}
