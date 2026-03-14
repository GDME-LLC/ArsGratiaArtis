"use client";

import Script from "next/script";
import { useEffect, useId, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
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
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const elementId = useId().replace(/:/g, "");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !isReady || !window.turnstile) {
      return;
    }

    const nextWidgetId = window.turnstile.render(`#${elementId}`, {
      sitekey: siteKey,
      theme: "dark",
      action,
      callback: (token: string) => onTokenChange(token),
      "expired-callback": () => onTokenChange(""),
      "error-callback": () => onTokenChange(""),
    });

    setWidgetId(nextWidgetId);

    return () => {
      if (nextWidgetId && window.turnstile) {
        window.turnstile.remove(nextWidgetId);
      }
    };
  }, [action, elementId, isReady, onTokenChange, resetKey, siteKey]);

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
      <div id={elementId} key={`${elementId}-${resetKey}-${widgetId ?? "empty"}`} />
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Protected by Turnstile.
      </p>
    </div>
  );
}
