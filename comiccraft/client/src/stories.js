// Local-first story engine. The browser can run the full ComicCraft flow without
// a backend or API key, while keeping the story shape compatible with the PDF's
// Gemini/FastAPI pipeline: outline -> narration -> illustrations -> export.

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.stories || [];
}

const valid = (story) =>
  story?.title &&
  Array.isArray(story.panels) &&
  story.panels.every((panel) => Array.isArray(panel.dialogue));

const toneEmotion = {
  "Light-hearted": "Happy",
  Dramatic: "Sad",
  Poetic: "Surprised",
  Funny: "Angry",
};

export async function getStories(emotion, idea = "", link = "") {
  const local = await fetchJson("/stories.json");
  let external = [];

  // A bad optional feed should not prevent the built-in experience from working.
  if (link.trim()) {
    try {
      external = await fetchJson(link.trim());
    } catch {
      external = [];
    }
  }

  const all = [...local, ...external].filter(valid);
  const matches = all.filter(
    (story) => story.emotion?.toLowerCase() === emotion.toLowerCase(),
  );

  if (!matches.length) {
    throw new Error(`No ${emotion} stories found in the source.`);
  }

  const words = idea
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2);
  const score = (story) => {
    const text = JSON.stringify(story).toLowerCase();
    return words.filter((word) => text.includes(word)).length + Math.random() * 0.15;
  };

  return matches
    .sort((a, b) => score(b) - score(a))
    .slice(0, 5)
    .map((story) => ({ ...story, characters: story.characters || [] }));
}

const narrationByTone = {
  "Light-hearted": [
    "A bright new chapter begins, and even the smallest mistake feels like an invitation to play.",
    "The world opens up in a burst of color as courage takes the lead.",
    "A surprising turn sends the hero racing forward with a grin and a little bit of luck.",
    "Friends gather close, turning a narrow escape into a memory worth keeping.",
    "With the sky glowing overhead, the adventure ends exactly where a new one can begin.",
  ],
  Dramatic: [
    "The air grows still as the hero steps toward a choice that cannot be undone.",
    "Every shadow seems to remember what was lost, but the path still leads onward.",
    "A fragile truth surfaces beneath the noise, asking to be faced with open eyes.",
    "The danger passes, leaving behind a quiet kind of strength.",
    "At the edge of the unknown, the hero chooses hope over the easy way out.",
  ],
  Poetic: [
    "The first clue arrives like a whisper carried on a silver breeze.",
    "Colors shift around the hero, making the ordinary world feel newly enchanted.",
    "A hidden answer glimmers for one breath beneath the surface of the scene.",
    "The pieces settle into place with the soft rhythm of a distant song.",
    "The final light lingers, promising that wonder has not finished with them yet.",
  ],
  Funny: [
    "The plan begins beautifully, which is exactly how everyone knows something ridiculous is about to happen.",
    "One heroic pose, two dramatic pauses, and absolutely no idea what comes next.",
    "The problem gets bigger, louder, and somehow much funnier than it was five seconds ago.",
    "A last-second rescue arrives with terrible timing and surprisingly perfect results.",
    "The adventure closes with a laugh, a snack, and a promise to never do that again.",
  ],
};

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `comic-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function titleFrom(story, character, setting) {
  if (character && setting) return `${character} and the ${setting} Secret`;
  return story.title;
}

export async function generateComic({
  prompt,
  character,
  setting,
  tone,
  style,
  link = "",
}) {
  const emotion = toneEmotion[tone] || "Happy";
  const stories = await getStories(emotion, prompt, link);
  const source = stories[0];
  const sourceHero = source.characters?.[0]?.name;
  const hero = character.trim() || sourceHero || "Ari";
  const settingLabel = setting || "a world of possibility";
  const toneLines = narrationByTone[tone] || narrationByTone["Light-hearted"];

  const panels = source.panels.slice(0, 4).map((panel, index) => ({
    ...panel,
    title: panel.title || `Panel ${index + 1}: ${index === 0 ? "A New Chapter" : "The Next Turn"}`,
    scene: `${panel.scene}${setting ? `, reimagined in ${setting.toLowerCase()}` : ""}`,
    caption: panel.caption || `A ${tone.toLowerCase()} moment in ${setting.toLowerCase()}.`,
    imagePrompt: `${style} illustration of ${panel.scene} in ${setting.toLowerCase()}, expressive anime composition, cohesive character design.`,
    narration: toneLines[index],
    dialogue: panel.dialogue.map((line) => ({
      ...line,
      speaker: line.speaker === sourceHero ? hero : line.speaker,
    })),
  }));

  panels.push({
    title: "Panel 5: A New Beginning",
    scene: `${hero} stands at the edge of ${settingLabel.toLowerCase()}, watching a new dawn paint the sky.`,
    caption: "The next chapter waits beyond the horizon.",
    imagePrompt: `${style} illustration of ${hero} facing a glowing dawn over ${settingLabel.toLowerCase()}, hopeful anime finale, cinematic light.`,
    narration: toneLines[4],
    dialogue: [{ speaker: hero, text: "This is only the beginning." }],
  });

  return {
    id: makeId(),
    title: titleFrom(source, hero, setting),
    summary: `${source.summary} Reimagined as a ${style.toLowerCase()} ${tone.toLowerCase()} adventure in ${setting.toLowerCase()}.`,
    prompt,
    character: hero,
    setting,
    tone,
    style,
    sourceTitle: source.title,
    characters: [{ name: hero, role: "lead" }, ...(source.characters || []).slice(1)],
    panels,
  };
}

const KEY = "comiccraft.comics";

export function loadComics() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveComic(comic) {
  const saved = { ...comic, id: comic.id || makeId(), savedAt: Date.now() };
  const list = loadComics().filter((item) => item.id !== saved.id);
  localStorage.setItem(KEY, JSON.stringify([saved, ...list]));
  return saved;
}

export function removeComic(id) {
  localStorage.setItem(KEY, JSON.stringify(loadComics().filter((item) => item.id !== id)));
}
