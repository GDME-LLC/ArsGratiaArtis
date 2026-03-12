import { NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/profiles";
import { isValidFilmSlug, normalizeSlug } from "@/lib/films/slug";
import {
  createOrUpdateFilm,
} from "@/lib/services/films";
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
  poster_url?: string | null;
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

  const payload = (await request.json()) as FilmPayload;
  const title = payload.title?.trim() ?? "";
  const slug = normalizeSlug(payload.slug || title);
  const visibility = payload.visibility ?? "private";
  const publishStatus = payload.publish_status ?? "draft";

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (!slug || !isValidFilmSlug(slug)) {
    return NextResponse.json({ error: "Slug format is invalid." }, { status: 400 });
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
      posterUrl: payload.poster_url?.trim() || null,
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
