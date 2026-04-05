"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Music, Video, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { IntegrationPlatform, WorkflowAsset } from "@/types";

type ElevenLabsHistoryItem = {
  history_item_id: string;
  voice_name: string;
  text: string;
  date_unix: number;
  content_type: string;
  state: string;
};

type RunwayTask = {
  id: string;
  name: string | null;
  status: string;
  createdAt: string;
  output: string[] | null;
  outputMimeType: string | null;
};

type WorkflowImportPickerProps = {
  draftId: string;
  platform: IntegrationPlatform;
  onImported: (asset: WorkflowAsset) => void;
};

function formatUnixDate(unixSec: number) {
  return new Date(unixSec * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WorkflowImportPicker({ draftId, platform, onImported }: WorkflowImportPickerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [elItems, setElItems] = useState<ElevenLabsHistoryItem[]>([]);
  const [rwTasks, setRwTasks] = useState<RunwayTask[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    const endpoint =
      platform === "elevenlabs"
        ? "/api/integrations/elevenlabs/assets"
        : "/api/integrations/runway/assets";

    void (async () => {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        const payload = (await res.json()) as {
          items?: ElevenLabsHistoryItem[];
          tasks?: RunwayTask[];
          error?: string;
        };

        if (!mounted) return;

        if (!res.ok) {
          setError(payload.error ?? "Could not load assets.");
          return;
        }

        if (platform === "elevenlabs") {
          setElItems(payload.items ?? []);
        } else {
          setRwTasks(payload.tasks ?? []);
        }
      } catch {
        if (mounted) setError("Network error loading platform assets.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [platform]);

  const importElevenLabsItem = useCallback(
    async (item: ElevenLabsHistoryItem) => {
      setImportingId(item.history_item_id);
      setError(null);

      const audioUrl = `https://api.elevenlabs.io/v1/history/${item.history_item_id}/audio`;
      const label = item.voice_name
        ? `${item.voice_name}: ${item.text.slice(0, 40)}${item.text.length > 40 ? "…" : ""}`
        : item.text.slice(0, 60);

      try {
        const res = await fetch("/api/integrations/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draft_id: draftId,
            platform: "elevenlabs",
            external_asset_id: item.history_item_id,
            label,
            url: audioUrl,
            mime_type: "audio/mpeg",
            source_metadata: {
              voice_name: item.voice_name,
              text: item.text,
              date_unix: item.date_unix,
              content_type: item.content_type,
              state: item.state,
            },
          }),
        });

        const payload = (await res.json()) as { asset?: WorkflowAsset; error?: string };

        if (!res.ok || !payload.asset) {
          setError(payload.error ?? "Asset could not be imported.");
          return;
        }

        setImportedIds((prev) => new Set(prev).add(item.history_item_id));
        onImported(payload.asset);
      } catch {
        setError("Network error while importing.");
      } finally {
        setImportingId(null);
      }
    },
    [draftId, onImported]
  );

  const importRunwayTask = useCallback(
    async (task: RunwayTask) => {
      const outputUrl = task.output?.[0];
      if (!outputUrl) {
        setError("This task has no output URL.");
        return;
      }

      setImportingId(task.id);
      setError(null);

      const label = task.name ?? `Runway output (${formatDate(task.createdAt)})`;

      try {
        const res = await fetch("/api/integrations/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draft_id: draftId,
            platform: "runway",
            external_asset_id: task.id,
            label,
            url: outputUrl,
            mime_type: task.outputMimeType ?? "video/mp4",
            source_metadata: {
              name: task.name,
              status: task.status,
              createdAt: task.createdAt,
              outputMimeType: task.outputMimeType,
              output: task.output,
            },
          }),
        });

        const payload = (await res.json()) as { asset?: WorkflowAsset; error?: string };

        if (!res.ok || !payload.asset) {
          setError(payload.error ?? "Asset could not be imported.");
          return;
        }

        setImportedIds((prev) => new Set(prev).add(task.id));
        onImported(payload.asset);
      } catch {
        setError("Network error while importing.");
      } finally {
        setImportingId(null);
      }
    },
    [draftId, onImported]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading {platform === "elevenlabs" ? "ElevenLabs" : "Runway"} assets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-2 flex items-start gap-2 rounded-xl border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
        <span className="flex-1">{error}</span>
        <button type="button" onClick={() => setError(null)}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (platform === "elevenlabs") {
    if (!elItems.length) {
      return (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No ElevenLabs voice history found. Generate audio in ElevenLabs and it will appear here.
        </p>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{elItems.length} voice generation{elItems.length !== 1 ? "s" : ""}</p>
        {elItems.map((item) => {
          const alreadyImported = importedIds.has(item.history_item_id);
          const isImporting = importingId === item.history_item_id;

          return (
            <div key={item.history_item_id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/25 p-3">
              <Music className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground/90">
                  {item.voice_name || "Unknown voice"}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{item.text}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/50">{formatUnixDate(item.date_unix)}</p>
              </div>
              <button
                type="button"
                disabled={isImporting || alreadyImported}
                onClick={() => importElevenLabsItem(item)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:border-white/24 hover:text-foreground disabled:opacity-40"
              >
                {isImporting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                {alreadyImported ? "Imported" : isImporting ? "Importing..." : "Import"}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  // Runway
  if (!rwTasks.length) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        No completed Runway tasks found. Generate video in Runway and it will appear here.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{rwTasks.length} completed output{rwTasks.length !== 1 ? "s" : ""}</p>
      {rwTasks.map((task) => {
        const alreadyImported = importedIds.has(task.id);
        const isImporting = importingId === task.id;

        return (
          <div key={task.id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/25 p-3">
            <Video className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground/90 truncate">
                {task.name ?? "Runway Output"}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/50">{formatDate(task.createdAt)}</p>
            </div>
            <button
              type="button"
              disabled={isImporting || alreadyImported}
              onClick={() => importRunwayTask(task)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition hover:border-white/24 hover:text-foreground disabled:opacity-40"
            >
              {isImporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              {alreadyImported ? "Imported" : isImporting ? "Importing..." : "Import"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
