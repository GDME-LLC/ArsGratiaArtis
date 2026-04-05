const RUNWAY_BASE = "https://api.dev.runwayml.com";
const RUNWAY_VERSION = "2024-11-06";

export type RunwayTask = {
  id: string;
  name: string | null;
  status: "PENDING" | "THROTTLED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  progressRatio: number | null;
  options: Array<{ name: string; value: unknown }> | null;
  output: string[] | null;
  outputMimeType: string | null;
};

export type RunwayTaskListResponse = {
  tasks: RunwayTask[];
  nextPage: string | null;
};

function headers(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "X-Runway-Version": RUNWAY_VERSION,
    "Content-Type": "application/json",
  };
}

export async function validateRunwayKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${RUNWAY_BASE}/v1/tasks?maxResults=1`, {
      headers: headers(apiKey),
    });

    if (res.status === 401 || res.status === 403) return { ok: false, error: "Invalid API key." };
    if (!res.ok) return { ok: false, error: `Runway responded with status ${res.status}.` };

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach Runway. Please try again." };
  }
}

export async function listRunwayTasks(
  apiKey: string,
  maxResults = 30
): Promise<{ tasks: RunwayTask[]; error?: string }> {
  try {
    const url = `${RUNWAY_BASE}/v1/tasks?maxResults=${maxResults}`;
    const res = await fetch(url, { headers: headers(apiKey) });

    if (!res.ok) return { tasks: [], error: `Runway responded with status ${res.status}.` };

    const data = (await res.json()) as RunwayTaskListResponse;
    const succeeded = (data.tasks ?? []).filter((t) => t.status === "SUCCEEDED" && t.output?.length);
    return { tasks: succeeded };
  } catch {
    return { tasks: [], error: "Could not fetch Runway tasks." };
  }
}
