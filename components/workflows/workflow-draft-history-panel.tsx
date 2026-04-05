"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { WorkflowDraft } from "@/types";

type WorkflowDraftHistoryPanelProps = {
  drafts: WorkflowDraft[];
};

export function WorkflowDraftHistoryPanel({ drafts }: WorkflowDraftHistoryPanelProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patchStatus(draftId: string, status: "draft" | "archived") {
    setBusyId(draftId);
    setError(null);

    try {
      const response = await fetch(`/api/workflows/${draftId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Workflow draft status could not be updated.");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error while updating workflow draft status.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteDraft(draftId: string) {
    setBusyId(draftId);
    setError(null);

    try {
      const response = await fetch(`/api/workflows/${draftId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Workflow draft could not be deleted.");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error while deleting workflow draft.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {error ? (
        <div className="mt-4 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {drafts.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
          <p className="display-kicker">Workflow Drafts</p>
          <p className="title-md mt-3 text-foreground">No saved workflow drafts yet</p>
          <p className="body-sm mt-3">
            Start in Workflow Tool, save a draft, and continue later from this Creator Studio history.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {drafts.map((draft) => (
            <article key={draft.id} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="display-kicker">Workflow Draft / {draft.status}</p>
                  <h3 className="title-md mt-2 text-foreground">{draft.title}</h3>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Updated {new Date(draft.updatedAt).toLocaleDateString()}</p>
                  <p className="body-sm mt-3">{draft.concept || draft.creativeDirection || "Project seed ready for Start a Project."}</p>
                  {draft.assetCount > 0 ? (
                    <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {draft.assetCount} asset{draft.assetCount !== 1 ? "s" : ""} attached
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button asChild size="lg" variant="ghost" disabled={busyId === draft.id}>
                    <Link href={`/workflows?draft=${draft.id}`}>Continue Later</Link>
                  </Button>
                  {draft.status === "seeded" && draft.seededFilmId ? (
                    <Button asChild size="lg" disabled={busyId === draft.id}>
                      <Link href={`/upload?film=${draft.seededFilmId}`}>Open Seeded Project</Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" disabled={busyId === draft.id || draft.status === "archived"}>
                      <Link href={`/upload?workflowDraft=${draft.id}`}>Start a Project</Link>
                    </Button>
                  )}
                  {draft.status === "archived" ? (
                    <Button type="button" size="lg" variant="ghost" disabled={busyId === draft.id} onClick={() => patchStatus(draft.id, "draft")}>
                      Unarchive
                    </Button>
                  ) : (
                    <Button type="button" size="lg" variant="ghost" disabled={busyId === draft.id} onClick={() => patchStatus(draft.id, "archived")}>
                      Archive
                    </Button>
                  )}
                  <Button type="button" size="lg" variant="ghost" disabled={busyId === draft.id} onClick={() => deleteDraft(draft.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
