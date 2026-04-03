"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";

import { HorizontalRail } from "@/components/shared/horizontal-rail";
import { formatFollowerCount } from "@/lib/utils";
import type { PublicCreatorListItem } from "@/types";

type FilmmakersBrowseProps = {
  creators: PublicCreatorListItem[];
};

type SortMode = "featured" | "followers" | "recent" | "name";

export function FilmmakersBrowse({ creators }: FilmmakersBrowseProps) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("featured");

  const filteredCreators = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let results = creators.filter((creator) => {
      if (!normalizedQuery) {
        return true;
      }

      return [creator.displayName, creator.handle, creator.bio ?? ""].join(" ").toLowerCase().includes(normalizedQuery);
    });

    switch (sortMode) {
      case "followers":
        results = [...results].sort((a, b) => b.followerCount - a.followerCount);
        break;
      case "recent":
        results = [...results].sort((a, b) => (b.latestPublishedAt ?? "").localeCompare(a.latestPublishedAt ?? ""));
        break;
      case "name":
        results = [...results].sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
      default:
        results = [...results].sort((a, b) => {
          if (a.foundingCreator.isFoundingCreator !== b.foundingCreator.isFoundingCreator) {
            return a.foundingCreator.isFoundingCreator ? -1 : 1;
          }

          return b.followerCount - a.followerCount;
        });
        break;
    }

    return results;
  }, [creators, query, sortMode]);

  return (
    <>
      <div className="max-w-3xl">
        <h1 className="headline-xl text-foreground">Featured Filmmakers</h1>
        <p className="body-lg mt-4">
          Discover the filmmakers shaping what comes next. Explore filmmaker profiles, follow their work, and track each new release.
        </p>
      </div>

      <div className="mt-6 surface-panel p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search filmmakers by name, handle, or bio"
              className="h-11 w-full rounded-xl border border-white/14 bg-black/35 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-white/35"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "featured", label: "Featured" },
              { id: "followers", label: "Most Followed" },
              { id: "recent", label: "Newest Work" },
              { id: "name", label: "A-Z" },
            ].map((option) => {
              const active = sortMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSortMode(option.id as SortMode)}
                  className={`rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition ${active ? "border-white/34 bg-white/16 text-foreground" : "border-white/12 bg-black/24 text-foreground/72 hover:border-white/24 hover:text-foreground"}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredCreators.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-black/28 p-6 text-sm text-muted-foreground">
          No filmmakers match your search yet.
        </div>
      ) : (
        <div className="mt-7">
          <HorizontalRail ariaLabel="featured filmmakers">
            {filteredCreators.map((creator) => {
              const tagline = creator.bio?.trim() || `@${creator.handle}`;
              const hasBanner = Boolean(creator.bannerUrl);

              return (
                <Link
                  key={creator.id}
                  href={`/creator/${creator.handle}`}
                  className="group cinema-frame w-[min(86vw,21rem)] shrink-0 snap-start overflow-hidden rounded-none border border-white/30 bg-black shadow-[0_14px_34px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(116,124,136,0.3)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.34)] sm:w-[19rem] lg:w-[20rem]"
                >
                  <div className="relative h-60 overflow-hidden">
                    {hasBanner ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={creator.bannerUrl as string}
                          alt={`${creator.displayName} banner`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,10,0.12),rgba(5,6,10,0.7))]" />
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[linear-gradient(140deg,rgba(12,14,20,0.94),rgba(7,8,13,0.9)_55%,rgba(3,4,8,0.95)),radial-gradient(circle_at_22%_18%,rgba(182,190,202,0.28),transparent_38%)]">
                        <div className="h-24 w-24 overflow-hidden rounded-full border border-white/22 bg-black/35 shadow-[0_14px_30px_rgba(0,0,0,0.45)]">
                          {creator.avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={creator.avatarUrl}
                              alt={`${creator.displayName} avatar`}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-foreground">
                              {creator.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {hasBanner ? (
                      <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-full border border-white/20 bg-black/35 shadow-[0_10px_24px_rgba(0,0,0,0.4)]">
                          {creator.avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={creator.avatarUrl} alt={`${creator.displayName} avatar`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-foreground">
                              {creator.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 pb-0.5">
                          <h2 className="truncate font-serif text-[1.2rem] font-semibold leading-tight text-foreground">{creator.displayName}</h2>
                          <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-foreground/74">@{creator.handle}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-white/16 bg-black p-4 sm:p-4.5">
                    {!hasBanner ? (
                      <h2 className="font-serif text-[1.15rem] font-semibold leading-tight text-foreground">{creator.displayName}</h2>
                    ) : null}
                    <p className={`line-clamp-1 text-sm text-foreground/82 ${hasBanner ? "" : "mt-1"}`}>{tagline}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-foreground/66">Followers {formatFollowerCount(creator.followerCount)}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-foreground/78 transition group-hover:text-foreground">
                        View Profile
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </HorizontalRail>
        </div>
      )}
    </>
  );
}
