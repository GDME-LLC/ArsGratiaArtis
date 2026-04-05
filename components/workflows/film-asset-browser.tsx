"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Film, Loader2, Music, Video, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WORKFLOW_STAGES } from "@/lib/constants/process";
import type { WorkflowAsset } from "@/types";

type FilmAssetBrowserProps = {
  draftId: string;
  filmId: string;
};

const STAGE_ORDER = Object.fromEntries(WORKFLOW_STAGES.map((s, i) => [s, i]));

function getMimeIcon(mimeType: string | null) {
  if (!mimeType) return null;
  if (mimeType.startsWith("audio/")) return <Music className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />;
  if (mimeType.startsWith("video/")) return <Video className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />;
  return <Film className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />;
}

function groupByStage(assets: WorkflowAsset[]): Map<string, WorkflowAsset[]> {
  const map = new Map<string, WorkflowAsset[]>();
  const unstaged: WorkflowAsset[] = [];

  for (const asset of assets) {
    if (!asset.stage) {
      unstaged.push(asset);
      continue;
    }

    const group = map.get(asset.stage) ?? [];
    group.push(asset);
    map.set(asset.stage, group);
  }

  // Sort by WORKFLOW_STAGES order, then unknown stages alphabetically
  const sorted = new Map<string, WorkflowAsset[]>();
  const knownStages = [...map.keys()].sort(
    (a, b) => (STAGE_ORDER[a] ?? 99) - (STAGE_ORDER[b] ?? 99)
  );

  for (const stage of knownStages) {
    sorted.set(stage, map.get(stage)!);
  }

  if (unstaged.length > 0) {
    sorted.set("Untagged", unstaged);
  }

  return sorted;
}

export function FilmAssetBrowser({ draftId, filmId }: FilmAssetBrowserProps) {
  const [assets, setAssets] = useState<WorkflowAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetch(`/api/workflows/${draftId}?_sub=film-assets`, { cache: "no-store" });
        const payload = (await res.json()) as { assets?: WorkflowAsset[]; error?: string };

        if (!mounted) return;

        if (!res.ok || !payload.assets) {
          setError(payload.error ?? "Could not load film assets.");
          return;
        }

        setAssets(payload.assets);
      } catch {
        if (mounted) setError("Network error loading film assets.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [draftId, filmId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading linked assets...
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

  if (assets.length === 0) {
    return (
      <p className="py-4 text-xs text-muted-foreground">
        No assets have been carried to this film project yet.
      </p>
    );
  }

  const grouped = groupByStage(assets);

  return (
    <div className="mt-3 space-y-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {assets.length} asset{assets.length !== 1 ? "s" : ""} linked to film
      </p>

      {[...grouped.entries()].map(([stage, stageAssets]) => (
        <div key={stage}>
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">{stage}</p>
          <div className="space-y-1.5">
            {stageAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/20 px-3 py-2"
              >
                {getMimeIcon(asset.mimeType)}
                <p className="flex-1 min-w-0 truncate text-xs text-foreground/80">{asset.label}</p>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.10em] text-muted-foreground/50">
                  {asset.sourceType === "runway" ? "Runway" : asset.sourceType === "elevenlabs" ? "ElevenLabs" : asset.assetType}
                </span>
                {asset.url ? (
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground/50 hover:text-foreground transition"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
