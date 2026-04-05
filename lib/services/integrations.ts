import { validateElevenLabsKey } from "@/lib/elevenlabs-api";
import { validateRunwayKey } from "@/lib/runway-api";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import type { CreatorIntegration, IntegrationPlatform } from "@/types";

type IntegrationRow = {
  id: string;
  creator_id: string;
  platform: IntegrationPlatform;
  api_key: string;
  is_active: boolean;
  connected_at: string;
  last_used_at: string | null;
  last_synced_at: string | null;
};

function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

function mapIntegration(row: IntegrationRow): CreatorIntegration {
  return {
    id: row.id,
    creatorId: row.creator_id,
    platform: row.platform,
    maskedApiKey: maskApiKey(row.api_key),
    isActive: row.is_active,
    connectedAt: row.connected_at,
    lastUsedAt: row.last_used_at,
    lastSyncedAt: row.last_synced_at ?? null,
  };
}

async function validateApiKey(
  platform: IntegrationPlatform,
  apiKey: string
): Promise<{ ok: boolean; error?: string }> {
  if (platform === "elevenlabs") return validateElevenLabsKey(apiKey);
  if (platform === "runway") return validateRunwayKey(apiKey);
  return { ok: false, error: "Unknown platform." };
}

export async function listCreatorIntegrations(creatorId: string): Promise<CreatorIntegration[]> {
  const serviceClient = createServiceRoleSupabaseClient();

  if (!serviceClient) return [];

  const { data, error } = await serviceClient
    .from("creator_integrations")
    .select("id, creator_id, platform, api_key, is_active, connected_at, last_used_at, last_synced_at")
    .eq("creator_id", creatorId)
    .order("connected_at", { ascending: true });

  if (error || !data) return [];

  return (data as IntegrationRow[]).map(mapIntegration);
}

export async function connectIntegration(
  creatorId: string,
  platform: IntegrationPlatform,
  apiKey: string
): Promise<{ integration: CreatorIntegration | null; error?: string }> {
  const trimmedKey = apiKey.trim();

  if (!trimmedKey || trimmedKey.length < 8 || trimmedKey.length > 512) {
    return { integration: null, error: "API key must be between 8 and 512 characters." };
  }

  const validation = await validateApiKey(platform, trimmedKey);

  if (!validation.ok) {
    return { integration: null, error: validation.error ?? "API key validation failed." };
  }

  const serviceClient = createServiceRoleSupabaseClient();

  if (!serviceClient) {
    return { integration: null, error: "Service unavailable." };
  }

  const { data, error } = await serviceClient
    .from("creator_integrations")
    .upsert(
      {
        creator_id: creatorId,
        platform,
        api_key: trimmedKey,
        is_active: true,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "creator_id,platform" }
    )
    .select("id, creator_id, platform, api_key, is_active, connected_at, last_used_at, last_synced_at")
    .single();

  if (error || !data) {
    return { integration: null, error: error?.message ?? "Could not save integration." };
  }

  return { integration: mapIntegration(data as IntegrationRow) };
}

export async function disconnectIntegration(
  creatorId: string,
  platform: IntegrationPlatform
): Promise<{ ok: boolean; error?: string }> {
  const serviceClient = createServiceRoleSupabaseClient();

  if (!serviceClient) {
    return { ok: false, error: "Service unavailable." };
  }

  const { error } = await serviceClient
    .from("creator_integrations")
    .delete()
    .eq("creator_id", creatorId)
    .eq("platform", platform);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Server-side only — returns raw API key for making platform API calls. Never expose to client. */
export async function getCreatorApiKey(
  creatorId: string,
  platform: IntegrationPlatform
): Promise<string | null> {
  const serviceClient = createServiceRoleSupabaseClient();

  if (!serviceClient) return null;

  const { data, error } = await serviceClient
    .from("creator_integrations")
    .select("api_key, last_used_at")
    .eq("creator_id", creatorId)
    .eq("platform", platform)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  // Update last_used_at asynchronously — fire and forget
  void serviceClient
    .from("creator_integrations")
    .update({ last_used_at: new Date().toISOString() })
    .eq("creator_id", creatorId)
    .eq("platform", platform);

  return (data as { api_key: string }).api_key;
}
