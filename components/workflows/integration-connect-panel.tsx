"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Link2, Loader2, PlugZap, Unplug, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CreatorIntegration, IntegrationPlatform } from "@/types";

const PLATFORM_LABELS: Record<IntegrationPlatform, string> = {
  runway: "Runway",
  elevenlabs: "ElevenLabs",
};

const PLATFORM_DESCRIPTIONS: Record<IntegrationPlatform, string> = {
  runway: "Browse your Runway generated video outputs and import them directly into project drafts.",
  elevenlabs: "Browse your ElevenLabs voice generation history and import audio clips into project drafts.",
};

const PLATFORM_KEY_PLACEHOLDER: Record<IntegrationPlatform, string> = {
  runway: "rw_...",
  elevenlabs: "sk_...",
};

const PLATFORM_DOCS_URL: Record<IntegrationPlatform, string> = {
  runway: "https://app.runwayml.com/settings/api-keys",
  elevenlabs: "https://elevenlabs.io/app/settings/api-keys",
};

type IntegrationConnectPanelProps = {
  initialIntegrations?: CreatorIntegration[];
};

const ALL_PLATFORMS: IntegrationPlatform[] = ["runway", "elevenlabs"];

export function IntegrationConnectPanel({ initialIntegrations = [] }: IntegrationConnectPanelProps) {
  const [integrations, setIntegrations] = useState<CreatorIntegration[]>(initialIntegrations);
  const [connectingPlatform, setConnectingPlatform] = useState<IntegrationPlatform | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<IntegrationPlatform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/integrations", { cache: "no-store" });
        const payload = (await res.json()) as { integrations?: CreatorIntegration[]; error?: string };
        if (res.ok && payload.integrations) setIntegrations(payload.integrations);
      } catch {
        // non-critical; initialIntegrations used as fallback
      }
    })();
  }, []);

  function getIntegration(platform: IntegrationPlatform) {
    return integrations.find((i) => i.platform === platform) ?? null;
  }

  function openConnect(platform: IntegrationPlatform) {
    setConnectingPlatform(platform);
    setApiKeyInput("");
    setError(null);
    setSuccessMsg(null);
  }

  function cancelConnect() {
    setConnectingPlatform(null);
    setApiKeyInput("");
    setError(null);
  }

  const handleConnect = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!connectingPlatform) return;

      const trimmedKey = apiKeyInput.trim();
      if (!trimmedKey) {
        setError("API key is required.");
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        const res = await fetch("/api/integrations/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: connectingPlatform, api_key: trimmedKey }),
        });

        const payload = (await res.json()) as { integration?: CreatorIntegration; error?: string };

        if (!res.ok || !payload.integration) {
          setError(payload.error ?? "Could not connect account.");
          return;
        }

        setIntegrations((current) => {
          const filtered = current.filter((i) => i.platform !== connectingPlatform);
          return [...filtered, payload.integration as CreatorIntegration];
        });

        setConnectingPlatform(null);
        setApiKeyInput("");
        setSuccessMsg(`${PLATFORM_LABELS[connectingPlatform]} connected successfully.`);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsSaving(false);
      }
    },
    [connectingPlatform, apiKeyInput]
  );

  const handleDisconnect = useCallback(async (platform: IntegrationPlatform) => {
    setDisconnectingPlatform(platform);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/integrations/${platform}`, { method: "DELETE" });
      const payload = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !payload.ok) {
        setError(payload.error ?? "Could not disconnect account.");
        return;
      }

      setIntegrations((current) => current.filter((i) => i.platform !== platform));
      setSuccessMsg(`${PLATFORM_LABELS[platform]} disconnected.`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDisconnectingPlatform(null);
    }
  }, []);

  return (
    <article className="rounded-[24px] border border-white/12 bg-black/30 p-5">
      <div className="flex items-center gap-2">
        <PlugZap className="h-4 w-4 text-muted-foreground" />
        <p className="display-kicker">Platform Integrations</p>
      </div>

      <p className="body-sm mt-2">
        Connect your API keys to browse and import assets from Runway and ElevenLabs directly into project drafts.
        Keys are stored securely and never shown in full after saving.
      </p>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {successMsg ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/16 bg-black/30 px-3 py-2.5 text-xs text-foreground/88">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground/60" />
          <span className="flex-1">{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {ALL_PLATFORMS.map((platform) => {
          const connected = getIntegration(platform);
          const isConnecting = connectingPlatform === platform;
          const isDisconnecting = disconnectingPlatform === platform;

          return (
            <div key={platform} className="rounded-xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{PLATFORM_LABELS[platform]}</p>
                    {connected ? (
                      <span className="flex items-center gap-1 rounded-full border border-white/16 bg-white/8 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground/70">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Connected
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{PLATFORM_DESCRIPTIONS[platform]}</p>
                  {connected ? (
                    <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/60">{connected.maskedApiKey}</p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {connected ? (
                    <button
                      type="button"
                      disabled={isDisconnecting}
                      onClick={() => handleDisconnect(platform)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:border-destructive/40 hover:text-destructive disabled:opacity-40"
                    >
                      {isDisconnecting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Unplug className="h-3 w-3" />
                      )}
                      {isDisconnecting ? "Removing..." : "Disconnect"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openConnect(platform)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:border-white/24 hover:text-foreground"
                    >
                      <Link2 className="h-3 w-3" />
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {isConnecting ? (
                <form onSubmit={handleConnect} className="mt-4 grid gap-2.5">
                  <label className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">API Key</span>
                      <a
                        href={PLATFORM_DOCS_URL[platform]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 hover:text-muted-foreground transition"
                      >
                        Get key ↗
                      </a>
                    </div>
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={PLATFORM_KEY_PLACEHOLDER[platform]}
                      autoComplete="off"
                      className="h-9 rounded-xl border border-white/12 bg-black/30 px-3 font-mono text-xs text-foreground outline-none transition focus:border-white/34"
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <Button type="submit" size="sm" variant="ghost" disabled={isSaving} className="flex-1">
                      {isSaving ? "Validating & Saving..." : `Connect ${PLATFORM_LABELS[platform]}`}
                    </Button>
                    <button
                      type="button"
                      onClick={cancelConnect}
                      className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      Cancel
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground/60">
                    Your API key is validated before saving and stored securely. It will never be shown in full again.
                  </p>
                </form>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}
