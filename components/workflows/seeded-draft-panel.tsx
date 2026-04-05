"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Clapperboard, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FilmAssetBrowser } from "@/components/workflows/film-asset-browser";
import type { WorkflowDraft } from "@/types";

type SeededDraftPanelProps = {
  draft: WorkflowDraft;
};

export function SeededDraftPanel({ draft }: SeededDraftPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!draft.seededFilmId) return null;

  return (
    <article className="rounded-[24px] border border-white/12 bg-black/30 p-5">
      <div className="flex items-center gap-2">
        <Clapperboard className="h-4 w-4 text-muted-foreground" />
        <p className="display-kicker">Seeded Film Project</p>
      </div>

      <p className="body-sm mt-2">
        This workflow draft has been seeded into a film project. All attached assets have been
        linked to the project and organized by stage.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <Button asChild variant="ghost" className="w-full justify-start gap-2">
          <Link href={`/upload?film=${draft.seededFilmId}`}>
            <Clapperboard className="h-3.5 w-3.5" />
            Open Film Editor
          </Link>
        </Button>

        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-left text-xs text-muted-foreground transition hover:text-foreground"
        >
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">
            {draft.assetCount > 0
              ? `${draft.assetCount} asset${draft.assetCount !== 1 ? "s" : ""} linked to project`
              : "View linked assets"}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
        </button>
      </div>

      {isExpanded ? (
        <FilmAssetBrowser draftId={draft.id} filmId={draft.seededFilmId} />
      ) : null}
    </article>
  );
}
