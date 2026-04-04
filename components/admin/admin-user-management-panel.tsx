"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatReleaseDate } from "@/lib/utils";
import type { AdminManagedUserRow, AdminUserManagementOverview } from "@/types";

type AdminUserManagementPanelProps = {
  overview: AdminUserManagementOverview;
};

function getUserTypeLabel(user: AdminManagedUserRow) {
  if (user.isAdmin) {
    return "Admin account";
  }

  return user.isCreator ? "Creator account" : "User account";
}

export function AdminUserManagementPanel({ overview }: AdminUserManagementPanelProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectableUsers = useMemo(() => overview.users.filter((user) => !user.isAdmin), [overview.users]);
  const selectableIds = useMemo(() => selectableUsers.map((user) => user.id), [selectableUsers]);
  const selectedCount = selectedIds.length;
  const allSelectableSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  function toggleUser(userId: string) {
    setSelectedIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  }

  function toggleAll() {
    setSelectedIds(allSelectableSelected ? [] : selectableIds);
  }

  async function handleRemoveSelected() {
    if (selectedIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Remove (${selectedIds.length}) User(s)? This permanently deletes the selected auth accounts, profiles, seeded creator pages, and their related films.`,
    );

    if (!confirmed) {
      return;
    }

    setIsRemoving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: selectedIds }),
      });

      const body = (await response.json()) as { error?: string; deletedCount?: number };

      if (!response.ok) {
        setError(body.error ?? "User removal failed.");
        return;
      }

      setSelectedIds([]);
      setSuccess(`Removed ${body.deletedCount ?? selectedIds.length} user${selectedIds.length === 1 ? "" : "s"}.`);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="display-kicker">User Management</p>
            <h2 className="headline-lg mt-3">Accounts</h2>
            <p className="body-sm mt-3 max-w-2xl">
              Select multiple non-admin users and remove them in one action. Seeded users are included, and deletion cascades through their profile records and related releases.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={allSelectableSelected}
                onChange={toggleAll}
                className="h-4 w-4 accent-[hsl(var(--primary))]"
              />
              Select all removable users
            </label>
            <Button
              type="button"
              size="lg"
              disabled={selectedCount === 0 || isRemoving}
              onClick={() => {
                void handleRemoveSelected();
              }}
              className="bg-[hsl(var(--destructive))] text-white hover:bg-[hsl(var(--destructive))]/90"
            >
              {isRemoving ? "Removing..." : `Remove (${selectedCount}) User(s)`}
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {success}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="display-kicker">Total Users</p>
          <p className="title-md mt-3 text-foreground">{overview.users.length}</p>
          <p className="body-sm mt-3">Profiles currently available for admin review.</p>
        </article>
        <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="display-kicker">Creators</p>
          <p className="title-md mt-3 text-foreground">{overview.users.filter((user) => user.isCreator).length}</p>
          <p className="body-sm mt-3">Accounts with public creator presence enabled.</p>
        </article>
        <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <p className="display-kicker">Selected</p>
          <p className="title-md mt-3 text-foreground">{selectedCount}</p>
          <p className="body-sm mt-3">Users currently queued for removal.</p>
        </article>
      </div>

      {overview.users.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6">
          <p className="display-kicker">No Users</p>
          <p className="title-md mt-3 text-foreground">No user records found</p>
          <p className="body-sm mt-3">Once people create accounts, they will appear here for review and bulk management.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {overview.users.map((user) => {
            const selected = selectedIds.includes(user.id);
            const removable = !user.isAdmin;

            return (
              <article key={user.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <label className="mt-1 inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!removable || isRemoving}
                        onChange={() => toggleUser(user.id)}
                        className="h-4 w-4 accent-[hsl(var(--primary))] disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </label>

                    <div className="max-w-3xl">
                      <p className="display-kicker">{getUserTypeLabel(user)}</p>
                      <h3 className="title-md mt-3 text-foreground">{user.displayName || user.handle || "Unknown user"}</h3>
                      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">@{user.handle || "unknown"}</p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Email: <span className="text-foreground">{user.email ?? "No email available"}</span>
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Visibility: <span className="text-foreground">{user.isPublic ? "public" : "private"}</span>
                        {" | "}
                        Public films: <span className="text-foreground">{user.publicFilmCount}</span>
                        {" | "}
                        Joined {formatReleaseDate(user.createdAt) ?? "recently"}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Last sign-in {formatReleaseDate(user.lastSignInAt ?? user.createdAt) ?? "recently"}
                      </p>
                      {!removable ? (
                        <p className="mt-3 inline-flex rounded-full border border-white/18 bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.18em] text-foreground/88">
                          Protected admin account
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
