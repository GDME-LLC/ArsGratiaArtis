import { WorkflowToolSurface } from "@/components/workflows/workflow-tool-surface";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

type WorkflowToolPageProps = {
  searchParams?: Promise<{
    draft?: string;
  }>;
};

export default async function WorkflowToolPage({ searchParams }: WorkflowToolPageProps) {
  let isSignedIn = false;
  let canPersist = false;
  const params = searchParams ? await searchParams : undefined;

  if (hasSupabaseServerEnv()) {
    const supabase = await createServerSupabaseClient();

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      isSignedIn = Boolean(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_creator")
          .eq("id", user.id)
          .maybeSingle();

        canPersist = Boolean(profile?.is_creator);
      }
    }
  }

  return <WorkflowToolSurface canPersist={canPersist} isSignedIn={isSignedIn} initialDraftId={params?.draft ?? null} />;
}
