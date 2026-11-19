import type { CategoryItem, CommentItem, CreatorChannel, VideoItem } from "@/types/media";

const BUCKET = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/";
export const STREAMS = {
  bunny: BUCKET + "BigBuckBunny.mp4",
  dream: BUCKET + "ElephantsDream.mp4",
  sintel: BUCKET + "Sintel.mp4",
  steel: BUCKET + "TearsOfSteel.mp4",
  blazes: BUCKET + "ForBiggerBlazes.mp4",
  escapes: BUCKET + "ForBiggerEscapes.mp4",
  fun: BUCKET + "ForBiggerFun.mp4",
  joyrides: BUCKET + "ForBiggerJoyrides.mp4",
  meltdowns: BUCKET + "ForBiggerMeltdowns.mp4",
  subaru: BUCKET + "SubaruOutbackOnStreetAndDirt.mp4",
  gti: BUCKET + "VolkswagenGTIReview.mp4",
  bullrun: BUCKET + "WeAreGoingOnBullrun.mp4",
  grand: BUCKET + "WhatCarCanYouGetForAGrand.mp4",
} as const;

export const SAMPLE_STREAMS: { label: string; src: string }[] = [
  { label: "Big Buck Bunny (open movie)", src: STREAMS.bunny },
  { label: "Elephants Dream (open movie)", src: STREAMS.dream },
  { label: "Sintel (open movie)", src: STREAMS.sintel },
  { label: "Tears of Steel (open movie)", src: STREAMS.steel },
  { label: "For Bigger Blazes (short)", src: STREAMS.blazes },
  { label: "For Bigger Escapes (short)", src: STREAMS.escapes },
];

/** Fixed "today" so server and browser render the same relative dates. */
export const NOW = new Date("2026-11-17T12:00:00Z").getTime();

export const ALL_TAGS = ["4K", "60FPS", "Animation", "Cyberpunk", "Tutorial", "Cinema", "Gaming"] as const;

export const categories: CategoryItem[] = [
  { slug: "3d-animation", name: "3D Animation", description: "Short films, character work and render showcases.", videoCount: 1420, palette: ["#ff9000", "#7a1fa2", "#120318"], trendingTags: ["Animation", "Blender", "4K"] },
  { slug: "cyberpunk-sci-fi", name: "Cyberpunk & Sci-Fi", description: "Neon cities, robots and far-future worlds.", videoCount: 986, palette: ["#00e5ff", "#ff2bd6", "#0a0420"], trendingTags: ["Cyberpunk", "Cinema", "60FPS"] },
  { slug: "game-dev", name: "Game Dev", description: "Devlogs, engine breakdowns and level design.", videoCount: 1204, palette: ["#2ecc71", "#1e3a8a", "#04110a"], trendingTags: ["Gaming", "Tutorial", "Unreal"] },
  { slug: "tech-reviews", name: "Tech Reviews", description: "Hands-on reviews of cars, gear and gadgets.", videoCount: 742, palette: ["#38bdf8", "#334155", "#020617"], trendingTags: ["Review", "4K", "60FPS"] },
  { slug: "music-visuals", name: "Music Visuals", description: "Synthwave loops, visualizers and VJ sets.", videoCount: 655, palette: ["#f43f5e", "#f59e0b", "#1a0610"], trendingTags: ["Synthwave", "Animation", "60FPS"] },
  { slug: "tutorials", name: "Tutorials", description: "Step-by-step lessons in 3D, code and editing.", videoCount: 2310, palette: ["#facc15", "#ea580c", "#170c02"], trendingTags: ["Tutorial", "Blender", "Unreal"] },
  { slug: "cinema-trailers", name: "Cinema Trailers", description: "Trailers and open-movie premieres.", videoCount: 518, palette: ["#e2e8f0", "#b91c1c", "#0b0b0b"], trendingTags: ["Cinema", "4K", "Trailer"] },
  { slug: "ai-art", name: "AI Art", description: "Generative art, style studies and experiments.", videoCount: 873, palette: ["#a78bfa", "#22d3ee", "#0b0720"], trendingTags: ["AI", "Animation", "4K"] },
];

export const channels: CreatorChannel[] = [
  { handle: "CrocByteStudios", name: "CrocByte Studios", bio: "Indie animation studio making character-driven shorts and open movies.", verified: true, subscribers: 2840000, totalViews: 412000000, rank: 1, palette: ["#2ecc71", "#ff9000", "#06140b"], socials: [{ label: "Website", url: "https://example.com/crocbyte" }, { label: "X", url: "https://x.com" }, { label: "Discord", url: "https://discord.com" }], joined: "2019-03-11" },
  { handle: "BlenderMaster", name: "Blender Master", bio: "Free 3D lessons, render breakdowns and weekly modelling challenges.", verified: true, subscribers: 2210000, totalViews: 356000000, rank: 2, palette: ["#ff9000", "#1d4ed8", "#0a0a14"], socials: [{ label: "Website", url: "https://example.com/blendermaster" }, { label: "X", url: "https://x.com" }], joined: "2018-07-02" },
  { handle: "NeonRender", name: "Neon Render", bio: "Cyberpunk cityscapes and sci-fi worldbuilding in real time.", verified: true, subscribers: 1630000, totalViews: 241000000, rank: 3, palette: ["#ff2bd6", "#00e5ff", "#0a0420"], socials: [{ label: "Website", url: "https://example.com/neonrender" }, { label: "Discord", url: "https://discord.com" }], joined: "2020-01-20" },
  { handle: "CodeCinema", name: "Code Cinema", bio: "Gear reviews and tech stories, shot like short films.", verified: true, subscribers: 1180000, totalViews: 167000000, rank: 4, palette: ["#38bdf8", "#f8fafc", "#020617"], socials: [{ label: "Website", url: "https://example.com/codecinema" }], joined: "2017-10-05" },
  { handle: "SynthVisuals", name: "Synth Visuals", bio: "Music visualizers, VJ loops and synthwave art.", verified: true, subscribers: 940000, totalViews: 98000000, rank: 5, palette: ["#f43f5e", "#f59e0b", "#1a0610"], socials: [{ label: "Website", url: "https://example.com/synthvisuals" }, { label: "X", url: "https://x.com" }], joined: "2021-05-14" },
  { handle: "PixelForge", name: "Pixel Forge", bio: "Game dev logs, engine tips and AI art experiments.", verified: true, subscribers: 720000, totalViews: 74000000, rank: 6, palette: ["#a78bfa", "#22d3ee", "#0b0720"], socials: [{ label: "Website", url: "https://example.com/pixelforge" }, { label: "Discord", url: "https://discord.com" }], joined: "2022-02-28" },
];

function ch(...items: [number, string][]) {
  return items.map(([time, title]) => ({ time, title }));
}

export const seedVideos: VideoItem[] = [
  { id: "v01", title: "Big Buck Bunny - Full Open Movie in 4K 60fps", description: "A giant rabbit takes on three mischievous rodents in this classic open movie, remastered for 4K.", creator: "CrocByteStudios", category: "3d-animation", tags: ["4K", "60FPS", "Animation", "Cinema"], duration: 596, views: 18400000, likes: 412000, dislikes: 9800, favorites: 88000, uploadedAt: "2026-11-10", quality: "4K", fps: 60, fullLength: true, src: STREAMS.bunny, palette: ["#7ed957", "#ff9000", "#0b2a10"], chapters: ch([0, "Opening"], [75, "Morning meadow"], [135, "The bullies"], [300, "The plan"], [450, "Payback"], [540, "Credits"]) },
  { id: "v02", title: "Elephants Dream - Surreal Machine World", description: "Two characters explore an endless machine in the first open movie ever made.", creator: "CrocByteStudios", category: "3d-animation", tags: ["Animation", "Cinema", "4K"], duration: 653, views: 9200000, likes: 198000, dislikes: 7100, favorites: 41000, uploadedAt: "2026-10-28", quality: "4K", fps: 30, fullLength: true, src: STREAMS.dream, palette: ["#f59e0b", "#7c2d12", "#120804"], chapters: ch([0, "The machine"], [120, "Proog and Emo"], [330, "The switchboard"], [520, "Collapse"]) },
  { id: "v03", title: "Sintel - Dragon Quest Short Film", description: "A lone warrior searches for her baby dragon across a frozen world.", creator: "BlenderMaster", category: "cinema-trailers", tags: ["Cinema", "Animation", "4K", "60FPS"], duration: 888, views: 22100000, likes: 640000, dislikes: 12000, favorites: 132000, uploadedAt: "2026-11-02", quality: "4K", fps: 60, fullLength: true, src: STREAMS.sintel, palette: ["#93c5fd", "#9f1239", "#0b1020"], chapters: ch([0, "Snow pass"], [135, "Scales"], [300, "The city"], [600, "The cave"], [800, "Ending"]) },
  { id: "v04", title: "Tears of Steel - Cyberpunk Robots in Amsterdam", description: "Scientists and warriors try to save the world from a robot uprising.", creator: "NeonRender", category: "cyberpunk-sci-fi", tags: ["Cyberpunk", "Cinema", "4K"], duration: 734, views: 15700000, likes: 350000, dislikes: 11000, favorites: 76000, uploadedAt: "2026-11-14", quality: "4K", fps: 30, fullLength: true, src: STREAMS.steel, palette: ["#00e5ff", "#ff2bd6", "#060216"], chapters: ch([0, "The bridge"], [140, "Memory reboot"], [360, "Assault"], [600, "The choice"]) },
  { id: "v05", title: "Neon City Flythrough - Real-Time Ray Tracing", description: "A one-take flight through a rainy megacity rendered live in a game engine.", creator: "NeonRender", category: "cyberpunk-sci-fi", tags: ["Cyberpunk", "4K", "60FPS", "Gaming"], duration: 1932, views: 6300000, likes: 221000, dislikes: 4100, favorites: 52000, uploadedAt: "2026-11-15", quality: "4K", fps: 60, fullLength: true, src: STREAMS.escapes, palette: ["#ff2bd6", "#6d28d9", "#05010f"], chapters: ch([0, "Rooftops"], [4, "Market street"], [9, "Skyline"]) },
  { id: "v06", title: "Blender Donut to Diner: Full Modelling Course", description: "Model, light and render a complete 3D diner scene from scratch.", creator: "BlenderMaster", category: "tutorials", tags: ["Tutorial", "Animation", "4K"], duration: 2790, views: 4100000, likes: 162000, dislikes: 2300, favorites: 98000, uploadedAt: "2026-10-30", quality: "4K", fps: 30, fullLength: true, src: STREAMS.fun, palette: ["#facc15", "#ea580c", "#170c02"], chapters: ch([0, "Setup"], [4, "Modelling"], [9, "Materials"], [13, "Render"]) },
  { id: "v07", title: "Hatchback Review: Street & Track in 60fps", description: "We push a hot hatch on the street and the track to see what it can do.", creator: "CodeCinema", category: "tech-reviews", tags: ["60FPS", "4K"], duration: 594, views: 3500000, likes: 88000, dislikes: 3900, favorites: 12000, uploadedAt: "2026-11-08", quality: "4K", fps: 60, fullLength: false, src: STREAMS.gti, palette: ["#38bdf8", "#334155", "#020617"], chapters: ch([0, "Walkaround"], [120, "Interior"], [300, "On track"], [480, "Verdict"]) },
  { id: "v08", title: "Off-Road Wagon Test - Dirt Trails in 4K", description: "Gravel, mud and mountain roads: a full off-road test drive.", creator: "CodeCinema", category: "tech-reviews", tags: ["4K", "Cinema"], duration: 594, views: 2800000, likes: 61000, dislikes: 2100, favorites: 8000, uploadedAt: "2026-11-01", quality: "4K", fps: 30, fullLength: false, src: STREAMS.subaru, palette: ["#84cc16", "#78350f", "#0c0a02"], chapters: ch([0, "Street"], [200, "Gravel"], [400, "Mud"]) },
  { id: "v09", title: "Synthwave Sunset Visualizer - 30 Minute Loop", description: "Retro grid, chrome sun and a steady synth groove for focus sessions.", creator: "SynthVisuals", category: "music-visuals", tags: ["Animation", "60FPS"], duration: 1810, views: 5400000, likes: 190000, dislikes: 2600, favorites: 71000, uploadedAt: "2026-11-12", quality: "1080p", fps: 60, fullLength: true, src: STREAMS.blazes, palette: ["#f43f5e", "#f59e0b", "#1a0610"], chapters: ch([0, "Sunset"], [5, "Grid run"], [10, "Night drive"]) },
  { id: "v10", title: "Bass Visual Pack Vol. 3 - VJ Loops", description: "Twelve beat-reactive loops ready for your next live set.", creator: "SynthVisuals", category: "music-visuals", tags: ["Animation", "4K", "60FPS"], duration: 412, views: 1900000, likes: 54000, dislikes: 1300, favorites: 23000, uploadedAt: "2026-11-05", quality: "4K", fps: 60, fullLength: false, src: STREAMS.meltdowns, palette: ["#22d3ee", "#e11d48", "#0a0612"], chapters: ch([0, "Loop 1-4"], [5, "Loop 5-8"], [10, "Loop 9-12"]) },
  { id: "v11", title: "Devlog #14: Building a Grappling Hook System", description: "Physics, rope rendering and level design for a fast movement shooter.", creator: "PixelForge", category: "game-dev", tags: ["Gaming", "Tutorial", "60FPS"], duration: 1124, views: 1400000, likes: 71000, dislikes: 900, favorites: 19000, uploadedAt: "2026-11-16", quality: "1080p", fps: 60, fullLength: false, src: STREAMS.joyrides, palette: ["#2ecc71", "#1e3a8a", "#04110a"], chapters: ch([0, "Intro"], [4, "Rope physics"], [9, "Level test"]) },
  { id: "v12", title: "Unreal Level Design: From Blockout to Final Lighting", description: "A full walkthrough of a sci-fi hangar level, start to finish.", creator: "PixelForge", category: "game-dev", tags: ["Gaming", "Tutorial", "4K", "Cyberpunk"], duration: 2460, views: 2200000, likes: 98000, dislikes: 1700, favorites: 44000, uploadedAt: "2026-10-22", quality: "4K", fps: 30, fullLength: true, src: STREAMS.escapes, palette: ["#64748b", "#ff9000", "#0a0d12"], chapters: ch([0, "Blockout"], [4, "Kit pieces"], [9, "Lighting"], [13, "Polish"]) },
  { id: "v13", title: "AI Art Style Study: 100 Painterly Landscapes", description: "Exploring brush styles and colour palettes with generative tools.", creator: "PixelForge", category: "ai-art", tags: ["Animation", "4K"], duration: 645, views: 3100000, likes: 102000, dislikes: 5200, favorites: 33000, uploadedAt: "2026-11-09", quality: "4K", fps: 30, fullLength: false, src: STREAMS.fun, palette: ["#a78bfa", "#22d3ee", "#0b0720"], chapters: ch([0, "Forests"], [5, "Coasts"], [10, "Mountains"]) },
  { id: "v14", title: "Morphing Dreamscapes - Generative Animation", description: "Endless morphing scenes built from prompt sequences and frame blending.", creator: "SynthVisuals", category: "ai-art", tags: ["Animation", "60FPS", "Cyberpunk"], duration: 372, views: 2600000, likes: 87000, dislikes: 3300, favorites: 29000, uploadedAt: "2026-10-26", quality: "1080p", fps: 60, fullLength: false, src: STREAMS.blazes, palette: ["#c084fc", "#f472b6", "#12051a"], chapters: ch([0, "Cloud city"], [5, "Ocean glass"], [10, "Neon forest"]) },
  { id: "v15", title: "Road Trip Rally - Cinematic Drive Montage", description: "A cinematic rally across deserts and coastlines, shot on cinema cameras.", creator: "CodeCinema", category: "cinema-trailers", tags: ["Cinema", "4K", "60FPS"], duration: 2010, views: 1700000, likes: 49000, dislikes: 1900, favorites: 9000, uploadedAt: "2026-11-11", quality: "4K", fps: 60, fullLength: true, src: STREAMS.bullrun, palette: ["#fbbf24", "#0369a1", "#04101c"], chapters: ch([0, "Departure"], [120, "Desert"], [300, "Coast"]) },
  { id: "v16", title: "Budget Gear Challenge: Best Camera Under $1000", description: "Five cameras, one budget: which one shoots the best short film?", creator: "CodeCinema", category: "tech-reviews", tags: ["Tutorial", "Cinema"], duration: 812, views: 2400000, likes: 77000, dislikes: 2800, favorites: 15000, uploadedAt: "2026-10-18", quality: "1080p", fps: 30, fullLength: false, src: STREAMS.grand, palette: ["#f8fafc", "#475569", "#0b0b0b"], chapters: ch([0, "The rules"], [180, "Testing"], [520, "Results"]) },
  { id: "v17", title: "Rigging a Cartoon Character in 20 Minutes", description: "Quick, clean rig for a stylised character, with facial controls.", creator: "BlenderMaster", category: "tutorials", tags: ["Tutorial", "Animation"], duration: 1215, views: 1300000, likes: 61000, dislikes: 700, favorites: 27000, uploadedAt: "2026-11-13", quality: "1080p", fps: 30, fullLength: false, src: STREAMS.joyrides, palette: ["#fb923c", "#0ea5e9", "#0c0a14"], chapters: ch([0, "Bones"], [4, "Weights"], [9, "Face rig"]) },
  { id: "v18", title: "Mech Hangar Short - Sci-Fi Animatic", description: "A moody animatic of a mech launch sequence, scored with live strings.", creator: "NeonRender", category: "cyberpunk-sci-fi", tags: ["Cyberpunk", "Animation", "Cinema"], duration: 468, views: 2900000, likes: 93000, dislikes: 2500, favorites: 31000, uploadedAt: "2026-11-06", quality: "1080p", fps: 30, fullLength: false, src: STREAMS.meltdowns, palette: ["#94a3b8", "#ff9000", "#05070c"], chapters: ch([0, "Hangar"], [5, "Ignition"], [10, "Launch"]) },
  { id: "v19", title: "Speedrun Breakdown: Platformer Any% Routes", description: "Frame-perfect tricks and route planning, explained step by step.", creator: "PixelForge", category: "game-dev", tags: ["Gaming", "60FPS", "Tutorial"], duration: 905, views: 1100000, likes: 52000, dislikes: 600, favorites: 14000, uploadedAt: "2026-11-03", quality: "1080p", fps: 60, fullLength: false, src: STREAMS.bullrun, palette: ["#4ade80", "#f43f5e", "#06100a"], chapters: ch([0, "Route"], [200, "Skips"], [500, "Final run"]) },
  { id: "v20", title: "Low-Poly Island Diorama - Relaxing Timelapse", description: "Six hours of modelling compressed into a calm timelapse.", creator: "BlenderMaster", category: "3d-animation", tags: ["Animation", "Tutorial", "4K"], duration: 540, views: 2000000, likes: 84000, dislikes: 900, favorites: 37000, uploadedAt: "2026-10-24", quality: "4K", fps: 30, fullLength: false, src: STREAMS.fun, palette: ["#2dd4bf", "#fde68a", "#041615"], chapters: ch([0, "Terrain"], [5, "Props"], [10, "Water"]) },
];

const commentAuthors = ["render_nerd", "polyCount", "midnightVJ", "frame_by_frame", "lumen_lover", "cel_shade", "orbit_cam", "keyframe_kid", "glitchgarden", "pixel_pusher", "nodegraph", "softbody"];
const commentTexts = [
  "The lighting at 02:15 is unreal, how long did that take to render?",
  "Watched this in 4K on a big screen. Incredible detail.",
  "That transition at 01:05 is so smooth.",
  "Would love a breakdown of the shading setup!",
  "Saving this to my Watch Later for the weekend.",
  "Colour grade is perfect. Very cinematic.",
  "Jump to 00:42 for the best shot of the whole video.",
  "This channel never misses.",
  "The sound design carries this so hard.",
  "How many samples did you use for the final render?",
  "Bookmarking 03:30 for reference, thanks!",
  "60fps makes the motion feel buttery.",
];

/** 24 deterministic seed comments per video. */
export function seedComments(videoId: string): CommentItem[] {
  const n = parseInt(videoId.replace(/\D/g, "") || "1", 10);
  return Array.from({ length: 24 }, (_, i) => ({
    id: `${videoId}-c${i}`,
    videoId,
    author: commentAuthors[(i + n) % commentAuthors.length],
    text: commentTexts[(i * 5 + n) % commentTexts.length],
    postedAt: new Date(NOW - (i * 7 + n) * 3600_000).toISOString(),
    likes: ((i + 3) * (n + 7) * 13) % 900,
  }));
}

export const getChannel = (handle: string) => channels.find((c) => c.handle.toLowerCase() === handle.toLowerCase());
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

/** Static export: uploaded videos and custom playlists use pre-built page slots. */
export const UPLOAD_SLOTS = Array.from({ length: 24 }, (_, i) => `upload-${i + 1}`);
export const PLAYLIST_SLOTS = Array.from({ length: 12 }, (_, i) => `custom-${i + 1}`);
