import { NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/profiles";
import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { listElevenLabsHistory } from "@/lib/elevenlabs-api";
import { listRunwayTasks } from "@/lib/runway-api";
import { getCreatorApiKey } from "@/lib/services/integrations";
import { addWorkflowImportedAsset } from "@/lib/services/workflow-assets";
import { createWorkflowDraft, listCreatorWorkflowDrafts } from "@/lib/services/workflows";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import type { WorkflowDraftStatus, WorkflowAssetSourceType } from "@/types";

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sub = url.searchParams.get("_sub");

  const access = await requireCreator();
  if ("error" in access) return access.error;

  // Platform asset listing
  if (sub === "elevenlabs-assets" || sub === "runway-assets") {
    const platform = sub === "elevenlabs-assets" ? "elevenlabs" : "runway";

    const ip = await getRequestIp();
    const rateLimit = await enforceRateLimit({
      ...rateLimitPresets.integrationSync,
      key: `integration-sync:${ip}:${access.profile.id}:${platform}`,
    });

    if (!rateLimit.ok) {
      return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
    }

    const apiKey = await getCreatorApiKey(access.profile.id, platform);

    if (!apiKey) {
      return NextResponse.json(
        { error: `${platform === "elevenlabs" ? "ElevenLabs" : "Runway"} account not connected.` },
        { status: 404 }
      );
    }

    if (platform === "elevenlabs") {
      const { items, error } = await listElevenLabsHistory(apiKey, 30);
      if (error) return NextResponse.json({ error }, { status: 400 });
      return NextResponse.json({ platform, items });
    } else {
      const { tasks, error } = await listRunwayTasks(apiKey, 30);
      if (error) return NextResponse.json({ error }, { status: 400 });
      return NextResponse.json({ platform, tasks });
    }
  }

  // Default: list workflow drafts
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
  const url = new URL(request.url);
  const sub = url.searchParams.get("_sub");

  const access = await requireCreator();
  if ("error" in access) return access.error;

  // Platform import
  if (sub === "integration-import") {
    const ip = await getRequestIp();
    const rateLimit = await enforceRateLimit({
      ...rateLimitPresets.integrationSync,
      key: `integration-import:${ip}:${access.profile.id}`,
    });

    if (!rateLimit.ok) {
      return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
    }

    const payload = (await request.json()) as {
      draft_id?: string;
      platform?: string;
      external_asset_id?: string;
      label?: string;
      url?: string;
      mime_type?: string | null;
      external_project_id?: string | null;
      source_metadata?: Record<string, unknown> | null;
      stage?: string | null;
    };

    const draftId = payload.draft_id?.trim();
    const platform = payload.platform?.trim().toLowerCase();
    const externalAssetId = payload.external_asset_id?.trim();
    const label = payload.label?.trim();
    const assetUrl = payload.url?.trim();

    if (!draftId) return NextResponse.json({ error: "draft_id is required." }, { status: 400 });
    if (!platform || !["runway", "elevenlabs"].includes(platform)) {
      return NextResponse.json({ error: "platform must be runway or elevenlabs." }, { status: 400 });
    }
    if (!externalAssetId) return NextResponse.json({ error: "external_asset_id is required." }, { status: 400 });
    if (!label) return NextResponse.json({ error: "label is required." }, { status: 400 });
    if (!assetUrl) return NextResponse.json({ error: "url is required." }, { status: 400 });

    try {
      const asset = await addWorkflowImportedAsset({
        draftId,
        creatorId: access.profile.id,
        label,
        url: assetUrl,
        sourceType: platform as WorkflowAssetSourceType,
        mimeType: payload.mime_type ?? null,
        externalAssetId,
        externalProjectId: payload.external_project_id ?? null,
        sourceMetadata: payload.source_metadata ?? null,
        stage: payload.stage ?? null,
      });
      return NextResponse.json({ asset });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Asset could not be imported." },
        { status: 400 },
      );
    }
  }

  // Default: create workflow draft
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
