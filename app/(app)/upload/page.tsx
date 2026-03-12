import { redirect } from "next/navigation";

import { FilmEditorForm } from "@/components/films/film-editor-form";
import { StatePanel } from "@/components/shared/state-panel";
import { ensureProfileForUser } from "@/lib/profiles";
import { getCreatorFilmById } from "@/lib/services/films";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

type UploadPageProps = {
  searchParams?: Promise<{
    film?: string;
  }>;
};

export default async function UploadPage({ searchParams }: UploadPageProps) {
  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Upload is in local fallback mode"
          description="The route renders locally without Supabase, but draft film creation activates only when auth and database env vars are present."
        />
      </section>
    );
  }

  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const profile = await ensureProfileForUser(user);

    if (!profile) {
      return (
        <section className="container-shell py-20">
          <StatePanel
            title="Profile unavailable"
            description="Your account is signed in, but the creator profile could not be loaded."
          />
        </section>
      );
    }

    if (!profile.isCreator) {
      return (
        <section className="container-shell py-20">
          <StatePanel
            title="Creator mode required"
            description="Turn on creator mode in settings before creating or editing film drafts."
          />
        </section>
      );
    }

    const params = searchParams ? await searchParams : undefined;
    const film = params?.film ? await getCreatorFilmById(params.film, profile.id) : null;

    if (params?.film && !film) {
      return (
        <section className="container-shell py-20">
          <StatePanel
            title="Draft not found"
            description="That draft either does not exist or does not belong to the current user."
          />
        </section>
      );
    }

    return (
      <section className="container-shell py-20">
        <FilmEditorForm initialFilm={film} />
      </section>
    );
  } catch (error) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Film editor failed to load"
          description={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      </section>
    );
  }
}
