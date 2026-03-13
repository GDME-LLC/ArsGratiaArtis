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
          title="The creator editor needs live auth and database access"
          description="Local shell mode can render this page, but draft creation and saved edits only work once Supabase is connected."
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
            description="Your account is signed in, but the creator record could not be loaded right now."
          />
        </section>
      );
    }

    if (!profile.isCreator) {
      return (
        <section className="container-shell py-20">
          <StatePanel
            title="Creator mode required"
            description="Turn on creator mode in settings before creating or editing releases."
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
            description="That release draft either does not exist or does not belong to the current account."
          />
        </section>
      );
    }

    return (
      <section className="container-shell py-14">
        <div className="mb-6 max-w-2xl">
          <p className="display-kicker">Creator Workspace</p>
          <h1 className="headline-lg mt-3">
            {film ? "Refine your release page" : "Start a release page"}
          </h1>
          <p className="body-lg mt-4">
            Poster-led release pages are supported. You can publish artwork, title, synopsis, and slug first, then attach video when the final delivery is ready.
          </p>
        </div>
        <FilmEditorForm initialFilm={film} />
      </section>
    );
  } catch (error) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="The release editor could not be loaded"
          description={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      </section>
    );
  }
}
