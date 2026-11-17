import { EPISODE_SECONDS } from "./episodes.js";

const CAMP = [0.08, 0.52, 0.64, 0.72, 0.8, 0.84, 1, 0.96, 0.9, 0.82, 0.58, 0.22];
const ARMY = [0.06, 0.12, 0.16, 0.2, 0.38, 0.42, 0.92, 0.86, 0.7, 0.58, 0.5, 0.12];
const ROOTS = [0, 0, 0, 0, 0, 0, 1, 1, 0.92, 0.72, 0.4, 0.08];
const PEACE = [0, 0, 0, 0.02, 0, 0, 0, 0.16, 0.28, 0.46, 0.58, 1];

export function worldAt(number, time) {
  const ep = number;
  const u = clamp(time / EPISODE_SECONDS, 0, 1);
  const yearStart = 2451 + (ep - 1) * 10;
  return {
    ep,
    t: time,
    u,
    year: yearStart + u * 10,
    yearStart,
    camp: ramp(CAMP, ep, u),
    army: ramp(ARMY, ep, u),
    roots: ramp(ROOTS, ep, u),
    peace: ramp(PEACE, ep, u),
    embargo: embargoAmount(ep, u),
    breach: breachAmount(ep, u),
    second: secondAmount(ep, u),
    ninth: ninthAmount(ep, u),
    reveal: ep === 1 ? clamp((time - 300) / 160, 0, 1) : 1,
    drill: ep === 1 ? clamp(time / 360, 0, 1) : 1,
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smooth(u) {
  return u * u * (3 - 2 * u);
}

function lerp(a, b, u) {
  return a + (b - a) * u;
}

function ramp(keys, ep, u) {
  const current = keys[ep - 1];
  const previous = ep === 1 ? keys[0] * 0.25 : keys[ep - 2];
  return lerp(previous, current, smooth(u));
}

function embargoAmount(ep, u) {
  if (ep < 5) return 0;
  if (ep === 5) return smooth(clamp(u / 0.22, 0, 1));
  if (ep === 6) return lerp(0.85, 0.3, u);
  return Math.max(0, 0.28 - (ep - 6) * 0.08);
}

function breachAmount(ep, u) {
  if (ep !== 6) return 0;
  if (u < 0.46) return 0;
  if (u < 0.62) return (u - 0.46) / 0.16;
  if (u < 0.86) return 1 - (u - 0.62) / 0.32;
  return 0.12;
}

function secondAmount(ep, u) {
  if (ep < 11) return 0;
  if (ep === 11) return smooth(clamp((u - 0.12) / 0.55, 0, 1));
  return 0.42;
}

function ninthAmount(ep, u) {
  if (ep < 10) return 0;
  if (ep === 10) return smooth(clamp((u - 0.04) / 0.4, 0, 1));
  return 1;
}
