import Link from "next/link";
import { redirect } from "next/navigation";

import { FilmEditorForm } from "@/components/films/film-editor-form";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { ensureProfileForUser } from "@/lib/profiles";
import { getCreatorFilmById } from "@/lib/services/films";
import { listToolCatalog } from "@/lib/services/tools";
import { getCreatorWorkflowDraftById } from "@/lib/services/workflows";
import { getUser } from "@/lib/supabase/auth";
import { hasSupabaseServerEnv } from "@/lib/supabase/server";

type UploadPageProps = {
  searchParams?: Promise<{
    film?: string;
    workflowDraft?: string;
  }>;
};

const releaseSteps = [
  {
    label: "Action 1",
    title: "Shape the page",
    description: "Set the title, route, synopsis, and category so the release already reads with intent.",
  },
  {
    label: "Action 2",
    title: "Add context",
    description: "Choose poster, credits, and process notes that support the work without overexplaining it.",
  },
  {
    label: "Action 3",
    title: "Upload and publish",
    description: "Attach the final cut once the page is composed, then publish when the release feels complete.",
  },
];

export default async function UploadPage({ searchParams }: UploadPageProps) {
  if (!hasSupabaseServerEnv()) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Creator editor needs a live connection"
          description="The surface can render in shell mode, but saving drafts and edits works only after Supabase is connected."
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
            description="Your account is signed in, but your creator profile could not be loaded right now."
          />
        </section>
      );
    }

    if (!profile.isCreator) {
      return (
        <section className="container-shell py-20">
          <StatePanel
            title="Creator access is required"
            description="Enable creator mode in settings before creating or editing projects."
          />
        </section>
      );
    }

    const params = searchParams ? await searchParams : undefined;
    const [film, availableTools, workflowDraft] = await Promise.all([
      params?.film ? getCreatorFilmById(params.film, profile.id) : Promise.resolve(null),
      listToolCatalog(),
      params?.workflowDraft ? getCreatorWorkflowDraftById(params.workflowDraft, profile.id) : Promise.resolve(null),
    ]);

    if (params?.film && !film) {
      return (
        <section className="container-shell py-20">
          <StatePanel
            title="Draft not found"
            description="That project draft either does not exist or does not belong to this account."
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

        <div className="surface-panel cinema-frame app-stack-shell px-3 py-4 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="relative isolate rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(190,155,89,0.22),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3.5 py-4 sm:rounded-[28px] sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            <div className="max-w-3xl">
              <p className="display-kicker">Creator Hub</p>
              <h1 className="headline-lg mt-3 sm:mt-4">
                {film ? "Continue this release" : "Start a new release"}
              </h1>
              <p className="body-lg mt-3 max-w-2xl text-foreground/88 sm:mt-4">
                Keep the flow simple: shape the page, add the right context, then upload and publish when the work is ready.
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
            <FilmEditorForm initialFilm={film} initialWorkflowDraft={!film ? workflowDraft : null} availableTools={availableTools} />
          </div>
        </div>
      </section>
    );
  } catch (error) {
    return (
      <section className="container-shell py-20">
        <StatePanel
          title="Creator editor could not be loaded"
          description={error instanceof Error ? error.message : "An unexpected error occurred."}
        />
      </section>
    );
  }
}