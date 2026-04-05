import { createServerSupabaseClient } from "@/lib/supabase/server";
import { carryWorkflowAssetsToFilm } from "@/lib/services/workflow-assets";
import type { WorkflowDraft, WorkflowDraftStatus } from "@/types";

type WorkflowDraftRow = {
  id: string;
  creator_id: string;
  title: string;
  concept: string | null;
  creative_direction: string | null;
  selected_tools: unknown;
  workflow_steps: unknown;
  notes: string | null;
  status: WorkflowDraftStatus;
  seeded_film_id: string | null;
  asset_count: number;
  created_at: string;
  updated_at: string;
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean))].slice(0, 24);
}

function mapWorkflowDraft(row: WorkflowDraftRow): WorkflowDraft {
  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    concept: row.concept,
    creativeDirection: row.creative_direction,
    selectedTools: normalizeStringArray(row.selected_tools),
    workflowSteps: normalizeStringArray(row.workflow_steps),
    notes: row.notes,
    status: row.status,
    seededFilmId: row.seeded_film_id,
    assetCount: row.asset_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCreatorWorkflowDrafts(creatorId: string, limit = 24): Promise<WorkflowDraft[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("workflow_drafts")
    .select("id, creator_id, title, concept, creative_direction, selected_tools, workflow_steps, notes, status, seeded_film_id, created_at, updated_at, workflow_assets(count)")
    .eq("creator_id", creatorId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const rawCount = (row as unknown as { workflow_assets: Array<{ count: number }> }).workflow_assets;
    const assetCount = Array.isArray(rawCount) && rawCount[0] ? rawCount[0].count : 0;
    return mapWorkflowDraft({ ...(row as unknown as WorkflowDraftRow), asset_count: assetCount });
  });
}

export async function getCreatorWorkflowDraftById(draftId: string, creatorId: string): Promise<WorkflowDraft | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("workflow_drafts")
    .select("id, creator_id, title, concept, creative_direction, selected_tools, workflow_steps, notes, status, seeded_film_id, created_at, updated_at, workflow_assets(count)")
    .eq("id", draftId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const rawCount = (data as unknown as { workflow_assets: Array<{ count: number }> }).workflow_assets;
  const assetCount = Array.isArray(rawCount) && rawCount[0] ? rawCount[0].count : 0;
  return mapWorkflowDraft({ ...(data as unknown as WorkflowDraftRow), asset_count: assetCount });
}

export async function createWorkflowDraft(input: {
  creatorId: string;
  title: string;
  concept?: string | null;
  creativeDirection?: string | null;
  selectedTools?: string[];
  workflowSteps?: string[];
  notes?: string | null;
  status?: WorkflowDraftStatus;
}): Promise<WorkflowDraft> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("workflow_drafts")
    .insert({
      creator_id: input.creatorId,
      title: input.title.trim(),
      concept: input.concept?.trim() || null,
      creative_direction: input.creativeDirection?.trim() || null,
      selected_tools: normalizeStringArray(input.selectedTools ?? []),
      workflow_steps: normalizeStringArray(input.workflowSteps ?? []),
      notes: input.notes?.trim() || null,
      status: input.status ?? "draft",
    })
    .select("id, creator_id, title, concept, creative_direction, selected_tools, workflow_steps, notes, status, seeded_film_id, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapWorkflowDraft({ ...(data as unknown as WorkflowDraftRow), asset_count: 0 });
}

export async function updateWorkflowDraft(input: {
  id: string;
  creatorId: string;
  title: string;
  concept?: string | null;
  creativeDirection?: string | null;
  selectedTools?: string[];
  workflowSteps?: string[];
  notes?: string | null;
  status?: WorkflowDraftStatus;
}): Promise<WorkflowDraft> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("workflow_drafts")
    .update({
      title: input.title.trim(),
      concept: input.concept?.trim() || null,
      creative_direction: input.creativeDirection?.trim() || null,
      selected_tools: normalizeStringArray(input.selectedTools ?? []),
      workflow_steps: normalizeStringArray(input.workflowSteps ?? []),
      notes: input.notes?.trim() || null,
      status: input.status ?? "draft",
    })
    .eq("id", input.id)
    .eq("creator_id", input.creatorId)
    .select("id, creator_id, title, concept, creative_direction, selected_tools, workflow_steps, notes, status, seeded_film_id, created_at, updated_at")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Workflow draft not found.");
  }

  return mapWorkflowDraft({ ...(data as unknown as WorkflowDraftRow), asset_count: 0 });
}

export async function deleteWorkflowDraft(draftId: string, creatorId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("workflow_drafts")
    .delete()
    .eq("id", draftId)
    .eq("creator_id", creatorId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function seedWorkflowDraftIntoProject(input: { draftId: string; creatorId: string; filmId: string }): Promise<void> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("workflow_drafts")
    .select("id")
    .eq("id", input.draftId)
    .eq("creator_id", input.creatorId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existing) {
    throw new Error("Workflow draft not found for this creator.");
  }

  const { error } = await supabase
    .from("workflow_drafts")
    .update({
      status: "seeded",
      seeded_film_id: input.filmId,
    })
    .eq("id", input.draftId)
    .eq("creator_id", input.creatorId);

  if (error) {
    throw new Error(error.message);
  }

  // Carry all workflow assets to the film project (best-effort, non-blocking)
  try {
    await carryWorkflowAssetsToFilm(input.draftId, input.filmId, input.creatorId);
  } catch {
    // Asset carry-through failure doesn't block seeding
  }
}
