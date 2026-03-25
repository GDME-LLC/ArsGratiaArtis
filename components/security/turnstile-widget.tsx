"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  action: string;
  onTokenChange: (token: string) => void;
  resetKey?: number;
};

function formatTurnstileError(code?: string | null) {
  const suffix = code ? ` (code: ${code})` : "";
  return `Security verification could not load${suffix}. Refresh and try again.`;
}

export function TurnstileWidget({ action, onTokenChange, resetKey = 0 }: TurnstileWidgetProps) {
  const [isReady, setIsReady] = useState(false);
  const [renderError, setRenderError] = useState("");
  const elementId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (window.turnstile) {
      setIsReady(true);
    }
  }, []);

  const removeWidget = () => {
    if (!widgetIdRef.current || !window.turnstile?.remove) {
      widgetIdRef.current = null;
      return;
    }

    try {
      window.turnstile.remove(widgetIdRef.current);
    } catch (error) {
      console.error("Turnstile remove failed", {
        action,
        error,
      });
    } finally {
      widgetIdRef.current = null;
    }
  };

  useEffect(() => {
    if (!siteKey || !isReady || !window.turnstile || !containerRef.current) {
      return;
    }

    onTokenChange("");
    setRenderError("");
    removeWidget();

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        size: 'flexible',
        theme: "dark",
        action,
        callback: (token: string) => {
          setRenderError("");
          onTokenChange(token);
        },
        "expired-callback": () => onTokenChange(""),
        "error-callback": (code?: string) => {
          console.error("Turnstile widget error", {
            action,
            code: code ?? null,
          });
          onTokenChange("");
          setRenderError(formatTurnstileError(code));
        },
      });
    } catch (error) {
      console.error("Turnstile render failed", {
        action,
        error,
      });
      setRenderError(formatTurnstileError());
    }

    return () => {
      removeWidget();
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
    <div className="max-w-full space-y-3 overflow-hidden">
      <Script
        id="cf-turnstile-script"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => {
          if (!window.turnstile) {
            console.error("Turnstile script loaded without global API", {
              action,
            });
            setRenderError(formatTurnstileError());
            return;
          }

          setIsReady(true);
        }}
        onError={() => {
          console.error("Turnstile script failed to load", {
            action,
          });
          setRenderError(formatTurnstileError());
        }}
      />
      <div ref={containerRef} id={elementId} key={`${elementId}-${resetKey}`} className="min-h-[66px] w-full max-w-full" />
      {renderError ? <p className="text-sm text-destructive">{renderError}</p> : null}
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Protected by Turnstile.
      </p>
    </div>
  );
}
