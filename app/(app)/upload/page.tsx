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
        <div className="mb-6 rounded-[24px] border border-white/10 bg-white/5 p-6">
          <p className="display-kicker">Uploading Your Film</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <p className="title-md text-foreground">Video Upload</p>
              <p className="body-sm mt-2">
                Upload your final video file. Once processing completes, ArsGratia will automatically generate a preview image from the video.
              </p>
            </article>
            <article className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <p className="title-md text-foreground">Automatic Thumbnails</p>
              <p className="body-sm mt-2">
                When a video finishes processing, a thumbnail is generated automatically using Mux.
              </p>
            </article>
            <article className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <p className="title-md text-foreground">Custom Posters</p>
              <p className="body-sm mt-2">
                If you prefer, you can upload a poster image. This will be shown instead of the auto-generated thumbnail.
              </p>
            </article>
            <article className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <p className="title-md text-foreground">Draft Workflow</p>
              <ol className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
                <li>1. Create and save your film draft</li>
                <li>2. Upload your video</li>
                <li>3. Add poster or allow automatic thumbnail</li>
                <li>4. Publish your film</li>
              </ol>
            </article>
          </div>
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
