import { NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/profiles";
import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { createWorkflowDraft, listCreatorWorkflowDrafts } from "@/lib/services/workflows";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import type { WorkflowDraftStatus } from "@/types";

type WorkflowDraftPayload = {
  title?: string;
  concept?: string | null;
  creative_direction?: string | null;
  selected_tools?: unknown;
  workflow_steps?: unknown;
  notes?: string | null;
  status?: WorkflowDraftStatus;
};

const ALLOWED_STATUSES: WorkflowDraftStatus[] = ["draft", "seeded", "archived"];

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return [...new Set(value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean))].slice(0, 24);
}

async function requireCreator() {
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

  if (!profile.isCreator) {
    return {
      error: NextResponse.json(
        { error: "Become a Creator to save progress, create drafts, and build projects in your Studio." },
        { status: 403 },
      ),
    };
  }

  return { profile };
}

export async function GET() {
  const access = await requireCreator();

  if ("error" in access) {
    return access.error;
  }

  try {
    const drafts = await listCreatorWorkflowDrafts(access.profile.id, 50);
    return NextResponse.json({ drafts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workflow drafts could not be loaded." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const access = await requireCreator();

  if ("error" in access) {
    return access.error;
  }

  const ip = await getRequestIp();
  const rateLimit = await enforceRateLimit({
    ...rateLimitPresets.films,
    key: `workflow-drafts:${ip}:${access.profile.id}`,
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
  }

  const payload = (await request.json()) as WorkflowDraftPayload;
  const title = payload.title?.trim() ?? "";

  if (!title || title.length > 120) {
    return NextResponse.json({ error: "Draft title is required and must be 120 characters or fewer." }, { status: 400 });
  }

  if (payload.status && !ALLOWED_STATUSES.includes(payload.status)) {
    return NextResponse.json({ error: "Workflow draft status is invalid." }, { status: 400 });
  }

  try {
    const draft = await createWorkflowDraft({
      creatorId: access.profile.id,
      title,
      concept: payload.concept ?? null,
      creativeDirection: payload.creative_direction ?? null,
      selectedTools: normalizeStringList(payload.selected_tools),
      workflowSteps: normalizeStringList(payload.workflow_steps),
      notes: payload.notes ?? null,
      status: payload.status ?? "draft",
    });

    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workflow draft could not be created." },
      { status: 400 },
    );
  }
}
