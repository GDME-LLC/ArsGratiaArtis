export type ResourceTag = "Tool" | "Education" | "Community" | "Festival" | "Showcase" | "Research" | "Learning" | "Inspiration";

export type ResourceCategoryId =
  | "video_generation"
  | "image_tools"
  | "audio_voice_music"
  | "editing_post"
  | "learning_platforms"
  | "communities_showcases"
  | "inspiration_research";

export type ResourceEntry = {
  name: string;
  category: ResourceCategoryId;
  description: string;
  url: string;
  tags: ResourceTag[];
  logoUrl?: string;
  logoAlt?: string;
  note?: string;
  featured?: boolean;
  sortOrder?: number;
};

export type ResourceCategory = {
  id: ResourceCategoryId;
  label: string;
  description: string;
};

export const resourceCategories: ResourceCategory[] = [
  {
    id: "video_generation",
    label: "Video Generation Tools",
    description: "Platforms used for motion studies, shot generation, world tests, and moving-image experiments.",
  },
  {
    id: "image_tools",
    label: "Image Tools",
    description: "Useful for look development, production design references, posters, and visual world-building.",
  },
  {
    id: "audio_voice_music",
    label: "Audio / Music / Voice",
    description: "Voice, score, and sound tools that help shape tone, pacing, and temporary or final sonic direction.",
  },
  {
    id: "editing_post",
    label: "Editing / Post Production",
    description: "Finishing environments for assembling generated material into something coherent, watchable, and polished.",
  },
  {
    id: "learning_platforms",
    label: "Learning Platforms",
    description: "Courses, tutorials, and structured education for creators studying this emerging medium more seriously.",
  },
  {
    id: "communities_showcases",
    label: "Communities / Festivals / Showcases",
    description: "Places to see the field taking shape, connect with other creators, and watch how the ecosystem is evolving.",
  },
  {
    id: "inspiration_research",
    label: "Inspiration / Research",
    description: "References, research hubs, and creative companions that sharpen taste, context, and critical judgment.",
  },
];

export const resourceEntries: ResourceEntry[] = [
  {
    name: "Runway",
    category: "video_generation",
    description: "Widely used for motion generation, shot extension, cleanup, and rapid cinematic tests.",
    url: "https://runwayml.com",
    tags: ["Tool"],
    logoUrl: "https://runway-static-assets.s3.amazonaws.com/site/images/api-page/powered-by-runway-white.svg",
    logoAlt: "Runway",
    note: "Popular with AI filmmakers",
    featured: true,
    sortOrder: 10,
  },
  {
    name: "Luma Dream Machine",
    category: "video_generation",
    description: "A strong option for image-to-video and prompt-driven motion sketches when tone and movement need to be explored quickly.",
    url: "https://lumalabs.ai/dream-machine",
    tags: ["Tool"],
    featured: true,
    sortOrder: 20,
  },
  {
    name: "Pika",
    category: "video_generation",
    description: "Useful for quick motion experiments, stylized transitions, and lightweight scene ideation.",
    url: "https://pika.art",
    tags: ["Tool"],
    sortOrder: 30,
  },
  {
    name: "Kling",
    category: "video_generation",
    description: "A video model often explored for cinematic prompt tests, character motion, and proof-of-concept imagery.",
    url: "https://klingai.com",
    tags: ["Tool"],
    sortOrder: 40,
  },
  {
    name: "Midjourney",
    category: "image_tools",
    description: "A staple for look packs, style frames, poster drafts, and visual atmosphere before a project moves into motion.",
    url: "https://www.midjourney.com",
    tags: ["Tool"],
    note: "Strong for look development",
    featured: true,
    sortOrder: 50,
  },
  {
    name: "Krea",
    category: "image_tools",
    description: "Good for rapid image ideation and visual exploration during early concept development.",
    url: "https://www.krea.ai",
    tags: ["Tool"],
    sortOrder: 60,
  },
  {
    name: "FLUX",
    category: "image_tools",
    description: "A flexible image-generation option for creators who want more iteration control and model experimentation.",
    url: "https://blackforestlabs.ai",
    tags: ["Tool"],
    sortOrder: 70,
  },
  {
    name: "ElevenLabs",
    category: "audio_voice_music",
    description: "Frequently used for temp dialogue, narration tests, multilingual voice experiments, and polished voice references.",
    url: "https://elevenlabs.io",
    tags: ["Tool"],
    logoUrl: "https://11labs-nonprd-15f22c1d.s3.eu-west-3.amazonaws.com/0b9cd3e1-9fad-4a5b-b3a0-c96b0a1f1d2b/elevenlabs-logo-white.svg",
    logoAlt: "ElevenLabs",
    featured: true,
    sortOrder: 80,
  },
  {
    name: "Suno",
    category: "audio_voice_music",
    description: "Helpful for fast music sketches and emotional pacing references before a final score or sound mix is locked.",
    url: "https://suno.com",
    tags: ["Tool"],
    sortOrder: 90,
  },
  {
    name: "Adobe Podcast",
    category: "audio_voice_music",
    description: "Useful for cleaning rough speech recordings and making voice tests more presentation-ready.",
    url: "https://podcast.adobe.com",
    tags: ["Tool"],
    sortOrder: 100,
  },
  {
    name: "DaVinci Resolve",
    category: "editing_post",
    description: "A practical finishing environment for editing, grading, sound, and final assembly once the material has to become a film.",
    url: "https://www.blackmagicdesign.com/products/davinciresolve",
    tags: ["Tool"],
    note: "Popular finishing environment",
    featured: true,
    sortOrder: 110,
  },
  {
    name: "Adobe Premiere Pro",
    category: "editing_post",
    description: "A familiar editorial environment for creators assembling generated footage into trailers, shorts, and finished releases.",
    url: "https://www.adobe.com/products/premiere.html",
    tags: ["Tool"],
    sortOrder: 120,
  },
  {
    name: "Descript",
    category: "editing_post",
    description: "Handy for transcript-driven assembly, voice-heavy edits, and quick structural passes.",
    url: "https://www.descript.com",
    tags: ["Tool"],
    sortOrder: 130,
  },
  {
    name: "Curious Refuge",
    category: "learning_platforms",
    description: "One of the best-known learning hubs for AI filmmaking, with courses, workshops, screenings, and a visible creative community.",
    url: "https://curiousrefuge.com",
    tags: ["Education", "Community", "Learning"],
    note: "Training / tutorials",
    featured: true,
    sortOrder: 140,
  },
  {
    name: "Future Tools",
    category: "learning_platforms",
    description: "A broad discovery site for tracking new AI tools and keeping a pulse on what creators are testing.",
    url: "https://www.futuretools.io",
    tags: ["Learning", "Research"],
    sortOrder: 150,
  },
  {
    name: "Promise",
    category: "communities_showcases",
    description: "A growing showcase and signal source for AI-native film work and creators in the space.",
    url: "https://www.promise.supply",
    tags: ["Showcase", "Community"],
    sortOrder: 160,
  },
  {
    name: "Project Odyssey",
    category: "communities_showcases",
    description: "A strong reference point for the wider AI art and filmmaking landscape, especially around events and community visibility.",
    url: "https://www.projectodyssey.ai",
    tags: ["Community", "Showcase", "Festival"],
    sortOrder: 170,
  },
  {
    name: "Civitai",
    category: "communities_showcases",
    description: "A large model-sharing and creator community useful for research, experimentation, and understanding adjacent visual cultures.",
    url: "https://civitai.com",
    tags: ["Community", "Research"],
    sortOrder: 180,
  },
  {
    name: "Nowness",
    category: "inspiration_research",
    description: "A strong taste reference for short-form cinematic direction, visual mood, and premium presentation standards.",
    url: "https://www.nowness.com",
    tags: ["Inspiration", "Research"],
    sortOrder: 190,
  },
  {
    name: "MUBI Notebook",
    category: "inspiration_research",
    description: "Editorial writing and criticism that can sharpen language, taste, and framing around contemporary cinema.",
    url: "https://mubi.com/notebook",
    tags: ["Research", "Inspiration"],
    sortOrder: 200,
  },
  {
    name: "Are.na",
    category: "inspiration_research",
    description: "Useful for building reference boards, gathering visual thinking, and keeping creative research organized without flattening it.",
    url: "https://www.are.na",
    tags: ["Research", "Inspiration"],
    sortOrder: 210,
  },
];

export const featuredResources = resourceEntries
  .filter((entry) => entry.featured)
  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

export const resourcesByCategory = resourceCategories.map((category) => ({
  ...category,
  items: resourceEntries
    .filter((entry) => entry.category === category.id)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
}));
