"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  generateWorkflowFromSelections,
  getWorkflowGoalLabel,
  workflowConstraints,
  workflowGoals,
  workflowToolCatalog,
} from "@/lib/constants/workflow-builder";
import { WorkflowProgress } from "@/components/workflows/workflow-progress";
import { WorkflowStepCard } from "@/components/workflows/workflow-step-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CreatorFilmListItem,
  SavedWorkflow,
  WorkflowConstraintId,
  WorkflowGoalId,
  WorkflowStepDraft,
  WorkflowStepStatus,
  WorkflowToolId,
  WorkflowVisibilityScope,
} from "@/types";

type WorkflowBuilderProps = {
  signedIn: boolean;
  initialWorkflow?: SavedWorkflow | null;
  availableFilms?: CreatorFilmListItem[];
  mode?: "builder" | "studio";
};

type WorkflowApiResponse = {
  workflow?: SavedWorkflow;
  error?: string;
};

type BuilderState = {
  title: string;
  description: string;
  goal: WorkflowGoalId;
  constraints: WorkflowConstraintId[];
  currentTools: WorkflowToolId[];
  steps: WorkflowStepDraft[];
  currentStep: number;
  visibilityScope: WorkflowVisibilityScope;
  attachedFilmId: string | null;
};

const BUILDER_STEP_LABELS = ["Goal", "Constraints", "Tools", "Workflow"];
const SESSION_STORAGE_KEY = "arsgratia.workflow-builder.draft";

const visibilityOptions: Array<{
  value: WorkflowVisibilityScope;
  label: string;
  description: string;
}> = [
  { value: "private", label: "Private", description: "Kept inside Creator Studio only." },
  { value: "theatre", label: "Visible on Theatre", description: "Shown publicly in read-only form on your Theatre." },
  { value: "film_page", label: "Visible on Film Page", description: "Shown in read-only form on one attached film page." },
  { value: "theatre_and_film", label: "Theatre and Film Page", description: "Shown publicly on your Theatre and one attached film page." },
];

function buildDefaultState(): BuilderState {
  return {
    title: "",
    description: "",
    goal: "first_short_film",
    constraints: [],
    currentTools: [],
    steps: [],
    currentStep: 1,
    visibilityScope: "private",
    attachedFilmId: null,
  };
}

function buildStateFromWorkflow(workflow: SavedWorkflow): BuilderState {
  return {
    title: workflow.title,
    description: workflow.description ?? "",
    goal: workflow.goal,
    constraints: workflow.constraints,
    currentTools: workflow.currentTools,
    steps: workflow.steps,
    currentStep: 4,
    visibilityScope: workflow.visibilityScope,
    attachedFilmId: workflow.attachedFilmId,
  };
}

function requiresFilmAttachment(scope: WorkflowVisibilityScope) {
  return scope === "film_page" || scope === "theatre_and_film";
}

export function WorkflowBuilder({
  signedIn,
  initialWorkflow = null,
  availableFilms = [],
  mode = "builder",
}: WorkflowBuilderProps) {
  const router = useRouter();
  const [state, setState] = useState<BuilderState>(() =>
    initialWorkflow ? buildStateFromWorkflow(initialWorkflow) : buildDefaultState(),
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (initialWorkflow || typeof window === "undefined") {
      return;
    }

    const saved = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Partial<BuilderState>;
      setState((current) => ({
        ...current,
        ...parsed,
        title: typeof parsed.title === "string" ? parsed.title : current.title,
        description: typeof parsed.description === "string" ? parsed.description : current.description,
        goal: typeof parsed.goal === "string" ? (parsed.goal as WorkflowGoalId) : current.goal,
        constraints: Array.isArray(parsed.constraints) ? (parsed.constraints as WorkflowConstraintId[]) : current.constraints,
        currentTools: Array.isArray(parsed.currentTools) ? (parsed.currentTools as WorkflowToolId[]) : current.currentTools,
        steps: Array.isArray(parsed.steps) ? (parsed.steps as WorkflowStepDraft[]) : current.steps,
        currentStep: typeof parsed.currentStep === "number" ? parsed.currentStep : current.currentStep,
        visibilityScope: typeof parsed.visibilityScope === "string" ? (parsed.visibilityScope as WorkflowVisibilityScope) : current.visibilityScope,
        attachedFilmId: typeof parsed.attachedFilmId === "string" ? parsed.attachedFilmId : current.attachedFilmId,
      }));
    } catch {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [initialWorkflow]);

  useEffect(() => {
    if (initialWorkflow || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        title: state.title,
        description: state.description,
        goal: state.goal,
        constraints: state.constraints,
        currentTools: state.currentTools,
        steps: state.steps,
        currentStep: state.currentStep,
        visibilityScope: state.visibilityScope,
        attachedFilmId: state.attachedFilmId,
      }),
    );
  }, [initialWorkflow, state]);

  useEffect(() => {
    if (initialWorkflow) {
      setState(buildStateFromWorkflow(initialWorkflow));
    }
  }, [initialWorkflow]);

  const progressCount = useMemo(
    () => state.steps.filter((step) => step.status === "complete").length,
    [state.steps],
  );

  function generateWorkflow() {
    const generated = generateWorkflowFromSelections({
      goal: state.goal,
      constraints: state.constraints,
      currentTools: state.currentTools,
    });

    setState((current) => ({
      ...current,
      steps: generated,
      currentStep: 4,
      title: current.title || `${getWorkflowGoalLabel(current.goal)} Workflow`,
    }));
  }

  function handleNextStep() {
    setError("");
    setSuccess("");

    if (state.currentStep === 3) {
      generateWorkflow();
      return;
    }

    setState((current) => ({
      ...current,
      currentStep: Math.min(4, current.currentStep + 1),
    }));
  }

  function handlePreviousStep() {
    setError("");
    setSuccess("");
    setState((current) => ({
      ...current,
      currentStep: Math.max(1, current.currentStep - 1),
    }));
  }

  function toggleConstraint(constraintId: WorkflowConstraintId) {
    setState((current) => ({
      ...current,
      constraints: current.constraints.includes(constraintId)
        ? current.constraints.filter((item) => item !== constraintId)
        : [...current.constraints, constraintId],
    }));
  }

  function toggleTool(toolId: WorkflowToolId) {
    setState((current) => {
      const nextTools = current.currentTools.includes(toolId)
        ? current.currentTools.filter((item) => item !== toolId)
        : [...current.currentTools.filter((item) => item !== "none_yet"), toolId];

      return {
        ...current,
        currentTools:
          toolId === "none_yet"
            ? current.currentTools.includes("none_yet")
              ? []
              : ["none_yet"]
            : nextTools,
      };
    });
  }

  function updateStep(stepId: string, updates: Partial<WorkflowStepDraft>) {
    setState((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)),
    }));
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!state.title.trim()) {
      setError("Give this workflow a title before saving it.");
      return;
    }

    if (state.steps.length === 0) {
      setError("Generate the workflow before saving it.");
      return;
    }

    if (requiresFilmAttachment(state.visibilityScope) && !state.attachedFilmId) {
      setError("Attach this workflow to one of your films before showing it on a film page.");
      return;
    }

    if (!signedIn) {
      setShowAuthPrompt(true);
      setError("Sign in to save this workflow to your account.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/workflows", {
        method: initialWorkflow ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId: initialWorkflow?.id,
          title: state.title.trim(),
          description: state.description.trim() || null,
          goal: state.goal,
          constraints: state.constraints,
          currentTools: state.currentTools,
          steps: state.steps,
          visibilityScope: state.visibilityScope,
          attachedFilmId: state.attachedFilmId,
        }),
      });

      const payload = (await response.json()) as WorkflowApiResponse;

      if (!response.ok || !payload.workflow) {
        setError(payload.error ?? "Workflow could not be saved.");
        return;
      }

      setSuccess(initialWorkflow ? "Workflow updated." : "Workflow saved to your account.");
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
      router.push(`/workflows/${payload.workflow.id}`);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive() {
    if (!initialWorkflow) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/workflows/${initialWorkflow.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Workflow could not be archived.");
        return;
      }

      router.push("/settings#workflows");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <WorkflowProgress currentStep={state.currentStep} totalSteps={4} labels={BUILDER_STEP_LABELS} />

      <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 sm:p-7">
        {state.currentStep === 1 ? (
          <div>
            <p className="display-kicker">Choose your goal</p>
            <h2 className="headline-lg mt-3 text-foreground">Build a workflow that fits how you actually make films.</h2>
            <p className="body-lg mt-4 max-w-3xl">
              Start with the most immediate objective. The builder will structure the process from there.
            </p>
            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {workflowGoals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setState((current) => ({ ...current, goal: goal.id }))}
                  className={cn(
                    "rounded-[24px] border p-5 text-left transition",
                    state.goal === goal.id ? "border-primary/30 bg-primary/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]",
                  )}
                >
                  <p className="display-kicker">Goal</p>
                  <h3 className="title-md mt-3 text-foreground">{goal.label}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{goal.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {state.currentStep === 2 ? (
          <div>
            <p className="display-kicker">Choose your constraints</p>
            <h2 className="headline-lg mt-3 text-foreground">Shape the workflow around real production limits.</h2>
            <p className="body-lg mt-4 max-w-3xl">
              Select the conditions that most affect how you work. The recommendations will adapt their emphasis.
            </p>
            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {workflowConstraints.map((constraint) => {
                const selected = state.constraints.includes(constraint.id);
                return (
                  <button
                    key={constraint.id}
                    type="button"
                    onClick={() => toggleConstraint(constraint.id)}
                    className={cn(
                      "rounded-[24px] border p-5 text-left transition",
                      selected ? "border-primary/30 bg-primary/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]",
                    )}
                  >
                    <p className="display-kicker">Constraint</p>
                    <h3 className="title-md mt-3 text-foreground">{constraint.label}</h3>
                    <p className="mt-3 text-sm text-muted-foreground">{constraint.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {state.currentStep === 3 ? (
          <div>
            <p className="display-kicker">Choose your current tools</p>
            <h2 className="headline-lg mt-3 text-foreground">Let the builder start from the tools you already know.</h2>
            <p className="body-lg mt-4 max-w-3xl">
              Select what you actively use now. If you are starting from zero, choose <span className="text-foreground">None yet</span>.
            </p>
            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {workflowToolCatalog.map((tool) => {
                const selected = state.currentTools.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool.id)}
                    className={cn(
                      "rounded-[24px] border p-5 text-left transition",
                      selected ? "border-primary/30 bg-primary/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="display-kicker">{tool.category}</p>
                        <h3 className="title-md mt-3 text-foreground">{tool.name}</h3>
                      </div>
                      <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", selected ? "bg-[hsl(var(--primary))]" : "bg-white/15")} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{tool.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {state.currentStep === 4 ? (
          <div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="display-kicker">Generated workflow</p>
                <h2 className="headline-lg mt-3 text-foreground">Move from idea to release with a clearer path.</h2>
                <p className="body-lg mt-4">
                  {mode === "studio"
                    ? "Keep the process private, or choose whether it appears on your Theatre or a film page in read-only form."
                    : "Save your process and continue it later from Creator Studio."}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-muted-foreground">
                {progressCount} of {state.steps.length} steps complete
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
              <div className="grid gap-5">
                <label className="grid gap-2">
                  <span className="display-kicker text-[0.68rem] text-foreground/85">Workflow title</span>
                  <input
                    value={state.title}
                    onChange={(event) => setState((current) => ({ ...current, title: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
                    placeholder={`${getWorkflowGoalLabel(state.goal)} Workflow`}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="display-kicker text-[0.68rem] text-foreground/85">Description</span>
                  <textarea
                    value={state.description}
                    onChange={(event) => setState((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-28 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
                    placeholder="Optional note about what this workflow is trying to solve."
                  />
                </label>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <p className="display-kicker">Selected inputs</p>
                  <div className="mt-4 grid gap-4 text-sm text-muted-foreground">
                    <div>
                      <p className="text-foreground">Goal</p>
                      <p className="mt-1">{getWorkflowGoalLabel(state.goal)}</p>
                    </div>
                    <div>
                      <p className="text-foreground">Constraints</p>
                      <p className="mt-1">{state.constraints.length > 0 ? state.constraints.map((id) => workflowConstraints.find((item) => item.id === id)?.label ?? id).join(", ") : "None selected"}</p>
                    </div>
                    <div>
                      <p className="text-foreground">Current tools</p>
                      <p className="mt-1">{state.currentTools.length > 0 ? state.currentTools.map((id) => workflowToolCatalog.find((item) => item.id === id)?.name ?? id).join(", ") : "No tools selected"}</p>
                    </div>
                  </div>
                </div>

                {mode === "studio" && signedIn ? (
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                    <p className="display-kicker">Public presentation</p>
                    <div className="mt-4 grid gap-4">
                      <label className="grid gap-2">
                        <span className="text-sm text-foreground">Workflow visibility</span>
                        <select
                          value={state.visibilityScope}
                          onChange={(event) => {
                            const nextScope = event.target.value as WorkflowVisibilityScope;
                            setState((current) => ({
                              ...current,
                              visibilityScope: nextScope,
                              attachedFilmId: requiresFilmAttachment(nextScope) ? current.attachedFilmId : null,
                            }));
                          }}
                          className="h-12 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
                        >
                          {visibilityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm text-muted-foreground">
                          {visibilityOptions.find((option) => option.value === state.visibilityScope)?.description}
                        </span>
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm text-foreground">Attach to film</span>
                        <select
                          value={state.attachedFilmId ?? ""}
                          onChange={(event) => setState((current) => ({ ...current, attachedFilmId: event.target.value || null }))}
                          className="h-12 w-full rounded-2xl border border-white/12 bg-[hsl(var(--surface-2))] px-4 text-sm text-foreground outline-none transition focus:border-primary/60 focus:bg-[hsl(var(--surface-3))]"
                        >
                          <option value="">No film attached</option>
                          {availableFilms.map((film) => (
                            <option key={film.id} value={film.id}>
                              {film.title}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm text-muted-foreground">
                          {requiresFilmAttachment(state.visibilityScope)
                            ? "Required when the workflow is visible on a film page."
                            : "Optional until you decide to show the workflow on a film page."}
                        </span>
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4">
                {state.steps.map((step) => (
                  <WorkflowStepCard
                    key={step.id}
                    step={step}
                    editable
                    onStatusChange={(status) => updateStep(step.id, { status: status as WorkflowStepStatus })}
                    onNotesChange={(notes) => updateStep(step.id, { notes })}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {success}
        </div>
      ) : null}

      {showAuthPrompt && !signedIn ? (
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
          <p className="title-md text-foreground">Save this workflow to your account</p>
          <p className="body-sm mt-3">Sign in or create an account to keep this workflow, reopen it later, and continue editing from Creator Studio.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
        <div className="flex flex-wrap gap-3">
          {state.currentStep > 1 ? (
            <Button type="button" variant="ghost" size="lg" onClick={handlePreviousStep}>
              Back
            </Button>
          ) : null}
          {state.currentStep < 4 ? (
            <Button type="button" size="lg" onClick={handleNextStep}>
              {state.currentStep === 3 ? "Generate workflow" : "Continue"}
            </Button>
          ) : (
            <>
              <Button type="button" variant="ghost" size="lg" onClick={generateWorkflow}>
                Regenerate recommendations
              </Button>
              <Button type="button" size="lg" disabled={isSaving} onClick={() => void handleSave()}>
                {isSaving ? "Saving..." : initialWorkflow ? "Update workflow" : "Save workflow"}
              </Button>
            </>
          )}
        </div>

        {initialWorkflow ? (
          <Button type="button" variant="ghost" size="lg" disabled={isDeleting} onClick={() => void handleArchive()}>
            {isDeleting ? "Archiving..." : "Archive workflow"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
