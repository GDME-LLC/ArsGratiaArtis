import { NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/profiles";
import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { addWorkflowLinkAsset, deleteWorkflowAsset, listWorkflowAssets } from "@/lib/services/workflow-assets";
import { deleteWorkflowDraft, getCreatorWorkflowDraftById, updateWorkflowDraft } from "@/lib/services/workflows";
import { getMediaBucketName } from "@/lib/media/storage";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import type { WorkflowAssetSourceType, WorkflowDraftStatus } from "@/types";

type WorkflowDraftRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type WorkflowDraftPayload = {
  title?: string;
  concept?: string | null;
  creative_direction?: string | null;
  selected_tools?: unknown;
  workflow_steps?: unknown;
  notes?: string | null;
  status?: WorkflowDraftStatus;
};

type AddAssetLinkPayload = {
  label?: string;
  url?: string;
  source_type?: WorkflowAssetSourceType;
  stage?: string | null;
  notes?: string | null;
};

const ALLOWED_STATUSES: WorkflowDraftStatus[] = ["draft", "seeded", "archived"];
const ALLOWED_SOURCE_TYPES: WorkflowAssetSourceType[] = ["runway", "elevenlabs", "generic"];

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

export async function GET(request: Request, { params }: WorkflowDraftRouteProps) {
  const { id } = await params;
  const access = await requireCreator();

  if ("error" in access) {
    return access.error;
  }

  const url = new URL(request.url);
  const sub = url.searchParams.get("_sub");

  if (sub === "assets") {
    try {
      const draft = await getCreatorWorkflowDraftById(id, access.profile.id);

      if (!draft) {
        return NextResponse.json({ error: "Workflow draft not found." }, { status: 404 });
      }

      const assets = await listWorkflowAssets(id, access.profile.id);
      return NextResponse.json({ assets });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Workflow assets could not be loaded." },
        { status: 400 },
      );
    }
  }

  try {
    const draft = await getCreatorWorkflowDraftById(id, access.profile.id);

    if (!draft) {
      return NextResponse.json({ error: "Workflow draft not found." }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workflow draft could not be loaded." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request, { params }: WorkflowDraftRouteProps) {
  const { id } = await params;
  const access = await requireCreator();

  if ("error" in access) {
    return access.error;
  }

  const url = new URL(request.url);
  const sub = url.searchParams.get("_sub");

  if (sub === "assets") {
    const assetId = url.searchParams.get("_assetId");

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required." }, { status: 400 });
    }

    return NextResponse.json({ error: "Use DELETE to remove a workflow asset." }, { status: 405 });
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
    const draft = await updateWorkflowDraft({
      id,
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
      { error: error instanceof Error ? error.message : "Workflow draft could not be updated." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: WorkflowDraftRouteProps) {
  const { id } = await params;
  const access = await requireCreator();

  if ("error" in access) {
    return access.error;
  }

  const url = new URL(request.url);
  const sub = url.searchParams.get("_sub");

  if (sub === "assets") {
    const assetId = url.searchParams.get("_assetId");

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required." }, { status: 400 });
    }

    try {
      const { filePath } = await deleteWorkflowAsset(assetId, id, access.profile.id);

      if (filePath) {
        const bucketName = getMediaBucketName();
        const serviceRoleClient = createServiceRoleSupabaseClient();
        const supabase = await createServerSupabaseClient();
        const storageClient = serviceRoleClient ?? supabase;

        if (storageClient) {
          await storageClient.storage.from(bucketName).remove([filePath]);
        }
      }

      return NextResponse.json({ ok: true });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Workflow asset could not be deleted." },
        { status: 400 },
      );
    }
  }

  try {
    await deleteWorkflowDraft(id, access.profile.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workflow draft could not be deleted." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request, { params }: WorkflowDraftRouteProps) {
  const { id } = await params;
  const access = await requireCreator();

  if ("error" in access) {
    return access.error;
  }

  const url = new URL(request.url);
  const sub = url.searchParams.get("_sub");

  if (sub === "assets") {
    const draft = await getCreatorWorkflowDraftById(id, access.profile.id);

    if (!draft) {
      return NextResponse.json({ error: "Workflow draft not found." }, { status: 404 });
    }

    const payload = (await request.json()) as AddAssetLinkPayload;

    const label = payload.label?.trim() ?? "";
    const assetUrl = payload.url?.trim() ?? "";
    const sourceType = payload.source_type ?? "generic";

    if (!label || label.length > 120) {
      return NextResponse.json(
        { error: "Asset label is required and must be 120 characters or fewer." },
        { status: 400 },
      );
    }

    if (!assetUrl) {
      return NextResponse.json({ error: "A URL is required for link assets." }, { status: 400 });
    }

    try {
      new URL(assetUrl);
    } catch {
      return NextResponse.json({ error: "The URL provided is not valid." }, { status: 400 });
    }

    if (!ALLOWED_SOURCE_TYPES.includes(sourceType)) {
      return NextResponse.json({ error: "Source type is invalid." }, { status: 400 });
    }

    const stage = payload.stage?.trim() || null;
    if (stage && stage.length > 80) {
      return NextResponse.json({ error: "Stage label must be 80 characters or fewer." }, { status: 400 });
    }

    const notes = payload.notes?.trim() || null;
    if (notes && notes.length > 500) {
      return NextResponse.json({ error: "Notes must be 500 characters or fewer." }, { status: 400 });
    }

    try {
      const asset = await addWorkflowLinkAsset({
        draftId: id,
        creatorId: access.profile.id,
        label,
        url: assetUrl,
        sourceType,
        stage,
        notes,
      });

      return NextResponse.json({ asset });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Workflow asset could not be added." },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ error: "Method not allowed for this route." }, { status: 405 });
}


export async function PATCH(request: Request, { params }: WorkflowDraftRouteProps) {
  const { id } = await params;
  const access = await requireCreator();

  if ("error" in access) {
    return access.error;
  }

  const payload = (await request.json()) as { status?: WorkflowDraftStatus };

  if (!payload.status || !ALLOWED_STATUSES.includes(payload.status)) {
    return NextResponse.json({ error: "Workflow draft status is invalid." }, { status: 400 });
  }

  try {
    const current = await getCreatorWorkflowDraftById(id, access.profile.id);

    if (!current) {
      return NextResponse.json({ error: "Workflow draft not found." }, { status: 404 });
    }

    const draft = await updateWorkflowDraft({
      id,
      creatorId: access.profile.id,
      title: current.title,
      concept: current.concept,
      creativeDirection: current.creativeDirection,
      selectedTools: current.selectedTools,
      workflowSteps: current.workflowSteps,
      notes: current.notes,
      status: payload.status,
    });

    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workflow draft status could not be updated." },
      { status: 400 },
    );
  }
}
