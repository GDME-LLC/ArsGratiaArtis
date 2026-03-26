import Link from "next/link";
import { redirect } from "next/navigation";

import { FilmEditorForm } from "@/components/films/film-editor-form";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { ensureProfileForUser } from "@/lib/profiles";
import { getCreatorFilmById } from "@/lib/services/films";
import { listToolCatalog } from "@/lib/services/tools";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

type UploadPageProps = {
  searchParams?: Promise<{
    film?: string;
  }>;
};

const releaseSteps = [
  {
    label: "Step 1",
    title: "Shape the release",
    description: "Set the title, slug, synopsis, and category before anything else.",
  },
  {
    label: "Step 2",
    title: "Frame the presentation",
    description: "Choose the poster, credits, and production notes that deserve to live with the work.",
  },
  {
    label: "Step 3",
    title: "Attach the final cut",
    description: "Upload video last, once the release page already reads clearly and feels ready.",
  },
];

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
    const [film, availableTools] = await Promise.all([
      params?.film ? getCreatorFilmById(params.film, profile.id) : Promise.resolve(null),
      listToolCatalog(),
    ]);

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
      <section className="container-shell py-6 sm:py-10 lg:py-14">
        <div className="mb-4 grid gap-2.5 sm:mb-6 sm:flex sm:flex-row sm:flex-wrap sm:gap-3">
          <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
            <Link href={`/creator/${profile.handle}`}>View Creator Page</Link>
          </Button>
        </div>

        <div className="surface-panel cinema-frame w-full max-w-full overflow-x-clip px-3 py-4 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="relative isolate rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(190,155,89,0.22),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3.5 py-4 sm:rounded-[28px] sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            <div className="max-w-3xl">
              <p className="display-kicker">Creator Workspace</p>
              <h1 className="headline-lg mt-3 sm:mt-4">
                {film ? "Refine your release" : "Start a release"}
              </h1>
              <p className="body-lg mt-3 max-w-2xl text-foreground/88 sm:mt-4">
                Build the page first. Upload the final cut last. The release should already feel composed before the video arrives.
              </p>
            </div>

            <div className="mt-4 grid gap-2.5 sm:mt-6 sm:gap-3 lg:grid-cols-3">
              {releaseSteps.map((step) => (
                <article key={step.title} className="rounded-[22px] border border-white/10 bg-black/20 p-4 sm:p-5">
                  <p className="display-kicker">{step.label}</p>
                  <h2 className="title-md mt-2.5 text-foreground">{step.title}</h2>
                  <p className="body-sm mt-2.5 text-muted-foreground">{step.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-4 min-w-0 sm:mt-6">
            <FilmEditorForm initialFilm={film} availableTools={availableTools} />
          </div>
        </div>
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