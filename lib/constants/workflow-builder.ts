import type {
  WorkflowConstraintId,
  WorkflowGoalId,
  WorkflowStepDraft,
  WorkflowToolId,
} from "@/types";

export const workflowGoals = [
  {
    id: "first_short_film",
    label: "First short film",
    description: "A clean path from first concept to a finished, publishable short.",
  },
  {
    id: "better_consistency",
    label: "Better consistency",
    description: "Tighten visual continuity, performance language, and world coherence.",
  },
  {
    id: "cleaner_edit",
    label: "Cleaner edit",
    description: "Reduce drift in pacing and shape the material into a more disciplined film.",
  },
  {
    id: "festival_ready_release",
    label: "Festival-ready release",
    description: "Aim for a more finished presentation, stronger polish, and a clearer release package.",
  },
  {
    id: "social_teaser_campaign",
    label: "Social teaser campaign",
    description: "Build a short sequence of assets that can introduce the work publicly with intent.",
  },
] as const satisfies Array<{
  id: WorkflowGoalId;
  label: string;
  description: string;
}>;

export const workflowConstraints = [
  {
    id: "beginner_friendly",
    label: "Beginner-friendly",
    description: "Keep the path understandable and reduce unnecessary complexity.",
  },
  {
    id: "limited_budget",
    label: "Limited budget",
    description: "Favor lean, efficient tools and practical tradeoffs.",
  },
  {
    id: "fast_turnaround",
    label: "Fast turnaround",
    description: "Prioritize speed, momentum, and clear decision points.",
  },
  {
    id: "highest_quality",
    label: "Highest quality",
    description: "Give more room to refinement, iteration, and finishing discipline.",
  },
  {
    id: "solo_creator",
    label: "Solo creator",
    description: "Assume one person is directing the process end-to-end.",
  },
] as const satisfies Array<{
  id: WorkflowConstraintId;
  label: string;
  description: string;
}>;

export const workflowToolCatalog = [
  {
    id: "midjourney",
    name: "Midjourney",
    category: "image",
    description: "Look development, mood references, frames, and world-building.",
    strengths: ["style exploration", "look packs", "poster direction"],
    bestFor: ["define_short", "build_look_pack", "prepare_release_assets"],
    href: "https://www.midjourney.com",
  },
  {
    id: "runway",
    name: "Runway",
    category: "video",
    description: "Proof-of-concept motion, shot experiments, and cleanup passes.",
    strengths: ["fast motion tests", "shot extension", "iteration"],
    bestFor: ["generate_proof_of_concept_shots", "test_motion_pass", "social_campaign_cut"],
    href: "https://runwayml.com",
  },
  {
    id: "kling",
    name: "Kling",
    category: "video",
    description: "Motion generation and stylized shot development.",
    strengths: ["motion studies", "stylized shots", "visual experimentation"],
    bestFor: ["generate_proof_of_concept_shots", "test_motion_pass"],
    href: "https://klingai.com",
  },
  {
    id: "sora",
    name: "Sora",
    category: "video",
    description: "Higher-level cinematic generation and structured visual ideation.",
    strengths: ["ambitious visual ideation", "cinematic motion", "conceptual sequences"],
    bestFor: ["generate_proof_of_concept_shots", "test_motion_pass"],
    href: "https://openai.com/sora",
  },
  {
    id: "premiere_pro",
    name: "Premiere Pro",
    category: "editing",
    description: "Editorial assembly, pacing, and campaign cut refinement.",
    strengths: ["editing", "trailers", "iterative rough cuts"],
    bestFor: ["lock_edit_structure", "prepare_release_assets", "social_campaign_cut"],
    href: "https://www.adobe.com/products/premiere.html",
  },
  {
    id: "davinci_resolve",
    name: "DaVinci Resolve",
    category: "editing",
    description: "Editing, grading, audio, and finishing in one environment.",
    strengths: ["finish", "grade", "sound polish"],
    bestFor: ["lock_edit_structure", "sound_and_finish", "festival_release_package"],
    href: "https://www.blackmagicdesign.com/products/davinciresolve",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    category: "audio",
    description: "Temp dialogue, narration, and voice experimentation.",
    strengths: ["scratch voice", "narration", "temp dialogue"],
    bestFor: ["define_short", "sound_and_finish", "social_campaign_cut"],
    href: "https://elevenlabs.io",
  },
  {
    id: "suno",
    name: "Suno",
    category: "audio",
    description: "Quick music sketches and tonal pacing references.",
    strengths: ["music sketches", "mood pacing", "campaign music"],
    bestFor: ["sound_and_finish", "social_campaign_cut"],
    href: "https://suno.com",
  },
  {
    id: "none_yet",
    name: "None yet",
    category: "starting_point",
    description: "Start with a lean recommendation set and build from there.",
    strengths: ["clarity", "simplicity"],
    bestFor: ["define_short"],
    href: null,
  },
] as const;

const workflowStepBlueprints = [
  {
    id: "define_short",
    title: "Define the short",
    description: "Lock the premise, the emotional target, and the single most important constraint before making anything.",
    whyItMatters: "A precise beginning prevents expensive visual drift later in the workflow.",
    toolMatches: ["midjourney", "elevenlabs"],
    alternateMatches: ["none_yet"],
  },
  {
    id: "build_look_pack",
    title: "Build a look pack",
    description: "Assemble a small visual bible with palette, lens language, production design, and reference frames.",
    whyItMatters: "A controlled visual reference layer is the fastest way to improve consistency.",
    toolMatches: ["midjourney"],
    alternateMatches: ["runway", "sora"],
  },
  {
    id: "generate_proof_of_concept_shots",
    title: "Generate proof-of-concept shots",
    description: "Create a limited set of key images or motion tests that prove tone before full production begins.",
    whyItMatters: "Testing a few shots first exposes weak prompts, weak continuity, and weak pacing assumptions.",
    toolMatches: ["runway", "kling", "sora"],
    alternateMatches: ["midjourney"],
  },
  {
    id: "test_motion_pass",
    title: "Test motion pass",
    description: "Run motion variations on the strongest frames and evaluate what holds up in sequence rather than in isolation.",
    whyItMatters: "Good stills do not automatically become convincing motion. This is where that becomes obvious.",
    toolMatches: ["runway", "kling", "sora"],
    alternateMatches: ["premiere_pro"],
  },
  {
    id: "lock_edit_structure",
    title: "Lock edit structure",
    description: "Cut the material into a real sequence and identify exactly what must be regenerated or tightened.",
    whyItMatters: "Editorial structure converts experiments into a film with rhythm and point of view.",
    toolMatches: ["davinci_resolve", "premiere_pro"],
    alternateMatches: ["elevenlabs"],
  },
  {
    id: "sound_and_finish",
    title: "Sound and finish",
    description: "Add scratch or final voice, refine music choices, and bring the image toward a coherent finish.",
    whyItMatters: "Sound decisions often determine whether the work feels intentional or provisional.",
    toolMatches: ["davinci_resolve", "elevenlabs", "suno"],
    alternateMatches: ["premiere_pro"],
  },
  {
    id: "prepare_release_assets",
    title: "Prepare release assets",
    description: "Shape the poster, synopsis, title treatment, and supporting materials for publication.",
    whyItMatters: "A finished release deserves framing, not just export.",
    toolMatches: ["midjourney", "premiere_pro", "davinci_resolve"],
    alternateMatches: ["runway"],
  },
  {
    id: "publish_on_arsgratia",
    title: "Publish on ArsGratia",
    description: "Upload the work, present it with intention, and decide how much process should accompany the release.",
    whyItMatters: "Publishing is part of directing the work. Presentation shapes how the film lands.",
    toolMatches: [],
    alternateMatches: [],
  },
] as const;

type WorkflowSelectionInput = {
  goal: WorkflowGoalId;
  constraints: WorkflowConstraintId[];
  currentTools: WorkflowToolId[];
};

function includesConstraint(constraints: WorkflowConstraintId[], constraint: WorkflowConstraintId) {
  return constraints.includes(constraint);
}

function prioritizeTools(preferred: readonly WorkflowToolId[], selectedTools: WorkflowToolId[]) {
  const usableSelectedTools = selectedTools.filter((toolId): toolId is Exclude<WorkflowToolId, "none_yet"> => toolId !== "none_yet");
  const matchingSelected = preferred.filter((toolId): toolId is Exclude<WorkflowToolId, "none_yet"> => toolId !== "none_yet" && usableSelectedTools.includes(toolId));
  const remainingPreferred = preferred.filter((toolId) => !matchingSelected.includes(toolId as Exclude<WorkflowToolId, "none_yet">));
  return [...matchingSelected, ...remainingPreferred].slice(0, 3);
}

function buildStepDescription(stepId: string, input: WorkflowSelectionInput, baseDescription: string) {
  switch (input.goal) {
    case "festival_ready_release":
      if (stepId === "sound_and_finish") {
        return "Give more time to mix, grade, and polish so the release feels considered and exhibition-ready.";
      }
      if (stepId === "prepare_release_assets") {
        return "Build the release materials with the same discipline as the film: poster, synopsis, stills, and title treatment.";
      }
      break;
    case "social_teaser_campaign":
      if (stepId === "prepare_release_assets") {
        return "Prepare teaser frames, short cutdowns, and graphic assets that can travel well across social surfaces.";
      }
      if (stepId === "publish_on_arsgratia") {
        return "Publish the core work on ArsGratia, then use the surrounding campaign assets to draw viewers back to the release page.";
      }
      break;
    case "better_consistency":
      if (stepId === "build_look_pack") {
        return "Make the look pack more specific than usual: character continuity, lighting rules, and recurring design anchors.";
      }
      break;
    case "cleaner_edit":
      if (stepId === "lock_edit_structure") {
        return "Cut earlier, cut harder, and let editorial choices decide what deserves another generation pass.";
      }
      break;
    default:
      break;
  }

  if (includesConstraint(input.constraints, "fast_turnaround") && stepId === "generate_proof_of_concept_shots") {
    return "Limit the test pass to only a few high-value shots so momentum stays high and you learn quickly.";
  }

  if (includesConstraint(input.constraints, "beginner_friendly") && stepId === "define_short") {
    return "Start with one sentence, one tone reference, and one hard constraint so the process stays legible.";
  }

  if (includesConstraint(input.constraints, "limited_budget") && stepId === "sound_and_finish") {
    return "Use lightweight finishing choices that improve cohesion without multiplying subscriptions or tool overhead.";
  }

  return baseDescription;
}

function buildWhyItMatters(stepId: string, input: WorkflowSelectionInput, baseWhy: string) {
  if (input.goal === "social_teaser_campaign" && stepId === "prepare_release_assets") {
    return "Campaign fragments should feel like part of the same film, not detached marketing leftovers.";
  }

  if (includesConstraint(input.constraints, "solo_creator") && stepId === "lock_edit_structure") {
    return "A solo workflow needs decisive checkpoints so energy goes into the strongest material, not every possible variation.";
  }

  if (includesConstraint(input.constraints, "highest_quality") && stepId === "test_motion_pass") {
    return "Quality is usually won in the comparison phase, where weaker motion is discarded before the final edit locks.";
  }

  return baseWhy;
}

export function generateWorkflowFromSelections(input: WorkflowSelectionInput): WorkflowStepDraft[] {
  return workflowStepBlueprints.map((blueprint, index) => {
    const recommendedTools = prioritizeTools(blueprint.toolMatches, input.currentTools);
    const alternateTools = prioritizeTools(blueprint.alternateMatches, input.currentTools).filter(
      (toolId) => !recommendedTools.includes(toolId),
    );

    return {
      id: blueprint.id,
      stepNumber: index + 1,
      title: blueprint.title,
      description: buildStepDescription(blueprint.id, input, blueprint.description),
      whyItMatters: buildWhyItMatters(blueprint.id, input, blueprint.whyItMatters),
      recommendedTools,
      alternateTools,
      status: "not_started",
      notes: "",
    };
  });
}

export function getWorkflowGoalLabel(goalId: WorkflowGoalId) {
  return workflowGoals.find((goal) => goal.id === goalId)?.label ?? "Workflow";
}

export function getWorkflowConstraintLabel(constraintId: WorkflowConstraintId) {
  return workflowConstraints.find((constraint) => constraint.id === constraintId)?.label ?? constraintId;
}

export function getWorkflowToolMeta(toolId: WorkflowToolId) {
  return workflowToolCatalog.find((tool) => tool.id === toolId) ?? null;
}