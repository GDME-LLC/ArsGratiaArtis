import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envFilePath = path.join(projectRoot, ".env.local");

const visibleSections = ["about", "creative_stack", "featured_work", "releases", "links"];
const RELEASE_DAY_MS = 24 * 60 * 60 * 1000;

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
    releases: [
      {
        title: "Velvet Comet",
        slug: "velvet-comet",
        category: "film",
        synopsis: "A woman returns to a city of mirrored facades and realizes every reunion is really an edited memory.",
        description:
          "A nocturnal character study about architecture, longing, and the private fictions people use to walk back into their own past.",
        posterPhotoId: "zoCNlT903hs",
        daysAgo: 33,
      },
      {
        title: "Mercury Choir",
        slug: "mercury-choir",
        category: "film",
        synopsis: "An essay-film on apartment-window rituals, voicemail archives, and the thin line between witness and trespass.",
        description:
          "Built from patient observation and restrained narration, the piece treats city light like a language someone forgot how to speak aloud.",
        posterPhotoId: "DQy1kkyMAaI",
        daysAgo: 29,
      },
      {
        title: "Static Liturgy",
        slug: "static-liturgy",
        category: "experimental",
        synopsis: "A drifting collage of fluorescent corridors, empty lobbies, and devotional fragments recorded after midnight.",
        description:
          "Designed for Beyond Cinema, this release turns transitional spaces into a quiet ritual of grain, echo, and urban afterimage.",
        posterPhotoId: "aMZ0jM7Agns",
        daysAgo: 11,
      },
      {
        title: "Late Platform Journal",
        slug: "late-platform-journal",
        category: "short",
        synopsis: "A twelve-minute diary about missed trains, accidental intimacy, and the architecture of waiting.",
        description:
          "Short-form and intimate, the piece folds passing faces and station ambience into a compact portrait of urban solitude.",
        posterPhotoId: "2FbpJhYdK2Y",
        daysAgo: 6,
      },
    ],
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
    releases: [
      {
        title: "The Last Orchard on Ceres",
        slug: "the-last-orchard-on-ceres",
        category: "film",
        synopsis: "A poised coming-of-age drama about inheritance, ambition, and the image a daughter agrees to perform.",
        description:
          "Warmly lit but emotionally exacting, the film follows a young lead balancing family myth with the cost of self-authorship.",
        posterPhotoId: "WypAvvDth5c",
        daysAgo: 31,
      },
      {
        title: "Paper Moons for the Sleeping City",
        slug: "paper-moons-for-the-sleeping-city",
        category: "film",
        synopsis: "Two siblings reinvent themselves during a week of castings, afterparties, and private betrayals.",
        description:
          "A sleek chamber drama where style, performance, and intimacy keep shifting places until no one remembers who started acting first.",
        posterPhotoId: "Ad-tezcyTZg",
        daysAgo: 27,
      },
      {
        title: "Signal Fires: Episode 1 - White Relay",
        slug: "signal-fires-episode-1-white-relay",
        category: "film",
        synopsis: "The pilot episode of a fashion-world serial about image control, coded desire, and a vanished creative director.",
        description:
          "The first chapter introduces a circle of collaborators whose polished surfaces start cracking under scrutiny and rumor.",
        posterPhotoId: "Ad-tezcyTZg",
        daysAgo: 24,
      },
      {
        title: "Signal Fires: Episode 2 - Horizon Code",
        slug: "signal-fires-episode-2-horizon-code",
        category: "film",
        synopsis: "A campaign launch spirals into a public unraveling as loyalties shift in real time.",
        description:
          "The series continues with a sharper turn toward surveillance, branding, and the private calculus behind public grace.",
        posterPhotoId: "gMymJ1gtQMU",
        daysAgo: 23,
      },
      {
        title: "Fourth Look Test",
        slug: "fourth-look-test",
        category: "commercial",
        synopsis: "A luxury-fashion campaign short where each wardrobe change reveals a different version of power.",
        description:
          "Conceived as a commercial piece for the Beyond Cinema shelf, it merges editorial movement with a narrative of self-invention.",
        posterPhotoId: "1Jzdpk8oV8M",
        daysAgo: 9,
        staffPick: true,
      },
      {
        title: "Dressing Room Notes",
        slug: "dressing-room-notes",
        category: "short",
        synopsis: "A performer records quick observations between takes and slowly realizes she is documenting a breakup.",
        description:
          "Short-form and character-led, the film favors warmth, texture, and close listening over overt plot mechanics.",
        posterPhotoId: "WypAvvDth5c",
        daysAgo: 5,
      },
    ],
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
    releases: [
      {
        title: "Static Between Towers",
        slug: "static-between-towers",
        category: "film",
        synopsis: "A stripped-back portrait of two estranged brothers navigating a city designed to keep them apart.",
        description:
          "Negative space, backlight, and withheld dialogue turn the skyline into a silent third character.",
        posterPhotoId: "qtnSdsldjNM",
        daysAgo: 35,
      },
      {
        title: "Southbound Neon",
        slug: "southbound-neon",
        category: "film",
        synopsis: "A drifting road picture about faith, debt, and the stories men tell when they can no longer bear direct confession.",
        description:
          "Sparse and atmospheric, the film favors silhouette, afterglow, and long pauses over explanatory speech.",
        posterPhotoId: "P82xoqgfL7Q",
        daysAgo: 30,
      },
      {
        title: "Nocturne for Concrete",
        slug: "nocturne-for-concrete",
        category: "experimental",
        synopsis: "Monochrome studies of overpasses, alley light, and unfinished prayers captured over seven nights.",
        description:
          "An experimental release built from contrast tests and quiet motion, intended to anchor the more austere side of Beyond Cinema.",
        posterPhotoId: "F-yJZv8nKTM",
        daysAgo: 12,
      },
      {
        title: "Receiver Without Signal",
        slug: "receiver-without-signal",
        category: "news",
        synopsis: "A commentary short about media fatigue, civic loneliness, and the theater of perpetual urgency.",
        description:
          "Presented as a restrained monologue with found-image interruptions, it sits between op-ed and visual poem.",
        posterPhotoId: "WypAvvDth5c",
        daysAgo: 7,
      },
    ],
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
    releases: [
      {
        title: "Inheritance of Dust",
        slug: "inheritance-of-dust",
        category: "film",
        synopsis: "A portrait-driven documentary about three women rebuilding a family history from photographs and rumors.",
        description:
          "Close observation and direct testimony shape the film into a meditation on witness, style, and emotional inheritance.",
        posterPhotoId: "IB19s-LMuZM",
        daysAgo: 21,
      },
      {
        title: "Wardrobe Testimony",
        slug: "wardrobe-testimony",
        category: "short",
        synopsis: "A short film where garments, voice notes, and still portraits assemble the emotional record of a vanished relationship.",
        description:
          "Small in scale but precise in feeling, this short leans on texture, breathing room, and intimate narration.",
        posterPhotoId: "DQHROgp43RQ",
        daysAgo: 10,
      },
      {
        title: "Archive of a Soft Revolution",
        slug: "archive-of-a-soft-revolution",
        category: "educational",
        synopsis: "An artist lecture-film on personal archiving, oral history, and building counter-memory from domestic materials.",
        description:
          "Educational in form but cinematic in texture, it folds process, pedagogy, and portraiture into a single release.",
        posterPhotoId: "2FbpJhYdK2Y",
        daysAgo: 8,
      },
      {
        title: "Counterlight Interview",
        slug: "counterlight-interview",
        category: "news",
        synopsis: "A current-affairs portrait that lets one subject control the framing of her own account.",
        description:
          "This commentary piece resists urgency in favor of steadier looking, slower speech, and a more durable emotional record.",
        posterPhotoId: "Ad-tezcyTZg",
        daysAgo: 4,
        staffPick: true,
      },
    ],
  },
  {
    key: "kinetic-worldbuilder",
    displayName: "Iris Solenne",
    websiteUrl: "https://example.com/iris-solenne",
    bio:
      "Iris builds kinetic, design-forward worlds where choreography, motion graphics, and speculative production design all share the same pulse.",
    openingStatement:
      "I make future-facing work that still feels handmade at the edges.",
    creativeProcessSummary:
      "Projects begin with movement studies, prop sketches, and spatial sound maps. Final cuts are shaped around propulsion, graphic clarity, and tactile atmosphere.",
    avatarPhotoId: "gMymJ1gtQMU",
    avatarSourcePage: "https://unsplash.com/photos/gMymJ1gtQMU",
    avatarCredit: "Alexander X.",
    bannerPhotoId: "IB19s-LMuZM",
    bannerSourcePage: "https://unsplash.com/photos/IB19s-LMuZM",
    bannerCredit: "Kenny Eliason",
    posterPhotoIds: ["Ad-tezcyTZg", "IB19s-LMuZM", "zoCNlT903hs"],
    releases: [
      {
        title: "Atlas of Sparks",
        slug: "atlas-of-sparks",
        category: "animation",
        synopsis: "A motion-driven animated short where city infrastructure comes alive as a living map of memory and desire.",
        description:
          "Built for the Beyond Cinema shelf, the film blends abstract transitions, graphic movement, and tactile texture into a vivid animated essay.",
        posterPhotoId: "IB19s-LMuZM",
        daysAgo: 18,
        staffPick: true,
      },
      {
        title: "Proxy Saint",
        slug: "proxy-saint",
        category: "experimental",
        synopsis: "A speculative ritual staged across mirrored rooms, handheld projections, and fragmented choreography.",
        description:
          "The film pushes performance and light design into the same emotional register, landing somewhere between installation and narrative.",
        posterPhotoId: "zoCNlT903hs",
        daysAgo: 13,
      },
      {
        title: "Chrome Weather Study",
        slug: "chrome-weather-study",
        category: "commercial",
        synopsis: "A brand-world mood piece about weather systems, engineered elegance, and bodies moving through reflective space.",
        description:
          "A polished commercial release that still preserves the makerly friction of practical texture and graphic restraint.",
        posterPhotoId: "Ad-tezcyTZg",
        daysAgo: 3,
      },
    ],
  },
  {
    key: "civic-observer",
    displayName: "Tavian Rhodes",
    websiteUrl: "https://example.com/tavian-rhodes",
    bio:
      "Tavian makes clear-eyed civic cinema: commentary, field notes, and people-first nonfiction shaped with precision rather than spectacle.",
    openingStatement:
      "I want public-interest images that feel composed without ever feeling insulated.",
    creativeProcessSummary:
      "Reporting, transcripts, and ambient city recordings drive the work. Edits favor clarity, witness, and a measured emotional temperature over rhetorical speed.",
    avatarPhotoId: "r0bH4hAVBmk",
    avatarSourcePage: "https://unsplash.com/photos/r0bH4hAVBmk",
    avatarCredit: "Gabriel Ogulu",
    bannerPhotoId: "2FbpJhYdK2Y",
    bannerSourcePage: "https://unsplash.com/photos/2FbpJhYdK2Y",
    bannerCredit: "Yianni Mathioudakis",
    posterPhotoIds: ["P82xoqgfL7Q", "DQy1kkyMAaI", "qtnSdsldjNM"],
    releases: [
      {
        title: "After the Sirens",
        slug: "after-the-sirens",
        category: "news",
        synopsis: "A commentary featurette on neighborhood response networks, public fatigue, and what remains after headlines move on.",
        description:
          "Grounded in testimony and city sound, the piece carries a calmer, more durable tone than conventional urgent-response media.",
        posterPhotoId: "P82xoqgfL7Q",
        daysAgo: 16,
      },
      {
        title: "Crosswalk Assembly",
        slug: "crosswalk-assembly",
        category: "short",
        synopsis: "A short documentary on volunteers, street corners, and the choreography of ordinary mutual aid.",
        description:
          "Small gestures and urban routine become the structure of the film, giving civic action a tactile, human scale.",
        posterPhotoId: "DQy1kkyMAaI",
        daysAgo: 14,
      },
      {
        title: "Public Signal Handbook",
        slug: "public-signal-handbook",
        category: "educational",
        synopsis: "An educational release about media literacy, local reporting, and how communities verify what they are seeing.",
        description:
          "Part lecture, part visual essay, the piece translates editorial process into a steady, accessible cinematic form.",
        posterPhotoId: "qtnSdsldjNM",
        daysAgo: 2,
      },
    ],
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
    withFilmCatalog: false,
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
      continue;
    }

    if (argument === "--with-film-catalog") {
      options.withFilmCatalog = true;
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

function buildPosterUrl(photoId) {
  return buildUnsplashUrl(photoId, {
    width: 1200,
    height: 1500,
    fit: "crop",
  });
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

function buildPublishedAt(daysAgo) {
  return new Date(Date.now() - daysAgo * RELEASE_DAY_MS).toISOString();
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
      "  npm run seed:mock-creators -- --handles=creator_one,creator_two [--apply] [--force] [--with-film-posters] [--with-film-catalog]",
      "",
      "Notes:",
      "  --handles is required and limits changes to those exact profile handles.",
      "  Dry-run is the default. Add --apply to write changes.",
      "  Existing populated profiles are skipped unless you pass --force.",
      "  --with-film-posters also replaces poster_url on films owned by those mock creators.",
      "  --with-film-catalog creates or refreshes a richer published release catalog for those mock creators.",
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

  if (args.withFilmCatalog) {
    console.log("\nMock release catalog plan:\n");
    for (const entry of plannedProfiles) {
      for (const release of entry.pack.releases) {
        console.log(`- @${entry.handle} -> ${release.title} [${release.category}]`);
      }
    }
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
        const posterUrl = buildPosterUrl(posterPhotoId);

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

  if (args.withFilmCatalog) {
    for (const entry of plannedProfiles) {
      const { data: existingFilms, error: existingFilmsError } = await supabase
        .from("films")
        .select("id, slug")
        .eq("creator_id", entry.profile.id);

      if (existingFilmsError) {
        throw new Error(`Failed to inspect films for @${entry.handle}: ${existingFilmsError.message}`);
      }

      const existingFilmMap = new Map((existingFilms ?? []).map((film) => [film.slug, film]));

      for (const release of entry.pack.releases) {
        const filmPayload = {
          creator_id: entry.profile.id,
          title: release.title,
          slug: release.slug,
          synopsis: release.synopsis,
          description: release.description,
          category: release.category,
          poster_url: buildPosterUrl(release.posterPhotoId),
          visibility: "public",
          publish_status: "published",
          moderation_status: "active",
          prompt_visibility: "public",
          published_at: buildPublishedAt(release.daysAgo),
          staff_pick: Boolean(release.staffPick),
        };

        const existingFilm = existingFilmMap.get(release.slug);

        if (existingFilm) {
          const { error } = await supabase
            .from("films")
            .update(filmPayload)
            .eq("id", existingFilm.id);

          if (error) {
            throw new Error(`Failed to update catalog film ${release.slug}: ${error.message}`);
          }

          continue;
        }

        const { error } = await supabase
          .from("films")
          .insert(filmPayload);

        if (error) {
          throw new Error(`Failed to create catalog film ${release.slug}: ${error.message}`);
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
