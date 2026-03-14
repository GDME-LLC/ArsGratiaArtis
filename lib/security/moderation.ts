const GENERIC_MODERATION_MESSAGE = "That text could not be published. Please revise it and try again.";

const obviousUnsafePatterns = [
  /kill yourself/i,
  /telegram/i,
  /whatsapp/i,
  /crypto\s+guarantee/i,
  /buy now/i,
  /free money/i,
];

function countUrls(text: string) {
  const matches = text.match(/https?:\/\//gi);
  return matches ? matches.length : 0;
}

function localModerationHeuristic(text: string) {
  if (countUrls(text) >= 3) {
    return { blocked: true, reason: "spam_links" };
  }

  if (obviousUnsafePatterns.some((pattern) => pattern.test(text))) {
    return { blocked: true, reason: "unsafe_pattern" };
  }

  return { blocked: false };
}

export async function moderateTextFields(fields: Array<{ label: string; value?: string | null }>) {
  const combined = fields
    .map((field) => ({ label: field.label, value: field.value?.trim() ?? "" }))
    .filter((field) => field.value.length > 0);

  if (combined.length === 0) {
    return { ok: true as const };
  }

  for (const field of combined) {
    const heuristic = localModerationHeuristic(field.value);

    if (heuristic.blocked) {
      return {
        ok: false as const,
        message: GENERIC_MODERATION_MESSAGE,
        reason: heuristic.reason,
        field: field.label,
      };
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return { ok: true as const };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODERATION_MODEL || "omni-moderation-latest",
        input: combined.map((field) => `${field.label}: ${field.value}`),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: true as const };
    }

    const payload = (await response.json()) as {
      results?: Array<{
        flagged?: boolean;
      }>;
    };

    const flagged = payload.results?.some((result) => result.flagged);

    if (flagged) {
      return {
        ok: false as const,
        message: GENERIC_MODERATION_MESSAGE,
        reason: "openai_flagged",
      };
    }

    return { ok: true as const };
  } catch {
    return { ok: true as const };
  }
}
