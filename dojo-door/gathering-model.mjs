export const GATHERING_START_MINUTES = 20 * 60;
export const GATHERING_LENGTH_MS = 20 * 60 * 1000;
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function taipeiParts(now) {
  const shifted = new Date(now + TAIPEI_OFFSET_MS);
  return {year:shifted.getUTCFullYear(), month:shifted.getUTCMonth() + 1, day:shifted.getUTCDate()};
}

export function taipeiDayId(parts) {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function taipeiMidnight(year, month, day) {
  return Date.UTC(year, month - 1, day) - TAIPEI_OFFSET_MS;
}

export function gatheringWindow(now) {
  const parts = taipeiParts(now);
  const startsAt = taipeiMidnight(parts.year, parts.month, parts.day) + GATHERING_START_MINUTES * 60 * 1000;
  const endsAt = startsAt + GATHERING_LENGTH_MS;
  const open = now >= startsAt && now < endsAt;
  return {id:taipeiDayId(parts), open, startsAt, endsAt, nextStartsAt:now < endsAt ? startsAt : startsAt + DAY_MS};
}

export function formatTaipeiClock(ms) {
  const shifted = new Date(ms + TAIPEI_OFFSET_MS);
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const hour = String(shifted.getUTCHours()).padStart(2, '0');
  const minute = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hour}:${minute}`;
}

export function countdownText(now, target) {
  const total = Math.max(0, Math.floor((target - now) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours} 小時 ${String(minutes).padStart(2, '0')} 分`;
  return `${minutes} 分 ${String(seconds).padStart(2, '0')} 秒`;
}

export function doorCopy(view) {
  const open = Boolean(view.open);
  const confirmed = Number(view.confirmed) || 0;
  const lit = Boolean(view.lit);
  const when = view.preview
    ? '正式開殿仍是每天台北時間 20:00–20:20。'
    : open
      ? `本場進行到 ${formatTaipeiClock(view.endsAt)}（台北時間）。`
      : `每天台北時間 20:00–20:20。下一場 ${formatTaipeiClock(view.nextStartsAt)}。`;
  let title;
  let state;
  let button;
  let buttonDisabled;
  let mode;
  if (view.preview) {
    title = lit ? '練習燈亮了。兩個分頁都在。' : '練習場。再開一個分頁，一起點這盞燈。';
    state = '這只在這個瀏覽器裡練習，不算正式開殿，也不算真人。';
    if (lit) {
      button = '練習燈已亮';
      buttonDisabled = true;
      mode = 'lit';
    } else if (view.selfConfirmed) {
      button = '已在這個分頁，等另一個分頁';
      buttonDisabled = true;
      mode = 'waiting-other';
    } else {
      button = '我在這個分頁';
      buttonDisabled = false;
      mode = 'confirm';
    }
  } else if (!open) {
    title = view.now < view.startsAt ? '今晚八點，一起點一盞燈。' : '下一場是明天晚上八點。';
    state = `距離下一場還有 ${countdownText(view.now, view.nextStartsAt)}。一個人點不亮，要有第二位登入的真人一起確認。模擬信眾不算。`;
    button = '20:00 開殿';
    buttonDisabled = true;
    mode = 'wait';
  } else if (lit) {
    title = '燈亮了。兩位真人在同一場。';
    state = `本場已有 ${confirmed} 位真人一起點燈。這盞燈沒有功德加成，只是讓彼此知道有人在。`;
    button = view.selfConfirmed ? '本場已一起點燈' : '我也在這一場';
    buttonDisabled = Boolean(view.selfConfirmed);
    mode = view.selfConfirmed ? 'lit' : 'confirm';
  } else if (view.selfConfirmed) {
    title = '開殿了。還差一位真人。';
    state = '您已在場。再等一位真人確認，燈才會亮。模擬信眾不算。';
    button = '已在場，等另一位';
    buttonDisabled = true;
    mode = 'waiting-other';
  } else if (!view.signedIn) {
    title = '開殿了。還差一位真人。';
    state = '登入後才能把您算進這一場。未登入不會被當成在場。模擬信眾不算。';
    button = '登入後一起點燈';
    buttonDisabled = false;
    mode = 'login';
  } else {
    title = '開殿了。還差一位真人。';
    state = confirmed === 0 ? '目前還沒有真人確認。您按下之後，還要再一位，燈才會亮。' : `已有 ${confirmed} 位真人確認。再一位，燈就會亮。`;
    button = '我在，一起點燈';
    buttonDisabled = false;
    mode = 'confirm';
  }
  if (view.online == null && !view.preview) state = `暫時讀不到殿內人數。開殿時間仍照台北時間。${state}`;
  return {title, when, state, button, buttonDisabled, mode};
}
