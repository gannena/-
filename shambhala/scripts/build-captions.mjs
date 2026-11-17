import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { toChapterList, toSrt } from "../js/captions.js";
import { episodes } from "../js/episodes.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const subtitleDir = join(root, "subtitles");
mkdirSync(subtitleDir, { recursive: true });

for (const episode of episodes) {
  const label = String(episode.number).padStart(2, "0");
  writeFileSync(join(subtitleDir, `episode-${label}.srt`), toSrt(episode));
  writeFileSync(join(subtitleDir, `episode-${label}-chapters.txt`), `${toChapterList(episode)}\n`);
}

console.log(`wrote ${episodes.length * 2} caption files`);
