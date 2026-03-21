import { NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/profiles";
import { archiveWorkflow, getCreatorWorkflowById } from "@/lib/services/workflows";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

type WorkflowRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

async function requireOwner() {
  if (!hasSupabaseServerEnv()) {
    return { error: NextResponse.json({ error: "Supabase is not configured in this environment." }, { status: 503 }) };
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return { error: NextResponse.json({ error: "Supabase client unavailable." }, { status: 503 }) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  const profile = await ensureProfileForUser(user);

  if (!profile) {
    return { error: NextResponse.json({ error: "Profile unavailable." }, { status: 400 }) };
  }

  return { profile };
}

export async function GET(_request: Request, { params }: WorkflowRouteProps) {
  const owner = await requireOwner();

  if (owner.error) {
    return owner.error;
  }

  const { id } = await params;
  const workflow = await getCreatorWorkflowById(id, owner.profile.id);

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found." }, { status: 404 });
  }

  return NextResponse.json({ workflow });
}

export async function DELETE(_request: Request, { params }: WorkflowRouteProps) {
  const owner = await requireOwner();

  if (owner.error) {
    return owner.error;
  }

  const { id } = await params;

  try {
    await archiveWorkflow(id, owner.profile.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workflow could not be archived." },
      { status: 400 },
    );
  }
}