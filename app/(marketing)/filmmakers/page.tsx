import { FilmmakersBrowse } from "@/components/marketing/filmmakers-browse";
import { SectionShell } from "@/components/marketing/section-shell";
import { StatePanel } from "@/components/shared/state-panel";
import { listPublicCreators } from "@/lib/profiles";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function FilmmakersPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <SectionShell className="py-20">
        <StatePanel
          title="The filmmaker roster needs a live database connection"
          description="Local shell mode keeps the interface visible, but this browse surface only works once public creator pages and releases can be loaded."
        />
      </SectionShell>
    );
  }

  const creators = await listPublicCreators(12);

  return (
    <SectionShell className="py-14 sm:py-16">
      {creators.length === 0 ? (
        <div className="mt-8">
          <StatePanel
            title="No public filmmakers yet"
            description="As creators begin publishing work, this roster will fill with filmmaker profiles, released films, and connected series. Until then, browse the current front page selections."
          />
        </div>
      ) : (
        <FilmmakersBrowse creators={creators} />
      )}
    </SectionShell>
  );
}

