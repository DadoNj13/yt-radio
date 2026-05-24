import { navigate } from '../app/router';
import {
  cycleRepeat,
  getState,
  next,
  play,
  previous,
  seek,
  setVolume,
  subscribe,
  togglePlay,
  toggleShuffle,
} from '../player/queue';
import { getSettings } from '../store';
import { formatTime } from './format';
import {
  iconExpand,
  iconNext,
  iconPause,
  iconPlay,
  iconPrev,
  iconRepeat,
  iconRepeatOne,
  iconShuffle,
  iconVolume,
} from './icons';
import { thumbnailUrl } from '../player/url';

let barEl: HTMLElement | null = null;
let scrubbing = false;

export function mountPlayerBar(parent: HTMLElement): void {
  const bar = document.createElement('footer');
  bar.className = 'player-bar glass-strong hidden';
  bar.id = 'player-bar';
  bar.innerHTML = `
    <div class="player-track">
      <img id="pb-thumb" src="" alt="" />
      <div class="info">
        <h4 id="pb-title">—</h4>
        <p id="pb-channel">—</p>
      </div>
    </div>
    <div class="player-controls">
      <div class="player-buttons">
        <button type="button" class="btn-icon" id="pb-shuffle" title="Shuffle">${iconShuffle}</button>
        <button type="button" class="btn-icon" id="pb-prev" title="Previous">${iconPrev}</button>
        <button type="button" class="play-btn" id="pb-play" title="Play">${iconPlay}</button>
        <button type="button" class="btn-icon" id="pb-next" title="Next">${iconNext}</button>
        <button type="button" class="btn-icon" id="pb-repeat" title="Repeat">${iconRepeat}</button>
      </div>
      <div class="player-scrub">
        <span id="pb-cur">0:00</span>
        <input type="range" id="pb-scrub" min="0" max="100" value="0" />
        <span id="pb-dur">0:00</span>
      </div>
    </div>
    <div class="player-extra">
      <button type="button" class="btn-icon" id="pb-expand" title="Now playing">${iconExpand}</button>
      <div class="volume-wrap">
        ${iconVolume}
        <input type="range" id="pb-vol" min="0" max="100" />
      </div>
    </div>
  `;
  parent.appendChild(bar);
  barEl = bar;

  bar.querySelector('#pb-play')?.addEventListener('click', () => {
    const s = getState();
    if (!s.videoId) return;
    if (s.status === 'idle' || s.status === 'paused') play();
    else togglePlay();
  });
  bar.querySelector('#pb-prev')?.addEventListener('click', () => void previous());
  bar.querySelector('#pb-next')?.addEventListener('click', () => void next());
  bar.querySelector('#pb-shuffle')?.addEventListener('click', () => toggleShuffle());
  bar.querySelector('#pb-repeat')?.addEventListener('click', () => cycleRepeat());
  bar.querySelector('#pb-expand')?.addEventListener('click', () => navigate({ name: 'now-playing' }));

  const scrub = bar.querySelector('#pb-scrub') as HTMLInputElement;
  scrub.addEventListener('input', () => {
    scrubbing = true;
    const s = getState();
    const t = (parseFloat(scrub.value) / 100) * (s.duration || 0);
    (bar.querySelector('#pb-cur') as HTMLElement).textContent = formatTime(t);
  });
  scrub.addEventListener('change', () => {
    const s = getState();
    const t = (parseFloat(scrub.value) / 100) * (s.duration || 1);
    seek(t);
    scrubbing = false;
  });

  const vol = bar.querySelector('#pb-vol') as HTMLInputElement;
  vol.value = String(getSettings().volume);
  vol.addEventListener('input', () => setVolume(parseInt(vol.value, 10)));

  subscribe(updatePlayerBar);
}

export function updatePlayerBar(): void {
  if (!barEl) return;
  const s = getState();
  const settings = getSettings();

  if (!s.videoId) {
    barEl.classList.add('hidden');
    return;
  }
  barEl.classList.remove('hidden');

  const thumb = barEl.querySelector('#pb-thumb') as HTMLImageElement;
  thumb.src = thumbnailUrl(s.videoId);
  thumb.alt = s.title;
  (barEl.querySelector('#pb-title') as HTMLElement).textContent = s.title;
  (barEl.querySelector('#pb-channel') as HTMLElement).textContent = s.channel;

  const playBtn = barEl.querySelector('#pb-play')!;
  const playing = s.status === 'playing' || s.status === 'buffering';
  playBtn.innerHTML = playing ? iconPause : iconPlay;

  barEl.querySelector('#pb-shuffle')?.classList.toggle('active', settings.shuffle);

  const repeatBtn = barEl.querySelector('#pb-repeat')!;
  repeatBtn.classList.toggle('active', settings.repeat !== 'off');
  repeatBtn.innerHTML = settings.repeat === 'one' ? iconRepeatOne : iconRepeat;

  if (!scrubbing) {
    const scrub = barEl.querySelector('#pb-scrub') as HTMLInputElement;
    const pct = s.duration > 0 ? (s.currentTime / s.duration) * 100 : 0;
    scrub.value = String(pct);
    (barEl.querySelector('#pb-cur') as HTMLElement).textContent = formatTime(s.currentTime);
    (barEl.querySelector('#pb-dur') as HTMLElement).textContent = formatTime(s.duration);
  }

  const vol = barEl.querySelector('#pb-vol') as HTMLInputElement;
  vol.value = String(settings.volume);
}
