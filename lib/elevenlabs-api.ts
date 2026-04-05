const ELEVENLABS_BASE = "https://api.elevenlabs.io";

export type ElevenLabsUser = {
  subscription: {
    character_count: number;
    character_limit: number;
    status: string;
  };
};

export type ElevenLabsHistoryItem = {
  history_item_id: string;
  voice_id: string;
  voice_name: string;
  text: string;
  date_unix: number;
  content_type: string;
  state: string;
  settings: Record<string, unknown> | null;
};

export type ElevenLabsHistoryResponse = {
  history: ElevenLabsHistoryItem[];
  last_history_item_id: string;
  has_more: boolean;
};

function headers(apiKey: string) {
  return { "xi-api-key": apiKey, "Content-Type": "application/json" };
}

export async function validateElevenLabsKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${ELEVENLABS_BASE}/v1/user`, {
      headers: headers(apiKey),
    });

    if (res.status === 401) return { ok: false, error: "Invalid API key." };
    if (!res.ok) return { ok: false, error: `ElevenLabs responded with status ${res.status}.` };

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach ElevenLabs. Please try again." };
  }
}

export async function listElevenLabsHistory(
  apiKey: string,
  pageSize = 30
): Promise<{ items: ElevenLabsHistoryItem[]; error?: string }> {
  try {
    const url = `${ELEVENLABS_BASE}/v1/history?page_size=${pageSize}`;
    const res = await fetch(url, { headers: headers(apiKey) });

    if (!res.ok) return { items: [], error: `ElevenLabs responded with status ${res.status}.` };

    const data = (await res.json()) as ElevenLabsHistoryResponse;
    return { items: data.history ?? [] };
  } catch {
    return { items: [], error: "Could not fetch ElevenLabs history." };
  }
}

export function getElevenLabsAudioUrl(historyItemId: string): string {
  return `${ELEVENLABS_BASE}/v1/history/${historyItemId}/audio`;
}
