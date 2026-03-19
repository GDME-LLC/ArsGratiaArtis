import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicFilmFeed } from "@/components/films/public-film-feed";
import { FoundingCreatorBadge } from "@/components/founding/founding-creator-badge";
import { FollowButton } from "@/components/engagement/follow-button";
import { StatePanel } from "@/components/shared/state-panel";
import { getPublicProfileByHandle } from "@/lib/profiles";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { formatCountLabel, formatFollowerCount, formatMonthYear } from "@/lib/utils";

type CreatorPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
  const { handle } = await params;

  if (!hasSupabaseServerEnv()) {
    return {
      title: "Creator | ArsGratia",
      description: "Creator pages on ArsGratia.",
    };
  }

  const data = await getPublicProfileByHandle(handle);

  if (!data) {
    return {
      title: "Creator not found | ArsGratia",
      description: "This creator page could not be found.",
    };
  }

  const { profile, films } = data;

  const title = `${profile.displayName} (@${profile.handle}) | ArsGratia`;
  const description =
    profile.bio ||
    `${profile.displayName} on ArsGratia${films.length > 0 ? ` — ${formatCountLabel(films.length, "public release")}` : "."}`;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://arsgratia.com").replace(/\/$/, "");
  const url = `${siteUrl}/creator/${profile.handle}`;
  const image = profile.bannerUrl || profile.avatarUrl || `${siteUrl}/og-default.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "ArsGratia",
      type: "profile",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${profile.displayName} on ArsGratia`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { handle } = await params;

  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Creator pages need a live database connection"
          description="The shell can render locally, but public creator pages only resolve once profiles and films are available."
        />
      </section>
    );
  }

  const data = await getPublicProfileByHandle(handle);

  if (!data) {
    notFound();
  }

  const { profile, films } = data;
  const founderSince = formatMonthYear(profile.foundingCreator.awardedAt);

  return (
    <section className="container-shell py-14">
      <div className="surface-panel cinema-frame overflow-hidden">
        <div
          className="h-36 w-full bg-cover bg-center"
          style={
            profile.bannerUrl
              ? { backgroundImage: `linear-gradient(rgba(4,4,6,0.2), rgba(4,4,6,0.75)), url(${profile.bannerUrl})` }
              : undefined
          }
        />
        <div className="px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl font-semibold text-foreground"
                style={
                  profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})`, backgroundSize: "cover" } : undefined
                }
              >
                {!profile.avatarUrl ? profile.displayName.charAt(0).toUpperCase() : null}
              </div>
              <div className="min-w-0">
                <p className="display-kicker break-all">@{profile.handle}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="headline-lg min-w-0 break-words">{profile.displayName}</h1>
                  <FoundingCreatorBadge founder={profile.foundingCreator} showNumber />
                </div>
                {profile.foundingCreator.isFoundingCreator ? (
                  <p className="mt-2 text-sm text-[#e7d1a0]">
                    One of the first 20 creators on ArsGratia{founderSince ? ` since ${founderSince}` : "."}
                  </p>
                ) : null}
                <p className="body-sm mt-2 max-w-2xl">
                  {profile.bio || "This filmmaker page is live. A fuller note will appear here as releases and context are added."}
                </p>
              </div>
            </div>

            <div className="min-w-0 space-y-2 text-sm text-muted-foreground md:text-right">
              <div className="flex md:justify-end">
                <FollowButton
                  creatorId={profile.id}
                  initialFollowerCount={profile.followerCount}
                  initialFollowing={profile.viewerIsFollowing}
                  isCurrentUser={profile.isCurrentUser}
                />
              </div>
              <p className="break-words">
                <span className="text-foreground">{formatFollowerCount(profile.followerCount)}</span>
              </p>
              <p className="break-words">
                Filmmaker status:{" "}
                <span className="text-foreground">
                  {profile.isCreator ? "Public filmmaker" : "Viewer"}
                </span>
              </p>
              {profile.websiteUrl ? (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block break-all text-foreground underline decoration-white/20 underline-offset-4"
                >
                  Visit website
                </a>
              ) : null}
              <Link
                href={`/report?type=creator&handle=${profile.handle}`}
                className="block break-words text-foreground underline decoration-white/20 underline-offset-4"
              >
                Report profile
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div>
                <p className="display-kicker">The filmmaker behind the work</p>
                <h2 className="title-md mt-2 text-foreground">
                  {films.length === 0 ? "No public releases yet" : formatCountLabel(films.length, "public release")}
                </h2>
              </div>
            </div>

            {films.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 px-6 py-8 text-sm text-muted-foreground">
                This creator page is ready, but no public releases have premiered here yet. Return to the homepage to browse current work.
              </div>
            ) : (
              <div className="mt-6">
                <PublicFilmFeed films={films} variant="row" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
