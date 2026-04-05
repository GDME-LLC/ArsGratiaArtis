import { WorkflowToolSurface } from "@/components/workflows/workflow-tool-surface";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function WorkflowToolPage() {
  let isSignedIn = false;
  let canPersist = false;

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

  return <WorkflowToolSurface canPersist={canPersist} isSignedIn={isSignedIn} />;
}
