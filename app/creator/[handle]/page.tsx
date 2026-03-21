import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FollowButton } from "@/components/engagement/follow-button";
import { FilmArtwork } from "@/components/films/film-artwork";
import { PublicFilmFeed } from "@/components/films/public-film-feed";
import { FoundingCreatorBadge } from "@/components/founding/founding-creator-badge";
import { ShareActions } from "@/components/shared/share-actions";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { getTheatreStylePreset, getOrderedVisibleTheatreSections } from "@/lib/theatre";
import { getPublicProfileByHandle } from "@/lib/profiles";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";
import { cn, formatCountLabel, formatFollowerCount, formatMonthYear } from "@/lib/utils";

type CreatorPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
  const { handle } = await params;

  if (!hasSupabaseServerEnv()) {
    return {
      title: "Theatre | ArsGratia",
      description: "Creator Theatres on ArsGratia.",
    };
  }

  const data = await getPublicProfileByHandle(handle);

  if (!data) {
    return {
      title: "Theatre not found | ArsGratia",
      description: "This Theatre could not be found.",
    };
  }

  const { profile, films } = data;
  const title = `${profile.displayName} (@${profile.handle}) | ArsGratia`;
  const description =
    profile.theatreSettings.openingStatement ||
    profile.bio ||
    `${profile.displayName} on ArsGratia${films.length > 0 ? ` - ${formatCountLabel(films.length, "public release")}` : "."}`;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://arsgratia.com").replace(/\/$/, "");
  const url = `${siteUrl}/creator/${profile.handle}`;
  const image = profile.theatreSettings.heroImageUrl || profile.bannerUrl || profile.avatarUrl || `${siteUrl}/og-default.jpg`;

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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://arsgratia.com").replace(/\/$/, "");
  const theatreUrl = `${siteUrl}/creator/${profile.handle}`;
  const theatreSettings = profile.theatreSettings;
  const preset = getTheatreStylePreset(theatreSettings.stylePreset);
  const heroImageUrl = theatreSettings.heroImageUrl || profile.bannerUrl;
  const featuredFilm = theatreSettings.featuredFilmId
    ? films.find((film) => film.id === theatreSettings.featuredFilmId) ?? null
    : null;
  const visibleSections = getOrderedVisibleTheatreSections(theatreSettings).filter((sectionId) => {
    if (sectionId === "featured_work") {
      return Boolean(featuredFilm);
    }

    if (sectionId === "releases") {
      return films.length > 0;
    }

    if (sectionId === "links") {
      return Boolean(profile.websiteUrl);
    }

    return true;
  });

  return (
    <section className={cn("relative overflow-hidden py-14", preset.pageBackgroundClass)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%)] opacity-70" />
      <div className="container-shell relative z-10">
        {profile.isCurrentUser ? (
          <div className="mb-6 flex flex-wrap gap-3">
            <Button asChild variant="ghost" size="lg">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/settings">Direct Your Theatre</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/upload">Start Release</Link>
            </Button>
          </div>
        ) : null}

        <div className={cn("cinema-frame overflow-hidden border", preset.panelClass, preset.borderClass)}>
          <div className="relative overflow-hidden">
            <div
              className={cn(
                "min-h-[300px] w-full bg-cover bg-center sm:min-h-[360px] lg:min-h-[420px]",
                heroImageUrl ? undefined : preset.surfaceClass,
              )}
              style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})` } : undefined}
            />
            <div className={cn("absolute inset-0", preset.heroOverlayClass)} />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:items-end">
                <div className="min-w-0">
                  <p className={cn("display-kicker", preset.eyebrowClass)}>Theatre</p>
                  <div className="mt-4 flex min-w-0 items-center gap-4">
                    <div
                      className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl font-semibold text-foreground sm:h-20 sm:w-20"
                      style={
                        profile.avatarUrl
                          ? { backgroundImage: `url(${profile.avatarUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                          : undefined
                      }
                    >
                      {!profile.avatarUrl ? profile.displayName.charAt(0).toUpperCase() : null}
                    </div>
                    <div className="min-w-0">
                      <p className="display-kicker break-all text-white/70">@{profile.handle}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h1 className="headline-xl min-w-0 break-words text-white">{profile.displayName}</h1>
                        <FoundingCreatorBadge founder={profile.foundingCreator} showNumber />
                      </div>
                    </div>
                  </div>
                  {theatreSettings.openingStatement ? (
                    <p className={cn("mt-6 max-w-3xl text-lg leading-8 sm:text-xl", preset.statementClass)}>
                      {theatreSettings.openingStatement}
                    </p>
                  ) : null}
                  {profile.foundingCreator.isFoundingCreator ? (
                    <p className="mt-4 text-sm text-[#e7d1a0]">
                      Founding Creator{founderSince ? ` since ${founderSince}` : ""}. One of the first 20 creators on ArsGratia.
                    </p>
                  ) : null}
                </div>

                <div className={cn("rounded-[24px] border p-5 backdrop-blur-sm", preset.panelClass, preset.borderClass)}>
                  <div className="flex flex-wrap gap-2">
                    <FollowButton
                      creatorId={profile.id}
                      initialFollowerCount={profile.followerCount}
                      initialFollowing={profile.viewerIsFollowing}
                      isCurrentUser={profile.isCurrentUser}
                    />
                    {profile.websiteUrl ? (
                      <Button asChild variant="ghost" className={preset.buttonVariantClass}>
                        <a href={profile.websiteUrl} target="_blank" rel="noreferrer">Visit website</a>
                      </Button>
                    ) : null}
                    {profile.isCurrentUser ? (
                      <Button asChild variant="ghost" className={preset.buttonVariantClass}>
                        <Link href="/settings">My Theatre</Link>
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-5 space-y-2 text-sm text-white/72">
                    <p>
                      <span className="text-white">{formatFollowerCount(profile.followerCount)}</span>
                    </p>
                    <p>
                      Filmmaker status: <span className="text-white">{profile.isCreator ? "Public filmmaker" : "Viewer"}</span>
                    </p>
                  </div>
                  <ShareActions
                    url={theatreUrl}
                    title={`${profile.displayName} on ArsGratia`}
                    heading="Share Theatre"
                    className="mt-6"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-8 sm:px-8 sm:py-10">
            <div className="grid gap-5">
              {visibleSections.map((sectionId) => {
                if (sectionId === "about") {
                  return (
                    <article key={sectionId} className={cn("rounded-[28px] border p-6 sm:p-7", preset.panelClass, preset.borderClass)}>
                      <p className={cn("display-kicker", preset.eyebrowClass)}>About</p>
                      <p className="body-lg mt-4 max-w-3xl text-foreground/92">
                        {profile.bio || "This Theatre is open. A fuller note will appear here as releases and context accumulate around the work."}
                      </p>
                    </article>
                  );
                }

                if (sectionId === "featured_work" && featuredFilm) {
                  return (
                    <article key={sectionId} className={cn("rounded-[28px] border p-6 sm:p-7", preset.panelClass, preset.borderClass)}>
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                        <div className="w-full max-w-[220px] shrink-0">
                          <FilmArtwork artworkUrl={featuredFilm.posterUrl} title={featuredFilm.title} className="rounded-[24px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("display-kicker", preset.eyebrowClass)}>Featured Work</p>
                          <h2 className="headline-lg mt-3 text-foreground">{featuredFilm.title}</h2>
                          <p className="body-sm mt-4 max-w-3xl">
                            {featuredFilm.synopsis || "A spotlighted release from this Theatre."}
                          </p>
                          <div className="mt-5 flex flex-wrap gap-3">
                            <Button asChild size="lg">
                              <Link href={`/film/${featuredFilm.slug}`}>Open Release</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }

                if (sectionId === "releases") {
                  return (
                    <article key={sectionId} className={cn("rounded-[28px] border p-6 sm:p-7", preset.panelClass, preset.borderClass)}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className={cn("display-kicker", preset.eyebrowClass)}>Theatre Presentation</p>
                          <h2 className="headline-lg mt-3 text-foreground">
                            {formatCountLabel(films.length, "public release")}
                          </h2>
                        </div>
                        {profile.isCurrentUser ? (
                          <Button asChild variant="ghost" size="lg" className={preset.buttonVariantClass}>
                            <Link href="/upload">Start Release</Link>
                          </Button>
                        ) : null}
                      </div>
                      <div className="mt-6">
                        <PublicFilmFeed films={films} variant="row" />
                      </div>
                    </article>
                  );
                }

                if (sectionId === "links" && profile.websiteUrl) {
                  return (
                    <article key={sectionId} className={cn("rounded-[28px] border p-6 sm:p-7", preset.panelClass, preset.borderClass)}>
                      <p className={cn("display-kicker", preset.eyebrowClass)}>Links</p>
                      <div className="mt-4 flex flex-col gap-3 text-sm text-foreground">
                        <a
                          href={profile.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-fit items-center gap-2 underline decoration-white/20 underline-offset-4"
                        >
                          Visit website
                        </a>
                        <Link
                          href={`/report?type=creator&handle=${profile.handle}`}
                          className="inline-flex w-fit items-center gap-2 underline decoration-white/20 underline-offset-4"
                        >
                          Report profile
                        </Link>
                      </div>
                    </article>
                  );
                }

                return null;
              })}

              {visibleSections.includes("releases") && films.length === 0 ? (
                <div className={cn("rounded-[28px] border px-6 py-8 text-sm text-muted-foreground", preset.panelClass, preset.borderClass)}>
                  This Theatre is live, but no public releases have premiered here yet. Return later to see what enters the programme.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}