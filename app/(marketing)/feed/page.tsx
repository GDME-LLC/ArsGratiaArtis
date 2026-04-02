import { PublicFilmFeed } from "@/components/films/public-film-feed";
import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { StatePanel } from "@/components/shared/state-panel";
import { listCuratedFilms, listPublishedFilms } from "@/lib/services/films";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

type FeedPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export default async function FeedPage({ searchParams }: FeedPageProps) {
  if (!hasSupabaseServerEnv()) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="The release feed needs a live database connection"
          description="Local shell mode keeps the front end visible, but public discovery only works once published films can be loaded."
        />
      </SectionShell>
    );
  }

  const params = searchParams ? await searchParams : undefined;
  const page = Number(params?.page ?? "1");
  const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const staffPicks = await listCuratedFilms({ pageSize: 6 });
  const { films, hasMore } = await listPublishedFilms({
    page: currentPage,
    pageSize: 9,
  });

  return (
    <SectionShell className="py-14 sm:py-16">
      {staffPicks.length > 0 ? (
        <div>
          <PageIntro
            eyebrow="Staff Picks"
            title="Staff Picks"
            description="Selected for craft, voice, or originality."
          />

          <div className="mt-8">
            <PublicFilmFeed films={staffPicks} variant="row" />
          </div>
        </div>
      ) : null}

      <div className={staffPicks.length > 0 ? "mt-12" : ""}>
        <PageIntro
          eyebrow="New Releases"
          title="New Releases"
          description="Fresh films published on ArsNeos."
        />

        {films.length === 0 ? (
          <div className="mt-8">
            <StatePanel
              title="No public releases yet"
              description="As creators begin publishing, new work will land here first. Until then, the homepage spotlight and filmmaker roster remain the best way into ArsNeos."
            />
          </div>
        ) : (
          <div className="mt-8">
            <PublicFilmFeed
              films={films}
              hasMore={hasMore}
              nextPageHref={`/feed?page=${currentPage + 1}`}
              variant="row"
            />
          </div>
        )}
      </div>
    </SectionShell>
  );
}
