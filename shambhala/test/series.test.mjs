import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { cuesFor, toChapterList, toSrt } from "../js/captions.js";
import { EPISODE_SECONDS, episodes } from "../js/episodes.js";
import { worldAt } from "../js/state.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("twelve episodes cover 120 years from 2451", () => {
  assert.equal(episodes.length, 12);
  assert.equal(episodes[0].yearStart, 2451);
  assert.equal(episodes[11].yearEnd, 2571);
  assert.equal(episodes[11].yearEnd - episodes[0].yearStart, 120);
  for (let index = 0; index < episodes.length; index += 1) {
    const episode = episodes[index];
    assert.equal(episode.number, index + 1);
    assert.equal(episode.yearEnd - episode.yearStart, 10);
    assert.equal(episode.chapters.length, 10);
    if (index > 0) assert.equal(episode.yearStart, episodes[index - 1].yearEnd);
  }
});

test("each chapter is speakable English and fits its three minutes", () => {
  for (const episode of episodes) {
    const seen = new Set();
    const cues = cuesFor(episode);
    assert.equal(cues.length, 10);
    for (const cue of cues) {
      assert.equal(seen.has(cue.title), false);
      seen.add(cue.title);
      const words = cue.text.split(/\s+/).filter(Boolean);
      assert.ok(words.length >= 18 && words.length <= 80, `${episode.number} ${cue.title}: ${words.length} words`);
      assert.ok(cue.start >= 0 && cue.end <= EPISODE_SECONDS);
      assert.ok(cue.end - cue.start <= 42);
      assert.equal(cue.end <= (cue.index + 1) * 180, true);
      assert.match(cue.text, /^[A-Z0-9]/);
    }
    assert.equal(cues[0].start, 0);
    assert.match(toChapterList(episode), /^0:00 /);
  }
});

test("the picture follows the story beats", () => {
  assert.equal(worldAt(1, 0).reveal, 0);
  assert.equal(worldAt(1, 700).reveal, 1);
  assert.equal(worldAt(6, 120).breach, 0);
  assert.ok(worldAt(6, 1000).breach > 0.5);
  assert.ok(worldAt(10, 1000).ninth > 0.8);
  assert.ok(worldAt(11, 1200).second > 0.6);
  assert.ok(worldAt(12, 1700).peace > 0.7);
  assert.equal(Math.floor(worldAt(12, 1800).year), 2571);
});

test("committed subtitles match the episode text", () => {
  for (const episode of episodes) {
    const label = String(episode.number).padStart(2, "0");
    const srt = readFileSync(join(root, "subtitles", `episode-${label}.srt`), "utf8");
    const chapters = readFileSync(join(root, "subtitles", `episode-${label}-chapters.txt`), "utf8");
    assert.equal(srt, toSrt(episode));
    assert.equal(chapters, `${toChapterList(episode)}\n`);
  }
});
