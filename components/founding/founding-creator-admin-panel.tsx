"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FoundingCreatorBadge } from "@/components/founding/founding-creator-badge";
import { Button } from "@/components/ui/button";
import type { AdminFoundingCreatorOverview, AdminFoundingCreatorRow } from "@/types";

type FoundingCreatorAdminPanelProps = {
  overview: AdminFoundingCreatorOverview;
};

type SaveState = {
  pendingId?: string;
  error?: string;
  success?: string;
};

function FounderEditor({
  creator,
  nextAvailableFounderNumber,
  onSave,
  pending,
}: {
  creator: AdminFoundingCreatorRow;
  nextAvailableFounderNumber: number | null;
  onSave: (payload: {
    profileId: string;
    isFoundingCreator: boolean;
    founderNumber: number | null;
    featured: boolean;
    notes: string | null;
    markInvited: boolean;
    markAccepted: boolean;
  }) => Promise<void>;
  pending: boolean;
}) {
  const [isFoundingCreator, setIsFoundingCreator] = useState(creator.foundingCreator.isFoundingCreator);
  const [founderNumber, setFounderNumber] = useState(
    creator.foundingCreator.founderNumber?.toString() ?? nextAvailableFounderNumber?.toString() ?? "",
  );
  const [featured, setFeatured] = useState(creator.foundingCreator.featured);
  const [notes, setNotes] = useState(creator.foundingCreator.notes ?? "");
  const [markInvited, setMarkInvited] = useState(Boolean(creator.foundingCreator.invitedAt));
  const [markAccepted, setMarkAccepted] = useState(Boolean(creator.foundingCreator.acceptedAt));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSave({
      profileId: creator.id,
      isFoundingCreator,
      founderNumber: isFoundingCreator ? Number(founderNumber) : null,
      featured,
      notes: notes.trim() || null,
      markInvited,
      markAccepted,
    });
  }

  return (
    <form className="mt-5 grid gap-4 rounded-[22px] border border-white/10 bg-black/20 p-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Founding status</span>
          <input
            type="checkbox"
            checked={isFoundingCreator}
            onChange={(event) => setIsFoundingCreator(event.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
          />
        </label>

        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Founder number</span>
          <input
            type="number"
            min={1}
            max={20}
            value={founderNumber}
            onChange={(event) => setFounderNumber(event.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground"
            disabled={!isFoundingCreator}
          />
        </label>

        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Homepage featured</span>
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
            disabled={!isFoundingCreator}
          />
        </label>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Suggestion</span>
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-foreground">
            {nextAvailableFounderNumber ? `Next available: #${nextAvailableFounderNumber}` : "All 20 slots are filled"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Invited</span>
          <input
            type="checkbox"
            checked={markInvited}
            onChange={(event) => setMarkInvited(event.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
          />
        </label>

        <label className="grid gap-2 text-sm text-muted-foreground">
          <span className="display-kicker text-[0.65rem]">Accepted</span>
          <input
            type="checkbox"
            checked={markAccepted}
            onChange={(event) => setMarkAccepted(event.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-muted-foreground">
        <span className="display-kicker text-[0.65rem]">Admin notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground"
          placeholder="Why this creator belongs in the founding roster, outreach notes, or status details"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {creator.foundingCreator.isFoundingCreator ? (
            <FoundingCreatorBadge founder={creator.foundingCreator} showNumber />
          ) : null}
          {creator.foundingCreator.invitedAt ? (
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Invited
            </span>
          ) : null}
          {creator.foundingCreator.acceptedAt ? (
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Accepted
            </span>
          ) : null}
        </div>

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving..." : "Save Founder Status"}
        </Button>
      </div>
    </form>
  );
}

export function FoundingCreatorAdminPanel({ overview }: FoundingCreatorAdminPanelProps) {
  const router = useRouter();
  const [saveState, setSaveState] = useState<SaveState>({});

  const sections = useMemo(
    () => [
      {
        key: "founders",
        title: "Active Founding Creators",
        description: "The permanent roster. These creators already hold one of the first 20 slots.",
        items: overview.founders,
      },
      {
        key: "invited",
        title: "Invited / Pending",
        description: "Creators marked for the founding tier who have not been fully activated yet.",
        items: overview.invited,
      },
      {
        key: "eligible",
        title: "Eligible Creators",
        description: "Approved creator accounts that can be elevated into the founding roster.",
        items: overview.eligibleCreators,
      },
    ],
    [overview],
  );

  async function handleSave(payload: {
    profileId: string;
    isFoundingCreator: boolean;
    founderNumber: number | null;
    featured: boolean;
    notes: string | null;
    markInvited: boolean;
    markAccepted: boolean;
  }) {
    setSaveState({ pendingId: payload.profileId });

    try {
      const response = await fetch("/api/admin/founding-creators", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSaveState({ error: body.error ?? "Founding creator status could not be saved." });
        return;
      }

      setSaveState({ success: "Founding creator status updated." });
      router.refresh();
    } catch {
      setSaveState({ error: "Network error. Try again." });
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="surface-panel p-5">
          <p className="display-kicker">Founders</p>
          <p className="title-md mt-3 text-foreground">{overview.founderCount} / 20</p>
          <p className="body-sm mt-3">Current permanent founders on the roster.</p>
        </article>
        <article className="surface-panel p-5">
          <p className="display-kicker">Remaining Slots</p>
          <p className="title-md mt-3 text-foreground">{overview.remainingSlots}</p>
          <p className="body-sm mt-3">Open places left in the first 20.</p>
        </article>
        <article className="surface-panel p-5">
          <p className="display-kicker">Next Number</p>
          <p className="title-md mt-3 text-foreground">
            {overview.nextAvailableFounderNumber ? `#${overview.nextAvailableFounderNumber}` : "Full"}
          </p>
          <p className="body-sm mt-3">Suggested next founder number for manual assignment.</p>
        </article>
      </div>

      {saveState.error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveState.error}
        </div>
      ) : null}

      {saveState.success ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {saveState.success}
        </div>
      ) : null}

      {sections.map((section) => (
        <section key={section.key} className="surface-panel cinema-frame p-6">
          <p className="display-kicker">{section.title}</p>
          <p className="body-sm mt-3 max-w-3xl">{section.description}</p>

          {section.items.length === 0 ? (
            <p className="body-sm mt-5 text-muted-foreground">Nothing to review here right now.</p>
          ) : (
            <div className="mt-6 grid gap-5">
              {section.items.map((creator) => (
                <article key={creator.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="display-kicker">@{creator.handle}</p>
                      <h3 className="title-md mt-3 text-foreground">{creator.displayName}</h3>
                      <p className="body-sm mt-3">
                        {creator.bio || "No public bio yet. This creator can still be invited or assigned manually."}
                      </p>
                    </div>

                    <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3 lg:min-w-[360px]">
                      <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                        <p className="display-kicker">Followers</p>
                        <p className="mt-2 text-foreground">{creator.followerCount}</p>
                      </div>
                      <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                        <p className="display-kicker">Public Releases</p>
                        <p className="mt-2 text-foreground">{creator.publicFilmCount}</p>
                      </div>
                      <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                        <p className="display-kicker">Public Profile</p>
                        <p className="mt-2 text-foreground">{creator.isPublic ? "Live" : "Private"}</p>
                      </div>
                    </div>
                  </div>

                  <FounderEditor
                    creator={creator}
                    nextAvailableFounderNumber={overview.nextAvailableFounderNumber}
                    onSave={handleSave}
                    pending={saveState.pendingId === creator.id}
                  />
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
