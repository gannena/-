import {doorCopy, gatheringWindow} from './gathering-model.mjs';

const $ = id => document.getElementById(id);
const preview = new URLSearchParams(location.search).get('gathering') === 'preview';
const seat = preview ? (sessionStorage.getItem('gathering-preview-seat') || crypto.randomUUID()) : '';
if (preview) sessionStorage.setItem('gathering-preview-seat', seat);

let skew = 0;
let view = null;
let mine = false;
const others = new Set();
const channel = preview ? new BroadcastChannel('xuancheng-gathering-door') : null;

function previewState() {
  const now = Date.now();
  const confirmed = (mine ? 1 : 0) + others.size;
  return {
    preview:true,
    open:true,
    lit:confirmed >= 2,
    confirmed,
    selfConfirmed:mine,
    signedIn:true,
    online:0,
    now,
    startsAt:now,
    endsAt:now + 20 * 60 * 1000,
    nextStartsAt:now,
  };
}

export function applyDoor(next) {
  view = next;
  const copy = doorCopy(next);
  $('gathering-title').textContent = copy.title;
  $('gathering-when').textContent = copy.when;
  $('gathering-state').textContent = copy.state;
  $('gathering-online').textContent = next.online == null ? '—' : String(next.online);
  $('gathering-confirmed').textContent = String(next.confirmed);
  $('gathering-lamp').classList.toggle('lit', Boolean(next.lit));
  const button = $('gathering-join');
  button.textContent = copy.button;
  button.disabled = copy.buttonDisabled;
  button.dataset.mode = copy.mode;
  $('gathering-preview').hidden = !next.preview;
}

function fromServer(data) {
  skew = data.serverTime - Date.now();
  return {
    ...data.window,
    now:data.serverTime,
    online:data.online,
    confirmed:data.confirmed,
    lit:data.lit,
    signedIn:data.signedIn,
    selfConfirmed:data.selfConfirmed,
  };
}

async function load() {
  if (!document.body.classList.contains('welcome')) return;
  if (preview) {
    applyDoor(previewState());
    return;
  }
  try {
    const response = await fetch('/api/temple-gathering', {headers:{accept:'application/json'}});
    if (!response.ok) throw new Error('gathering');
    applyDoor(fromServer(await response.json()));
  } catch {
    const window = gatheringWindow(Date.now());
    applyDoor({...window, now:Date.now(), online:null, confirmed:0, lit:false, signedIn:false, selfConfirmed:false});
  }
}

$('gathering-join').addEventListener('click', async () => {
  const mode = $('gathering-join').dataset.mode;
  if (mode === 'login') {
    location.href = '/api/temple-auth/login';
    return;
  }
  if (mode !== 'confirm') return;
  if (preview) {
    mine = true;
    channel.postMessage({type:'join', id:seat});
    applyDoor(previewState());
    return;
  }
  $('gathering-join').disabled = true;
  try {
    const response = await fetch('/api/temple-gathering', {method:'POST', headers:{'content-type':'application/json', accept:'application/json'}, body:'{}'});
    const data = await response.json();
    if (data.window) applyDoor(fromServer(data));
    else if (response.status === 401) applyDoor({...view, signedIn:false, selfConfirmed:false});
  } catch {
    $('gathering-state').textContent = '暫時無法確認。請稍後再按一次。';
  }
});

if (channel) {
  channel.onmessage = event => {
    const data = event.data || {};
    if (data.id && data.id !== seat && (data.type === 'join' || data.type === 'here')) others.add(data.id);
    if (data.type === 'ask' && mine) channel.postMessage({type:'here', id:seat});
    applyDoor(previewState());
  };
  channel.postMessage({type:'ask', id:seat});
}

load();
setInterval(load, 4000);
setInterval(() => {
  if (!view || view.open || view.preview || !document.body.classList.contains('welcome')) return;
  applyDoor({...view, now:Date.now() + skew});
}, 1000);
