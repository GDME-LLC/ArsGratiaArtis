import type { ToolOption } from "@/types";

import { createServerSupabaseClient } from "@/lib/supabase/server";

function mapTool(tool: Record<string, unknown>): ToolOption {
  return {
    id: String(tool.id),
    name: String(tool.name),
    slug: String(tool.slug),
    category: typeof tool.category === "string" ? tool.category : null,
    description: typeof tool.description === "string" ? tool.description : null,
    websiteUrl: typeof tool.website_url === "string" ? tool.website_url : null,
    isFeatured: Boolean(tool.is_featured),
  };
}

export async function listToolCatalog(): Promise<ToolOption[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tools")
    .select("id, name, slug, category, description, website_url, is_featured")
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((tool) => mapTool(tool as Record<string, unknown>));
}

export async function listToolsBySlugs(slugs: string[]): Promise<ToolOption[]> {
  if (slugs.length === 0) {
    return [];
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tools")
    .select("id, name, slug, category, description, website_url, is_featured")
    .in("slug", slugs);

  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data ?? []).map((tool) => mapTool(tool as Record<string, unknown>));
  const order = new Map(slugs.map((slug, index) => [slug, index]));
  return mapped.sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
}
