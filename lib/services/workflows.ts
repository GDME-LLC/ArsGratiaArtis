import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  SavedWorkflow,
  WorkflowConstraintId,
  WorkflowGoalId,
  WorkflowStepDraft,
  WorkflowStepStatus,
  WorkflowToolId,
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
  created_at: string;
  updated_at: string;
};

export function countCompletedWorkflowSteps(steps: WorkflowStepDraft[]) {
  return steps.filter((step) => step.status === "complete").length;
}

function normalizeStepStatus(status: unknown): WorkflowStepStatus {
  if (status === "complete" || status === "in_progress") {
    return status;
  }

  return "not_started";
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCreatorWorkflows(creatorId: string): Promise<SavedWorkflow[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("workflows")
    .select("id, creator_id, title, description, goal, constraints, current_tools, steps, progress_count, total_steps, status, created_at, updated_at")
    .eq("creator_id", creatorId)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WorkflowRow[]).map(mapWorkflow);
}

export async function getCreatorWorkflowById(workflowId: string, creatorId: string): Promise<SavedWorkflow | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("workflows")
    .select("id, creator_id, title, description, goal, constraints, current_tools, steps, progress_count, total_steps, status, created_at, updated_at")
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
    })
    .select("id, creator_id, title, description, goal, constraints, current_tools, steps, progress_count, total_steps, status, created_at, updated_at")
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
    })
    .eq("id", input.workflowId)
    .eq("creator_id", input.creatorId)
    .select("id, creator_id, title, description, goal, constraints, current_tools, steps, progress_count, total_steps, status, created_at, updated_at")
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