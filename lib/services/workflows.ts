import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  PublicWorkflow,
  SavedWorkflow,
  WorkflowConstraintId,
  WorkflowGoalId,
  WorkflowStepDraft,
  WorkflowStepStatus,
  WorkflowToolId,
  WorkflowVisibilityScope,
} from "@/types";

type WorkflowRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  goal: WorkflowGoalId;
  constraints: WorkflowConstraintId[] | null;
  current_tools: WorkflowToolId[] | null;
  steps: WorkflowStepDraft[] | null;
  progress_count: number | null;
  total_steps: number | null;
  status: "active" | "archived";
  visibility_scope: WorkflowVisibilityScope | null;
  attached_film_id: string | null;
  created_at: string;
  updated_at: string;
};

const workflowSelect = "id, creator_id, title, description, goal, constraints, current_tools, steps, progress_count, total_steps, status, visibility_scope, attached_film_id, created_at, updated_at";

export function countCompletedWorkflowSteps(steps: WorkflowStepDraft[]) {
  return steps.filter((step) => step.status === "complete").length;
}

function normalizeStepStatus(status: unknown): WorkflowStepStatus {
  if (status === "complete" || status === "in_progress") {
    return status;
  }

  return "not_started";
}

function normalizeVisibilityScope(value: unknown): WorkflowVisibilityScope {
  if (value === "theatre" || value === "film_page" || value === "theatre_and_film") {
    return value;
  }

  return "private";
}

function normalizeSteps(value: unknown): WorkflowStepDraft[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((step) => step && typeof step === "object")
    .map((step, index) => {
      const current = step as Record<string, unknown>;
      return {
        id: typeof current.id === "string" ? current.id : `step-${index + 1}`,
        stepNumber: typeof current.stepNumber === "number" ? current.stepNumber : index + 1,
        title: typeof current.title === "string" ? current.title : `Step ${index + 1}`,
        description: typeof current.description === "string" ? current.description : "",
        whyItMatters: typeof current.whyItMatters === "string" ? current.whyItMatters : "",
        recommendedTools: Array.isArray(current.recommendedTools)
          ? current.recommendedTools.filter((tool): tool is WorkflowToolId => typeof tool === "string")
          : [],
        alternateTools: Array.isArray(current.alternateTools)
          ? current.alternateTools.filter((tool): tool is WorkflowToolId => typeof tool === "string")
          : [],
        status: normalizeStepStatus(current.status),
        notes: typeof current.notes === "string" ? current.notes : "",
      };
    });
}

function mapWorkflow(row: WorkflowRow): SavedWorkflow {
  const steps = normalizeSteps(row.steps);
  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    description: row.description,
    goal: row.goal,
    constraints: Array.isArray(row.constraints) ? row.constraints : [],
    currentTools: Array.isArray(row.current_tools) ? row.current_tools : [],
    steps,
    progressCount: typeof row.progress_count === "number" ? row.progress_count : countCompletedWorkflowSteps(steps),
    totalSteps: typeof row.total_steps === "number" ? row.total_steps : steps.length,
    status: row.status,
    visibilityScope: normalizeVisibilityScope(row.visibility_scope),
    attachedFilmId: typeof row.attached_film_id === "string" ? row.attached_film_id : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPublicWorkflow(row: WorkflowRow): PublicWorkflow {
  const workflow = mapWorkflow(row);
  return {
    id: workflow.id,
    title: workflow.title,
    description: workflow.description,
    goal: workflow.goal,
    steps: workflow.steps,
    progressCount: workflow.progressCount,
    totalSteps: workflow.totalSteps,
    visibilityScope: workflow.visibilityScope === "private" ? "theatre" : workflow.visibilityScope,
    attachedFilmId: workflow.attachedFilmId,
    updatedAt: workflow.updatedAt,
  };
}

export async function listCreatorWorkflows(creatorId: string): Promise<SavedWorkflow[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("workflows")
    .select(workflowSelect)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WorkflowRow[]).map(mapWorkflow);
}

export async function listPublicTheatreWorkflows(creatorId: string): Promise<PublicWorkflow[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("workflows")
    .select(workflowSelect)
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .in("visibility_scope", ["theatre", "theatre_and_film"])
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WorkflowRow[]).map(mapPublicWorkflow);
}

export async function listPublicFilmWorkflows(filmId: string): Promise<PublicWorkflow[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("workflows")
    .select(workflowSelect)
    .eq("attached_film_id", filmId)
    .eq("status", "active")
    .in("visibility_scope", ["film_page", "theatre_and_film"])
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WorkflowRow[]).map(mapPublicWorkflow);
}

export async function getCreatorWorkflowById(workflowId: string, creatorId: string): Promise<SavedWorkflow | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("workflows")
    .select(workflowSelect)
    .eq("id", workflowId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapWorkflow(data as WorkflowRow) : null;
}

export async function createWorkflow(input: {
  creatorId: string;
  title: string;
  description: string | null;
  goal: WorkflowGoalId;
  constraints: WorkflowConstraintId[];
  currentTools: WorkflowToolId[];
  steps: WorkflowStepDraft[];
  status?: "active" | "archived";
  visibilityScope?: WorkflowVisibilityScope;
  attachedFilmId?: string | null;
}) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("workflows")
    .insert({
      creator_id: input.creatorId,
      title: input.title,
      description: input.description,
      goal: input.goal,
      constraints: input.constraints,
      current_tools: input.currentTools,
      steps: input.steps,
      progress_count: countCompletedWorkflowSteps(input.steps),
      total_steps: input.steps.length,
      status: input.status ?? "active",
      visibility_scope: input.visibilityScope ?? "private",
      attached_film_id: input.attachedFilmId ?? null,
    })
    .select(workflowSelect)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapWorkflow(data as WorkflowRow);
}

export async function updateWorkflow(input: {
  workflowId: string;
  creatorId: string;
  title: string;
  description: string | null;
  goal: WorkflowGoalId;
  constraints: WorkflowConstraintId[];
  currentTools: WorkflowToolId[];
  steps: WorkflowStepDraft[];
  status: "active" | "archived";
  visibilityScope: WorkflowVisibilityScope;
  attachedFilmId: string | null;
}) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("workflows")
    .update({
      title: input.title,
      description: input.description,
      goal: input.goal,
      constraints: input.constraints,
      current_tools: input.currentTools,
      steps: input.steps,
      progress_count: countCompletedWorkflowSteps(input.steps),
      total_steps: input.steps.length,
      status: input.status,
      visibility_scope: input.visibilityScope,
      attached_film_id: input.attachedFilmId,
    })
    .eq("id", input.workflowId)
    .eq("creator_id", input.creatorId)
    .select(workflowSelect)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapWorkflow(data as WorkflowRow);
}

export async function archiveWorkflow(workflowId: string, creatorId: string) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("workflows")
    .update({ status: "archived" })
    .eq("id", workflowId)
    .eq("creator_id", creatorId);

  if (error) {
    throw new Error(error.message);
  }
}
