import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WorkflowAsset, WorkflowAssetSourceType, WorkflowAssetType } from "@/types";

type WorkflowAssetRow = {
  id: string;
  draft_id: string;
  creator_id: string;
  label: string;
  asset_type: WorkflowAssetType;
  source_type: WorkflowAssetSourceType;
  url: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  stage: string | null;
  notes: string | null;
  sort_order: number;
  external_asset_id: string | null;
  external_project_id: string | null;
  source_metadata: Record<string, unknown> | null;
  created_at: string;
};

function mapWorkflowAsset(row: WorkflowAssetRow): WorkflowAsset {
  return {
    id: row.id,
    draftId: row.draft_id,
    creatorId: row.creator_id,
    label: row.label,
    assetType: row.asset_type,
    sourceType: row.source_type,
    url: row.url,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    stage: row.stage,
    notes: row.notes,
    sortOrder: row.sort_order,
    externalAssetId: row.external_asset_id,
    externalProjectId: row.external_project_id,
    sourceMetadata: row.source_metadata,
    createdAt: row.created_at,
  };
}

const SELECT_FIELDS =
  "id, draft_id, creator_id, label, asset_type, source_type, url, file_path, file_name, file_size, mime_type, stage, notes, sort_order, external_asset_id, external_project_id, source_metadata, created_at";

export async function listWorkflowAssets(draftId: string, creatorId: string): Promise<WorkflowAsset[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("workflow_assets")
    .select(SELECT_FIELDS)
    .eq("draft_id", draftId)
    .eq("creator_id", creatorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(48);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapWorkflowAsset(row as WorkflowAssetRow));
}

export async function addWorkflowLinkAsset(input: {
  draftId: string;
  creatorId: string;
  label: string;
  url: string;
  sourceType: WorkflowAssetSourceType;
  stage?: string | null;
  notes?: string | null;
}): Promise<WorkflowAsset> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("workflow_assets")
    .insert({
      draft_id: input.draftId,
      creator_id: input.creatorId,
      label: input.label.trim(),
      asset_type: "link" as WorkflowAssetType,
      source_type: input.sourceType,
      url: input.url.trim(),
      stage: input.stage?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapWorkflowAsset(data as WorkflowAssetRow);
}

export async function addWorkflowUploadAsset(input: {
  draftId: string;
  creatorId: string;
  label: string;
  url: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sourceType: WorkflowAssetSourceType;
  stage?: string | null;
  notes?: string | null;
}): Promise<WorkflowAsset> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("workflow_assets")
    .insert({
      draft_id: input.draftId,
      creator_id: input.creatorId,
      label: input.label.trim(),
      asset_type: "upload" as WorkflowAssetType,
      source_type: input.sourceType,
      url: input.url,
      file_path: input.filePath,
      file_name: input.fileName,
      file_size: input.fileSize,
      mime_type: input.mimeType,
      stage: input.stage?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapWorkflowAsset(data as WorkflowAssetRow);
}

export async function addWorkflowImportedAsset(input: {
  draftId: string;
  creatorId: string;
  label: string;
  url: string;
  sourceType: WorkflowAssetSourceType;
  mimeType?: string | null;
  externalAssetId: string;
  externalProjectId?: string | null;
  sourceMetadata?: Record<string, unknown> | null;
  stage?: string | null;
  notes?: string | null;
}): Promise<WorkflowAsset> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("workflow_assets")
    .insert({
      draft_id: input.draftId,
      creator_id: input.creatorId,
      label: input.label.trim(),
      asset_type: "import" as WorkflowAssetType,
      source_type: input.sourceType,
      url: input.url.trim(),
      mime_type: input.mimeType ?? null,
      external_asset_id: input.externalAssetId,
      external_project_id: input.externalProjectId ?? null,
      source_metadata: input.sourceMetadata ?? null,
      stage: input.stage?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapWorkflowAsset(data as WorkflowAssetRow);
}

export async function deleteWorkflowAsset(assetId: string, draftId: string, creatorId: string): Promise<{ filePath: string | null }> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("workflow_assets")
    .select("file_path")
    .eq("id", assetId)
    .eq("draft_id", draftId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!existing) {
    throw new Error("Workflow asset not found.");
  }

  const { error } = await supabase
    .from("workflow_assets")
    .delete()
    .eq("id", assetId)
    .eq("draft_id", draftId)
    .eq("creator_id", creatorId);

  if (error) {
    throw new Error(error.message);
  }

  return { filePath: (existing as { file_path: string | null }).file_path ?? null };
}
