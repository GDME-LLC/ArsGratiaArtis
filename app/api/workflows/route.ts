import { NextResponse } from "next/server";

import { workflowGoals, workflowToolCatalog, workflowConstraints } from "@/lib/constants/workflow-builder";
import { ensureProfileForUser } from "@/lib/profiles";
import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { createWorkflow, updateWorkflow } from "@/lib/services/workflows";
import { createServerSupabaseClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import type { WorkflowConstraintId, WorkflowGoalId, WorkflowStepDraft, WorkflowToolId } from "@/types";

type WorkflowPayload = {
  workflowId?: string;
  title?: string;
  description?: string | null;
  goal?: WorkflowGoalId;
  constraints?: WorkflowConstraintId[];
  currentTools?: WorkflowToolId[];
  steps?: WorkflowStepDraft[];
};

function isValidGoal(goal: unknown): goal is WorkflowGoalId {
  return workflowGoals.some((item) => item.id === goal);
}

function isValidConstraint(constraint: unknown): constraint is WorkflowConstraintId {
  return workflowConstraints.some((item) => item.id === constraint);
}

function isValidTool(tool: unknown): tool is WorkflowToolId {
  return workflowToolCatalog.some((item) => item.id === tool);
}

function normalizeSteps(steps: unknown): WorkflowStepDraft[] {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps
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
          ? current.recommendedTools.filter(isValidTool)
          : [],
        alternateTools: Array.isArray(current.alternateTools)
          ? current.alternateTools.filter(isValidTool)
          : [],
        status:
          current.status === "complete" || current.status === "in_progress"
            ? current.status
            : "not_started",
        notes: typeof current.notes === "string" ? current.notes.slice(0, 2000) : "",
      };
    });
}

async function saveWorkflow(request: Request, method: "POST" | "PUT") {
  if (!hasSupabaseServerEnv()) {
    return NextResponse.json(
      { error: "Supabase is not configured in this environment." },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase client unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const profile = await ensureProfileForUser(user);

  if (!profile) {
    return NextResponse.json({ error: "Profile unavailable." }, { status: 400 });
  }

  const ip = await getRequestIp();
  const rateLimit = await enforceRateLimit({
    ...rateLimitPresets.workflows,
    key: `workflows:${ip}:${profile.id}`,
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
  }

  const payload = (await request.json()) as WorkflowPayload;
  const title = payload.title?.trim() ?? "";
  const description = payload.description?.trim() || null;
  const constraints = Array.isArray(payload.constraints) ? payload.constraints.filter(isValidConstraint) : [];
  const currentTools = Array.isArray(payload.currentTools) ? payload.currentTools.filter(isValidTool) : [];
  const steps = normalizeSteps(payload.steps);

  if (!title) {
    return NextResponse.json({ error: "Workflow title is required." }, { status: 400 });
  }

  if (title.length > 120) {
    return NextResponse.json({ error: "Workflow title must be 120 characters or fewer." }, { status: 400 });
  }

  if (!isValidGoal(payload.goal)) {
    return NextResponse.json({ error: "Workflow goal is invalid." }, { status: 400 });
  }

  if (steps.length === 0) {
    return NextResponse.json({ error: "Workflow steps are required." }, { status: 400 });
  }

  try {
    const workflow = method === "POST"
      ? await createWorkflow({
          creatorId: profile.id,
          title,
          description,
          goal: payload.goal,
          constraints,
          currentTools,
          steps,
        })
      : await updateWorkflow({
          workflowId: payload.workflowId ?? "",
          creatorId: profile.id,
          title,
          description,
          goal: payload.goal,
          constraints,
          currentTools,
          steps,
          status: "active",
        });

    return NextResponse.json({ workflow });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Workflow could not be saved." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  return saveWorkflow(request, "POST");
}

export async function PUT(request: Request) {
  return saveWorkflow(request, "PUT");
}