import { cuesFor, clock, toChapterList, toSrt, youtubeDescription } from "./captions.js";
import { drawFrame } from "./draw.js";
import { EPISODE_SECONDS, episodeByNumber, episodes } from "./episodes.js";
import { worldAt } from "./state.js";

const canvas = document.querySelector("#film");
const live = document.querySelector("#live");
const stage = document.querySelector("#stage");
const playButton = document.querySelector("#play");
const timeLabel = document.querySelector("#time");
const scrub = document.querySelector("#scrub");
const episodeList = document.querySelector("#episode-list");
const speakBox = document.querySelector("#speak");
const captionBox = document.querySelector("#burn");
const chromeBox = document.querySelector("#chrome");
const speedBox = document.querySelector("#speed");
const blurb = document.querySelector("#blurb");
const episodeHeading = document.querySelector("#episode-heading");

const params = new URLSearchParams(location.search);
let episode = episodeByNumber(Number(params.get("e")) || 1);
let time = clampTime(Number(params.get("t")) || 0);
let playing = false;
let speed = 1;
let lastTick = performance.now();
let spokenIndex = -1;
let lastUrlKey = "";
const leftWorld = worldAt(1, 720);

const ctx = canvas.getContext("2d");

for (const item of episodes) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "episode";
  button.dataset.episode = String(item.number);
  button.innerHTML = `<span>第 ${item.number} 集 · ${item.yearStart}</span><strong>${item.title}</strong>`;
  button.addEventListener("click", () => selectEpisode(item.number, 0));
  episodeList.append(button);
}

playButton.addEventListener("click", toggle);
document.querySelector("#prev").addEventListener("click", () => skipChapter(-1));
document.querySelector("#next").addEventListener("click", () => skipChapter(1));
scrub.addEventListener("input", () => {
  seek(Number(scrub.value));
});
speedBox.addEventListener("change", () => {
  speed = Number(speedBox.value);
  if (speed !== 1) window.speechSynthesis?.cancel();
});
chromeBox.addEventListener("change", () => {
  document.body.classList.toggle("recording", chromeBox.checked);
});
document.querySelector("#srt").addEventListener("click", () => download(toSrt(episode), srtName(episode), "application/x-subrip"));
document.querySelector("#chapters").addEventListener("click", () => download(toChapterList(episode), chapterName(episode), "text/plain"));
document.querySelector("#copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(youtubeDescription(episode));
  document.querySelector("#copy").textContent = "已複製";
  setTimeout(() => {
    document.querySelector("#copy").textContent = "複製 YouTube 說明";
  }, 1200);
});

window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  if (event.code === "Space") {
    event.preventDefault();
    toggle();
  } else if (event.code === "ArrowRight") {
    skipChapter(1);
  } else if (event.code === "ArrowLeft") {
    skipChapter(-1);
  }
});

window.addEventListener("resize", resize);
resize();
render();
if (params.has("shot")) {
  requestAnimationFrame(() => {
    render();
    document.body.dataset.shot = "ready";
  });
} else {
  requestAnimationFrame(tick);
}

function tick(now) {
  const delta = Math.min(0.1, (now - lastTick) / 1000);
  lastTick = now;
  if (playing) {
    time += delta * speed;
    if (time >= EPISODE_SECONDS) {
      time = EPISODE_SECONDS;
      playing = false;
      playButton.textContent = "播放";
      window.speechSynthesis?.cancel();
    }
    maybeSpeak();
  }
  render();
  requestAnimationFrame(tick);
}

function render() {
  const world = worldAt(episode.number, time);
  const cues = cuesFor(episode);
  const cue = cues.find((item) => time >= item.start && time < item.end) ?? null;
  const chapterIndex = Math.min(episode.chapters.length - 1, Math.floor(time / episode.chapterSeconds));
  const chapter = episode.chapters[chapterIndex];
  const split = episode.number === 12 && time >= 1260 && time < 1440;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const bufferW = Math.max(2, Math.round(cssWidth * dpr));
  const bufferH = Math.max(2, Math.round(cssHeight * dpr));
  if (canvas.width !== bufferW || canvas.height !== bufferH) {
    canvas.width = bufferW;
    canvas.height = bufferH;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(ctx, cssWidth, cssHeight, {
    world,
    leftWorld,
    split,
    time,
    showText: captionBox.checked,
    titleCard: time < 8,
    episodeTitle: episode.title,
    years: `${episode.yearStart}–${episode.yearEnd}`,
    chapterTitle: `${clock(chapterIndex * episode.chapterSeconds)}  ${chapter.title}`,
    caption: cue?.text ?? "",
  });
  const caption = cue?.text ?? "";
  if (live.textContent !== caption) live.textContent = caption;
  stage.dataset.caption = caption;
  stage.dataset.chapter = chapter.title;
  timeLabel.textContent = `${clock(time)} / 30:00`;
  if (Number(scrub.value) !== Math.floor(time)) scrub.value = String(Math.floor(time));
  playButton.textContent = playing ? "暫停" : "播放";
  episodeHeading.textContent = `第 ${episode.number} 集 · ${episode.yearStart}–${episode.yearEnd} · ${episode.title}`;
  blurb.textContent = youtubeDescription(episode);
  for (const button of episodeList.querySelectorAll(".episode")) {
    button.classList.toggle("is-active", Number(button.dataset.episode) === episode.number);
  }
  const urlKey = `${episode.number}:${Math.floor(time)}`;
  if (urlKey !== lastUrlKey) {
    lastUrlKey = urlKey;
    const url = new URL(location.href);
    url.searchParams.set("e", String(episode.number));
    url.searchParams.set("t", String(Math.floor(time)));
    history.replaceState(null, "", url);
  }
}

function toggle() {
  playing = !playing;
  if (!playing) window.speechSynthesis?.cancel();
  if (playing) maybeSpeak(true);
}

function selectEpisode(number, nextTime) {
  window.speechSynthesis?.cancel();
  episode = episodeByNumber(number);
  time = clampTime(nextTime);
  spokenIndex = -1;
  render();
}

function seek(next) {
  window.speechSynthesis?.cancel();
  time = clampTime(next);
  spokenIndex = currentCueIndex();
  render();
}

function skipChapter(direction) {
  const index = Math.floor(time / episode.chapterSeconds) + direction;
  const next = Math.max(0, Math.min(episode.chapters.length - 1, index));
  seek(next * episode.chapterSeconds);
  if (playing && speed === 1) maybeSpeak(true);
}

function maybeSpeak(force = false) {
  if (!speakBox.checked || speed !== 1 || !window.speechSynthesis) return;
  const index = currentCueIndex();
  if (index < 0) return;
  if (!force && index === spokenIndex) return;
  spokenIndex = index;
  const cue = cuesFor(episode)[index];
  if (Math.abs(time - cue.start) > 1.2 && !force) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cue.text);
  utterance.lang = "en-US";
  utterance.rate = 0.96;
  window.speechSynthesis.speak(utterance);
}

function currentCueIndex() {
  const cues = cuesFor(episode);
  return cues.findIndex((item) => time >= item.start && time < item.end);
}

function resize() {
  render();
}

function download(contents, filename, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function srtName(item) {
  return `shambhala-2451-e${String(item.number).padStart(2, "0")}.srt`;
}

function chapterName(item) {
  return `shambhala-2451-e${String(item.number).padStart(2, "0")}-chapters.txt`;
}

function clampTime(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(EPISODE_SECONDS, value));
}
