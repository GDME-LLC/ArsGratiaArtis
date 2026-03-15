export const featuredTools = [
  {
    name: "Runway",
    category: "Video",
    description:
      "Useful for motion generation, shot extension, cleanup, and fast visual iteration when you need to move from concept to test footage quickly.",
    href: "https://runwayml.com",
    fit: "Best when you need quick previs, visual experimentation, or stylized inserts.",
  },
  {
    name: "Luma Dream Machine",
    category: "Video",
    description:
      "A strong option for turning prompts and images into motion studies that can be reshaped into mood pieces, transitions, or concept trailers.",
    href: "https://lumalabs.ai/dream-machine",
    fit: "Best when you want cinematic motion sketches from lightweight inputs.",
  },
  {
    name: "Midjourney",
    category: "Image",
    description:
      "Reliable for look development, production design references, poster explorations, and visual world-building before you commit to final shots.",
    href: "https://www.midjourney.com",
    fit: "Best when tone, atmosphere, and frame language need to lock in early.",
  },
  {
    name: "ElevenLabs",
    category: "Audio",
    description:
      "Helpful for temp voiceover, narration tests, and multilingual voice experiments before final performance or sound mix decisions.",
    href: "https://elevenlabs.io",
    fit: "Best when you need polished temporary dialogue or narration quickly.",
  },
  {
    name: "DaVinci Resolve",
    category: "Editing",
    description:
      "A practical finishing environment for editing, grading, sound, and final assembly once the AI-generated pieces need discipline and coherence.",
    href: "https://www.blackmagicdesign.com/products/davinciresolve",
    fit: "Best when you are shaping generated material into a film, not just a demo.",
  },
  {
    name: "ChatGPT",
    category: "Story / scripting",
    description:
      "Useful as a development partner for loglines, beat sheets, scene variations, shot prompts, and structured iteration across the whole pipeline.",
    href: "https://chatgpt.com",
    fit: "Best when you need fast ideation, rewriting passes, or prompt scaffolding.",
  },
  {
    name: "Curious Refuge",
    category: "Education / community",
    description:
      "A well-known AI filmmaking school and community with courses, tutorials, events, and a film gallery that can help creators study the field more seriously.",
    href: "https://curiousrefuge.com",
    fit: "Best when you want structured training, community context, and a broader view of the current AI filmmaking ecosystem.",
  },
] as const;

export const starterWorkflow = [
  {
    step: "1. Define the short",
    detail:
      "Start with a one-sentence premise, a mood reference, and a hard constraint such as runtime, aspect ratio, or voice style.",
  },
  {
    step: "2. Build a look pack",
    detail:
      "Use image tools to establish character, lighting, palette, wardrobe, and world rules before generating motion.",
  },
  {
    step: "3. Generate proof-of-concept shots",
    detail:
      "Create 3 to 6 key shots first. Validate tone and continuity early instead of generating an entire sequence too soon.",
  },
  {
    step: "4. Add scratch sound",
    detail:
      "Use temp voice, music, and ambient beds so pacing decisions are tied to emotion rather than isolated clips.",
  },
  {
    step: "5. Edit into a real sequence",
    detail:
      "Assemble the shots in an editor, trim aggressively, and identify exactly what must be regenerated for continuity or performance.",
  },
  {
    step: "6. Publish with context",
    detail:
      "Share the finished film alongside selected tools, prompt notes, or workflow context so process supports the work instead of distracting from it.",
  },
] as const;

export const advancedWorkflowIdeas = [
  {
    title: "Reference-to-shot pipeline",
    description:
      "Build a locked visual bible first, then derive prompts, shot lists, and regeneration notes from that shared reference layer to keep continuity tighter across scenes.",
  },
  {
    title: "Hybrid production workflow",
    description:
      "Combine AI-generated establishing imagery with live-action inserts, practical sound, and editorial rhythm so the final film feels authored rather than uniformly synthetic.",
  },
  {
    title: "Versioned scene development",
    description:
      "Treat scenes like editables: save prompt variants, camera language notes, and timing changes so you can revise a sequence with intention instead of starting over blindly.",
  },
  {
    title: "Platform-ready publishing package",
    description:
      "Prepare a film page, a concise director note, a curated tool list, and a short process summary so the release feels like a complete work on ArsGratia, not a raw export.",
  },
] as const;

export const categories = [
  {
    id: "video",
    name: "Video",
    summary:
      "For shot generation, motion ideation, scene exploration, and cinematic iteration.",
    items: [
      {
        name: "Runway",
        description: "Motion generation, inpainting, and quick visual iteration for tests and sequences.",
        href: "https://runwayml.com",
      },
      {
        name: "Luma Dream Machine",
        description: "Prompt-to-video and image-to-video experiments for concept motion and mood pieces.",
        href: "https://lumalabs.ai/dream-machine",
      },
      {
        name: "Pika",
        description: "Fast generative video experiments when you want to test movement, transitions, or stylization.",
        href: "https://pika.art",
      },
    ],
  },
  {
    id: "image",
    name: "Image",
    summary:
      "For concept art, look development, visual references, and world-building before motion.",
    items: [
      {
        name: "Midjourney",
        description: "Strong for atmosphere, style frames, character studies, and poster exploration.",
        href: "https://www.midjourney.com",
      },
      {
        name: "Krea",
        description: "Useful for rapid image ideation and reference development during early visual discovery.",
        href: "https://www.krea.ai",
      },
      {
        name: "FLUX",
        description: "A flexible image generation model for creators who want more control over iteration paths.",
        href: "https://blackforestlabs.ai",
      },
    ],
  },
  {
    id: "audio",
    name: "Audio",
    summary:
      "For temp dialogue, narration, score sketches, and sound beds that improve editorial judgment.",
    items: [
      {
        name: "ElevenLabs",
        description: "Voice synthesis and narration tests for scratch dialogue, tone passes, and multilingual variants.",
        href: "https://elevenlabs.io",
      },
      {
        name: "Suno",
        description: "Fast music sketches when you need emotional pacing references before final scoring.",
        href: "https://suno.com",
      },
      {
        name: "Adobe Podcast",
        description: "Voice cleanup and speech enhancement for temp tracks that need to be immediately usable.",
        href: "https://podcast.adobe.com",
      },
    ],
  },
  {
    id: "editing",
    name: "Editing",
    summary:
      "For shaping generated assets into sequences with rhythm, clarity, and finishing discipline.",
    items: [
      {
        name: "DaVinci Resolve",
        description: "Editing, grading, audio, and finishing in one place for filmmakers taking projects to completion.",
        href: "https://www.blackmagicdesign.com/products/davinciresolve",
      },
      {
        name: "Adobe Premiere Pro",
        description: "A familiar editorial environment for assembling generated footage with existing post workflows.",
        href: "https://www.adobe.com/products/premiere.html",
      },
      {
        name: "Descript",
        description: "Helpful for quick assembly, transcript-driven edits, and voice-centric rough cuts.",
        href: "https://www.descript.com",
      },
    ],
  },
  {
    id: "story",
    name: "Story / scripting",
    summary:
      "For developing premises, refining structure, shaping prompts, and turning ideas into repeatable workflows.",
    items: [
      {
        name: "ChatGPT",
        description: "Beat sheets, rewrites, prompt structures, alt scene versions, and workflow drafting.",
        href: "https://chatgpt.com",
      },
      {
        name: "Claude",
        description: "Long-form reasoning and script development support when you need broader context retained.",
        href: "https://claude.ai",
      },
      {
        name: "Notion",
        description: "A simple production home for story boards, prompt logs, shot lists, and release notes.",
        href: "https://www.notion.so",
      },
    ],
  },
  {
    id: "education",
    name: "Education / community",
    summary:
      "For courses, tutorials, events, and broader community context around AI filmmaking and creative workflows.",
    items: [
      {
        name: "Curious Refuge",
        description: "Courses, tutorials, events, and a film gallery for creators who want more structured AI filmmaking context.",
        href: "https://curiousrefuge.com",
      },
    ],
  },
] as const;

export const exampleFilmStacks = [
  {
    name: "Fast visual short",
    summary: "A lean stack for testing visual language quickly and cutting a first finished sequence.",
    tools: {
      visual: ["Midjourney", "Runway"],
      editing: ["DaVinci Resolve"],
      audio: ["ElevenLabs", "Suno"],
      story: ["ChatGPT", "Notion"],
    },
  },
  {
    name: "Trailer or mood piece",
    summary: "A good fit when tone, rhythm, and atmosphere matter more than long-form scene continuity.",
    tools: {
      visual: ["Luma Dream Machine", "Krea"],
      editing: ["Adobe Premiere Pro"],
      audio: ["Adobe Podcast", "Suno"],
      story: ["Claude", "Notion"],
    },
  },
  {
    name: "Series proof-of-concept",
    summary: "Useful for creators shaping a repeatable world, recurring characters, and a cleaner release package.",
    tools: {
      visual: ["FLUX", "Runway"],
      editing: ["DaVinci Resolve", "Descript"],
      audio: ["ElevenLabs"],
      story: ["ChatGPT", "Claude", "Notion"],
    },
  },
] as const;

export const resourceSections = [
  {
    href: "/resources/featured-tools",
    eyebrow: "Tool picks",
    title: "Choose tools with a clear reason to use them.",
    description:
      "A short list of strong options for video, image, audio, editing, and scripting, with notes on where each one fits best.",
    ctaLabel: "See tool picks",
  },
  {
    href: "/resources/starter-workflow",
    eyebrow: "Start here",
    title: "Build a short without getting lost in the tool stack.",
    description:
      "A practical path from premise to finished cut, designed to keep scope under control and help new creators ship work.",
    ctaLabel: "Follow the workflow",
  },
  {
    href: "/resources/advanced-workflows",
    eyebrow: "Next level",
    title: "Tighten continuity, versioning, and release presentation.",
    description:
      "Workflow ideas for creators who want more control over scene consistency, hybrid production, and how the work is presented.",
    ctaLabel: "Explore advanced ideas",
  },
  {
    href: "/resources/categories",
    eyebrow: "Browse by craft",
    title: "Find what you need by stage of the process.",
    description:
      "Move directly into video, image, audio, editing, or story tools depending on where your project is stuck.",
    ctaLabel: "Browse categories",
  },
] as const;
