import { PublicFilmFeed } from "@/components/films/public-film-feed";
import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { StatePanel } from "@/components/shared/state-panel";
import { listPublishedFilms } from "@/lib/services/films";
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
  const { films, hasMore } = await listPublishedFilms({
    page: currentPage,
    pageSize: 9,
  });

  return (
    <SectionShell className="py-14 sm:py-16">
      <PageIntro
        eyebrow="Feed"
        title="A running feed of recent releases."
        description="Browse newly published films across ArsGratia, with enough context to keep discovery useful without slowing the scan."
      />

      {films.length === 0 ? (
        <div className="mt-8">
          <StatePanel
            title="No public releases yet"
            description="This feed will fill as invited creators begin publishing. Poster-led pages are supported, so a film can arrive here before final video delivery is attached."
          />
        </div>
      ) : (
        <div className="mt-8">
          <PublicFilmFeed
            films={films}
            hasMore={hasMore}
            nextPageHref={`/feed?page=${currentPage + 1}`}
          />
        </div>
      )}
    </SectionShell>
  );
}
