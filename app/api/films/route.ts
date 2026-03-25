import { NextResponse } from "next/server";

import { MAX_TOOL_SELECTIONS, FILM_PROCESS_SUMMARY_LIMIT, normalizeProcessTags } from "@/lib/constants/process";
import { isFilmCategory } from "@/lib/films/categories";
import { ensureProfileForUser } from "@/lib/profiles";
import { isValidFilmSlug, normalizeSlug } from "@/lib/films/slug";
import { moderateTextFields } from "@/lib/security/moderation";
import { enforceRateLimit, getRequestIp, rateLimitPresets } from "@/lib/security/rate-limit";
import { createOrUpdateFilm } from "@/lib/services/films";
import {
  createServerSupabaseClient,
  hasSupabaseServerEnv,
} from "@/lib/supabase/server";

type FilmPayload = {
  id?: string;
  title?: string;
  slug?: string;
  synopsis?: string | null;
  description?: string | null;
  category?: string;
  poster_url?: string | null;
  prompt_text?: string | null;
  process_summary?: string | null;
  process_notes?: string | null;
  process_tags?: unknown;
  tool_ids?: unknown;
  prompt_visibility?: "public" | "followers" | "private";
  visibility?: "public" | "unlisted" | "private";
  publish_status?: "draft" | "published" | "archived";
};

async function saveFilm(request: Request, method: "POST" | "PUT") {
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

  if (!profile.isCreator) {
    return NextResponse.json(
      { error: "Enable creator mode in settings before creating or editing films." },
      { status: 403 },
    );
  }

  const ip = await getRequestIp();
  const rateLimit = await enforceRateLimit({
    ...rateLimitPresets.films,
    key: `films:${ip}:${profile.id}`,
  });

  if (!rateLimit.ok) {
    return NextResponse.json({ error: rateLimit.message }, { status: rateLimit.status });
  }

  const payload = (await request.json()) as FilmPayload;
  const title = payload.title?.trim() ?? "";
  const slug = normalizeSlug(payload.slug || title);
  const visibility = payload.visibility ?? "private";
  const publishStatus = payload.publish_status ?? "draft";
  const promptVisibility = payload.prompt_visibility ?? "private";
  const category = payload.category ?? "film";
  const processSummary = payload.process_summary?.trim() || null;
  const processNotes = payload.process_notes?.trim() || null;
  const processTags = normalizeProcessTags(payload.process_tags);
  const toolIds = Array.isArray(payload.tool_ids)
    ? [...new Set(payload.tool_ids.filter((value): value is string => typeof value === "string" && value.trim().length > 0).map((value) => value.trim()))].slice(0, MAX_TOOL_SELECTIONS)
    : [];

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (!slug || !isValidFilmSlug(slug)) {
    return NextResponse.json({ error: "Slug format is invalid." }, { status: 400 });
  }

  if (!isFilmCategory(category)) {
    return NextResponse.json({ error: "Category is invalid." }, { status: 400 });
  }

  if (processSummary && processSummary.length > FILM_PROCESS_SUMMARY_LIMIT) {
    return NextResponse.json({ error: `Process summary must be ${FILM_PROCESS_SUMMARY_LIMIT} characters or fewer.` }, { status: 400 });
  }

  const moderation = await moderateTextFields([
    { label: "title", value: title },
    { label: "synopsis", value: payload.synopsis ?? null },
    { label: "description", value: payload.description ?? null },
    { label: "process_summary", value: processSummary },
    { label: "process_notes", value: processNotes },
  ]);

  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.message }, { status: 400 });
  }

  if (method === "PUT" && !payload.id) {
    return NextResponse.json({ error: "Film id is required for updates." }, { status: 400 });
  }

  try {
    const film = await createOrUpdateFilm({
      filmId: payload.id,
      creator: profile,
      title,
      slug,
      synopsis: payload.synopsis?.trim() || null,
      description: payload.description?.trim() || null,
      category,
      posterUrl: payload.poster_url?.trim() || null,
      promptText: payload.prompt_text?.trim() || null,
      processSummary,
      processNotes,
      processTags,
      toolIds,
      promptVisibility,
      visibility,
      publishStatus,
    });

    return NextResponse.json({ film });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Film could not be saved." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  return saveFilm(request, "POST");
}

export async function PUT(request: Request) {
  return saveFilm(request, "PUT");
}

