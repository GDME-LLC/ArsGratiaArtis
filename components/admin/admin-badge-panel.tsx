"use client";

import { useState } from "react";

import { AdminBadgeForm } from "@/components/admin/admin-badge-form";
import { AdminCreatorBadgeManager } from "@/components/admin/admin-creator-badge-manager";
import type { AdminBadgeOverview, AdminBadgeRecord } from "@/types";

export function AdminBadgePanel({ overview }: { overview: AdminBadgeOverview }) {
  const [selectedBadge, setSelectedBadge] = useState<AdminBadgeRecord | null>(overview.badges[0] ?? null);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="grid gap-5">
        <AdminBadgeForm badge={null} onSaved={() => window.location.reload()} />

        <section className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div>
            <p className="display-kicker">Badge Library</p>
            <h2 className="headline-lg mt-3 text-foreground">All badge definitions</h2>
            <p className="body-sm mt-3 max-w-2xl">
              Create new distinctions, refine existing ones, and protect system badges like Founding Creator from accidental deletion.
            </p>
          </div>

          {overview.badges.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-muted-foreground">
              No badges created yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {overview.badges.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setSelectedBadge(badge)}
                  className={`rounded-[22px] border p-4 text-left transition ${selectedBadge?.id === badge.id ? "border-primary/40 bg-primary/10" : "border-white/10 bg-black/20 hover:bg-white/[0.05]"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="title-md text-foreground">{badge.name}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{badge.description || "No description yet."}</p>
                    </div>
                    <div className="text-right text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <p>{badge.assignedCount} assigned</p>
                      {badge.isSystem ? <p className="mt-2 text-primary/80">System</p> : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedBadge ? <AdminBadgeForm badge={selectedBadge} onSaved={() => window.location.reload()} /> : null}
      </div>

      <AdminCreatorBadgeManager creators={overview.creators} badges={overview.badges} onSaved={() => window.location.reload()} />
    </div>
  );
}
