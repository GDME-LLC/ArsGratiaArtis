import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envFilePath = path.join(projectRoot, ".env.local");

const visibleSections = ["about", "creative_stack", "featured_work", "releases", "links"];

const identityPacks = [
  {
    key: "afterhours-essayist",
    displayName: "Mara Vale",
    websiteUrl: "https://example.com/mara-vale",
    bio:
      "Mara builds nocturnal essay-films around memory, architecture, and overheard conversations. Her studio language leans intimate, precise, and emotionally withheld until the image breaks open.",
    openingStatement:
      "Quiet films for people who notice the fluorescent hum after everyone else has gone home.",
    creativeProcessSummary:
      "A documentary eye filtered through fiction blocking, city sound beds, and restrained voiceover. Cuts stay patient until a location starts speaking back.",
    avatarPhotoId: "IF9TK5Uy-KI",
    avatarSourcePage: "https://unsplash.com/photos/IF9TK5Uy-KI",
    avatarCredit: "Jake Nackos",
    bannerPhotoId: "2FbpJhYdK2Y",
    bannerSourcePage: "https://unsplash.com/photos/2FbpJhYdK2Y",
    bannerCredit: "Yianni Mathioudakis",
    posterPhotoIds: ["zoCNlT903hs", "DQy1kkyMAaI", "aMZ0jM7Agns"],
  },
  {
    key: "luminous-realist",
    displayName: "Nia Okoye",
    websiteUrl: "https://example.com/nia-okoye",
    bio:
      "Nia directs character-led dramas with a fashion image-maker's sensitivity to texture and silhouette. Her pages should feel warm, self-possessed, and unmistakably contemporary.",
    openingStatement:
      "I make close-up cinema about confidence, reinvention, and the cost of being seen clearly.",
    creativeProcessSummary:
      "Performance comes first, then color, then rhythm. Scripts are rewritten from wardrobe tests, still photography, and the emotional temperature of each set.",
    avatarPhotoId: "9kQBQqY_xrk",
    avatarSourcePage: "https://unsplash.com/photos/9kQBQqY_xrk",
    avatarCredit: "Clive Thibela",
    bannerPhotoId: "1Jzdpk8oV8M",
    bannerSourcePage: "https://unsplash.com/photos/1Jzdpk8oV8M",
    bannerCredit: "Liana S",
    posterPhotoIds: ["Ad-tezcyTZg", "gMymJ1gtQMU", "WypAvvDth5c"],
  },
  {
    key: "monochrome-poet",
    displayName: "Elio Serrano",
    websiteUrl: "https://example.com/elio-serrano",
    bio:
      "Elio's work sits between portraiture and parable: monochrome faces, spare environments, and narratives that reveal themselves by omission rather than exposition.",
    openingStatement:
      "Every frame should feel like it remembers more than it says.",
    creativeProcessSummary:
      "He develops projects from still frames, rehearsal transcripts, and contrast studies. The final cut favors negative space, backlight, and quiet tension over overt plot mechanics.",
    avatarPhotoId: "MeD_q1TMZYE",
    avatarSourcePage: "https://unsplash.com/photos/MeD_q1TMZYE",
    avatarCredit: "Kunal Tangal",
    bannerPhotoId: "F-yJZv8nKTM",
    bannerSourcePage: "https://unsplash.com/photos/F-yJZv8nKTM",
    bannerCredit: "Saifee Art",
    posterPhotoIds: ["qtnSdsldjNM", "P82xoqgfL7Q", "WypAvvDth5c"],
  },
  {
    key: "intimate-archive",
    displayName: "Sana Verdin",
    websiteUrl: "https://example.com/sana-verdin",
    bio:
      "Sana approaches filmmaking like an archive in progress, pairing tactile close-ups with reflective narration and emotionally direct portraiture.",
    openingStatement:
      "I chase the moment when a face stops posing and starts testifying.",
    creativeProcessSummary:
      "Projects begin with interviews, wardrobe palettes, and texture boards. Editorial choices preserve breath, glances, and the friction between vulnerability and performance.",
    avatarPhotoId: "r0bH4hAVBmk",
    avatarSourcePage: "https://unsplash.com/photos/r0bH4hAVBmk",
    avatarCredit: "Gabriel Ogulu",
    bannerPhotoId: "DQHROgp43RQ",
    bannerSourcePage: "https://unsplash.com/photos/DQHROgp43RQ",
    bannerCredit: "Liana S",
    posterPhotoIds: ["IB19s-LMuZM", "2FbpJhYdK2Y", "Ad-tezcyTZg"],
  },
];

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function getEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

function parseArgs(argv) {
  const options = {
    handles: [],
    apply: false,
    force: false,
    withFilmPosters: false,
  };

  for (const argument of argv) {
    if (argument.startsWith("--handles=")) {
      options.handles = argument
        .slice("--handles=".length)
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      continue;
    }

    if (argument === "--apply") {
      options.apply = true;
      continue;
    }

    if (argument === "--force") {
      options.force = true;
      continue;
    }

    if (argument === "--with-film-posters") {
      options.withFilmPosters = true;
    }
  }

  return options;
}

function buildUnsplashUrl(photoId, params) {
  const searchParams = new URLSearchParams({
    force: "true",
    q: "80",
    auto: "format",
    fit: params.fit,
    w: String(params.width),
  });

  if (params.height) {
    searchParams.set("h", String(params.height));
  }

  if (params.crop) {
    searchParams.set("crop", params.crop);
  }

  return `https://unsplash.com/photos/${photoId}/download?${searchParams.toString()}`;
}

function buildTheatreSettings(pack) {
  return {
    heroImageUrl: buildUnsplashUrl(pack.bannerPhotoId, {
      width: 1800,
      height: 960,
      fit: "crop",
    }),
    heroVideoUrl: null,
    openingStatement: pack.openingStatement,
    featuredFilmId: null,
    preferredToolSlugs: [],
    creativeProcessSummary: pack.creativeProcessSummary,
    visibleSections,
    sectionOrder: visibleSections,
  };
}

function buildProfileUpdate(pack) {
  return {
    display_name: pack.displayName,
    bio: pack.bio,
    avatar_url: buildUnsplashUrl(pack.avatarPhotoId, {
      width: 640,
      height: 640,
      fit: "crop",
      crop: "faces",
    }),
    banner_url: buildUnsplashUrl(pack.bannerPhotoId, {
      width: 1800,
      height: 1100,
      fit: "crop",
    }),
    website_url: pack.websiteUrl,
    is_public: true,
    is_creator: true,
    theatre_settings: buildTheatreSettings(pack),
  };
}

function shouldSkipProfile(profile, force) {
  if (force) {
    return false;
  }

  return Boolean(
    (profile.bio && String(profile.bio).trim()) ||
      (profile.avatar_url && String(profile.avatar_url).trim()) ||
      (profile.banner_url && String(profile.banner_url).trim()) ||
      (profile.website_url && String(profile.website_url).trim()),
  );
}

function printUsage() {
  console.log(
    [
      "Usage:",
      "  npm run seed:mock-creators -- --handles=creator_one,creator_two [--apply] [--force] [--with-film-posters]",
      "",
      "Notes:",
      "  --handles is required and limits changes to those exact profile handles.",
      "  Dry-run is the default. Add --apply to write changes.",
      "  Existing populated profiles are skipped unless you pass --force.",
      "  --with-film-posters also replaces poster_url on films owned by those mock creators.",
    ].join("\n"),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.handles.length === 0) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const fileEnv = loadDotEnvFile(envFilePath);
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL", fileEnv.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", fileEnv.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local or the shell environment.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, handle, display_name, bio, avatar_url, banner_url, website_url")
    .in("handle", args.handles)
    .order("created_at", { ascending: true });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [String(profile.handle).toLowerCase(), profile]));
  const missingHandles = args.handles.filter((handle) => !profileMap.has(handle));

  if (missingHandles.length > 0) {
    throw new Error(`Profiles not found for handles: ${missingHandles.join(", ")}`);
  }

  const plannedProfiles = args.handles.map((handle, index) => {
    const profile = profileMap.get(handle);
    const pack = identityPacks[index % identityPacks.length];

    return {
      handle,
      profile,
      pack,
      update: buildProfileUpdate(pack),
      skipped: shouldSkipProfile(profile, args.force),
    };
  });

  console.log("Mock creator profile plan:\n");
  for (const entry of plannedProfiles) {
    console.log(
      [
        `- @${entry.handle} -> ${entry.pack.displayName} (${entry.pack.key})${entry.skipped ? " [skip: already populated]" : ""}`,
        `  avatar: ${entry.pack.avatarSourcePage} (${entry.pack.avatarCredit})`,
        `  banner: ${entry.pack.bannerSourcePage} (${entry.pack.bannerCredit})`,
      ].join("\n"),
    );
  }

  if (!args.apply) {
    console.log("\nDry run only. Re-run with --apply to write profile changes.");
    return;
  }

  for (const entry of plannedProfiles) {
    if (entry.skipped) {
      continue;
    }

    const { error } = await supabase
      .from("profiles")
      .update(entry.update)
      .eq("id", entry.profile.id);

    if (error) {
      throw new Error(`Failed to update @${entry.handle}: ${error.message}`);
    }
  }

  if (args.withFilmPosters) {
    for (const entry of plannedProfiles) {
      const { data: films, error: filmsError } = await supabase
        .from("films")
        .select("id, slug")
        .eq("creator_id", entry.profile.id)
        .order("created_at", { ascending: true });

      if (filmsError) {
        throw new Error(`Failed to list films for @${entry.handle}: ${filmsError.message}`);
      }

      for (const [index, film] of (films ?? []).entries()) {
        const posterPhotoId = entry.pack.posterPhotoIds[index % entry.pack.posterPhotoIds.length];
        const posterUrl = buildUnsplashUrl(posterPhotoId, {
          width: 1200,
          height: 1500,
          fit: "crop",
        });

        const { error } = await supabase
          .from("films")
          .update({ poster_url: posterUrl })
          .eq("id", film.id);

        if (error) {
          throw new Error(`Failed to update poster for film ${film.slug}: ${error.message}`);
        }
      }
    }
  }

  console.log("\nSeed complete.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
