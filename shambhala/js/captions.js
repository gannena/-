import { EPISODE_SECONDS } from "./episodes.js";

const WORDS_PER_SECOND = 2.35;

export function cuesFor(episode) {
  return episode.chapters.map((chapter, index) => {
    const start = index * episode.chapterSeconds;
    const words = chapter.text.trim().split(/\s+/).filter(Boolean).length;
    const duration = Math.min(42, Math.max(8, words / WORDS_PER_SECOND));
    const end = Math.min(start + duration, EPISODE_SECONDS);
    return {
      index,
      start,
      end,
      title: chapter.title,
      text: chapter.text.trim(),
    };
  });
}

export function toSrt(episode) {
  return cuesFor(episode)
    .map((cue, index) => {
      const body = cue.text.replace(/\s+/g, " ").trim();
      return `${index + 1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${body}\n`;
    })
    .join("\n");
}

export function toChapterList(episode) {
  return episode.chapters
    .map((chapter, index) => {
      const title = index === 0 ? `${chapter.title} — ${episode.title}` : chapter.title;
      return `${clock(index * episode.chapterSeconds)} ${title}`;
    })
    .join("\n");
}

export function youtubeDescription(episode) {
  const label = String(episode.number).padStart(2, "0");
  return [
    episode.kicker,
    "",
    "Shambhala 2451 — The City Below the War",
    `Episode ${label} · ${episode.yearStart}–${episode.yearEnd} · ${episode.title}`,
    "",
    "A fictional simulation documentary in English.",
    "Upload this episode's .srt file with the video, then turn on auto-translate so viewers can read subtitles in their own language. Words drawn inside the picture are not translated by YouTube.",
    "",
    toChapterList(episode),
    "",
  ].join("\n");
}

export function stamp(seconds) {
  const total = Math.max(0, seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  const millis = Math.round((total - Math.floor(total)) * 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${String(millis).padStart(3, "0")}`;
}

export function clock(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}
