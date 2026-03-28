import { PublicFilmFeed } from "@/components/films/public-film-feed";
import { SectionShell } from "@/components/marketing/section-shell";
import { PageIntro } from "@/components/shared/page-intro";
import { StatePanel } from "@/components/shared/state-panel";
import { FILM_CATEGORY_LABELS } from "@/lib/films/categories";
import { getDefaultPlatformSettings, getPlatformSettings } from "@/lib/platform-settings";
import { listPublishedFilms } from "@/lib/services/films";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function BeyondCinemaPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="Beyond Cinema needs a live database connection"
          description="This browse surface appears once public releases can be loaded from the database."
        />
      </SectionShell>
    );
  }

  const platformSettings = await getPlatformSettings().catch(() => getDefaultPlatformSettings());
  const beyondCinemaCategories = platformSettings.beyondCinemaCategories;
  const { films } = await listPublishedFilms({
    page: 1,
    pageSize: 24,
    categories: beyondCinemaCategories,
  });

  return (
    <SectionShell className="py-14 sm:py-16">
      <PageIntro
        eyebrow="Beyond Cinema"
        title="Beyond Cinema"
        description="Animation, experimental work, commercial pieces, commentary, and short-form releases across ArsGratia."
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {beyondCinemaCategories.map((category) => (
          <span
            key={category}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground"
          >
            {FILM_CATEGORY_LABELS[category]}
          </span>
        ))}
      </div>

      {films.length === 0 ? (
        <div className="mt-8">
          <StatePanel
            title="Beyond Cinema is still taking shape"
            description="As creators publish animation, experimental, commercial, commentary, and short-form work, those releases will collect here. For now, return to New Releases or the filmmaker roster."
          />
        </div>
      ) : (
        <div className="mt-8">
          <PublicFilmFeed films={films} />
        </div>
      )}
    </SectionShell>
  );
}
