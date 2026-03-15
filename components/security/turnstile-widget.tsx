"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      ready?: (callback: () => void) => void;
    };
  }
}

type TurnstileWidgetProps = {
  action: string;
  onTokenChange: (token: string) => void;
  resetKey?: number;
};

export function TurnstileWidget({ action, onTokenChange, resetKey = 0 }: TurnstileWidgetProps) {
  const [isReady, setIsReady] = useState(false);
  const [renderError, setRenderError] = useState("");
  const elementId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !isReady || !window.turnstile || !containerRef.current) {
      return;
    }

    onTokenChange("");
    setRenderError("");

    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    const renderWidget = () => {
      try {
        widgetIdRef.current = window.turnstile?.render(containerRef.current as HTMLElement, {
          sitekey: siteKey,
          theme: "dark",
          action,
          callback: (token: string) => {
            setRenderError("");
            onTokenChange(token);
          },
          "expired-callback": () => onTokenChange(""),
          "error-callback": () => {
            onTokenChange("");
            setRenderError("Security verification could not load. Refresh and try again.");
          },
        }) ?? null;
      } catch {
        setRenderError("Security verification could not load. Refresh and try again.");
      }
    };

    if (typeof window.turnstile.ready === "function") {
      window.turnstile.ready(renderWidget);
    } else {
      renderWidget();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, isReady, onTokenChange, resetKey, siteKey]);

  if (!siteKey) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
        Security verification is not configured in this environment.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setIsReady(true)}
      />
      <div ref={containerRef} id={elementId} key={`${elementId}-${resetKey}`} className="min-h-[66px]" />
      {renderError ? <p className="text-sm text-destructive">{renderError}</p> : null}
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Protected by Turnstile.
      </p>
    </div>
  );
}
