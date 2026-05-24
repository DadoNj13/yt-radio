import {
  addStation,
  addTrack,
  exportJson,
  getStations,
  importJson,
  removeStation,
  removeTrack,
  reorderTrack,
  resetToSeed,
  slugId,
  subscribe,
} from '../../store';
import type { Station, Track } from '../../types';
import { parseYouTubeId, fetchOEmbed, youtubeWatchUrl, thumbnailUrl } from '../../player/url';
import { escapeHtml } from '../shell';
import { toast } from '../toast';

export function renderDj(el: HTMLElement): void {
  const render = () => {
    const stations = getStations();

    el.innerHTML = `
      <h1 class="page-title">DJ</h1>
      <p style="color: var(--text-secondary); margin: -12px 0 20px;">Paste YouTube links, build stations, and save to this browser.</p>
      <div class="dj-toolbar">
        <button type="button" class="btn-secondary" id="dj-export">Export backup</button>
        <label class="btn-secondary" style="cursor: pointer">
          Import backup
          <input type="file" id="dj-import" accept="application/json" hidden />
        </label>
        <button type="button" class="btn-secondary btn-danger" id="dj-reset">Reset to defaults</button>
      </div>

      <div class="dj-panel glass" style="padding: 24px; border-radius: var(--radius-lg); margin-bottom: 32px">
        <h2 style="font-size: 1.1rem; margin-bottom: 16px">Add track</h2>
        <form class="dj-form" id="dj-add-track">
          <label for="dj-url">YouTube URL or video ID</label>
          <input type="text" id="dj-url" placeholder="https://www.youtube.com/watch?v=…" required />
          <label for="dj-station-select">Station</label>
          <select id="dj-station-select">
            ${stations.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
          </select>
          <button type="submit" class="btn-primary" style="align-self: flex-start">Add to station</button>
        </form>
      </div>

      <div class="dj-panel glass" style="padding: 24px; border-radius: var(--radius-lg); margin-bottom: 32px">
        <h2 style="font-size: 1.1rem; margin-bottom: 16px">New station</h2>
        <form class="dj-form" id="dj-add-station">
          <label for="dj-station-name">Name</label>
          <input type="text" id="dj-station-name" placeholder="e.g. Jazz" required />
          <label for="dj-station-emoji">Emoji (optional)</label>
          <input type="text" id="dj-station-emoji" placeholder="🎷" maxlength="4" />
          <label for="dj-station-accent">Accent color</label>
          <input type="color" id="dj-station-accent" value="#a78bfa" />
          <button type="submit" class="btn-secondary" style="align-self: flex-start">Create station</button>
        </form>
      </div>

      <div id="dj-stations-list"></div>
    `;

    const list = el.querySelector('#dj-stations-list')!;
    list.innerHTML = stations
      .map((s) => renderStationBlock(s))
      .join('');

    bindDjEvents(el);
  };

  render();
  subscribe(render);
}

function renderStationBlock(s: Station): string {
  const tracksHtml = s.tracks
    .map(
      (t, i) => `
    <div class="dj-track-item" data-station="${s.id}" data-index="${i}">
      <img src="${thumbnailUrl(t.videoId)}" alt="" />
      <div>
        <strong>${escapeHtml(t.title ?? t.videoId)}</strong>
        <div style="font-size: 0.8rem; color: var(--text-muted)">${escapeHtml(t.channel ?? '')}</div>
      </div>
      <div class="dj-track-actions">
        <button type="button" class="btn-icon" data-up title="Move up">↑</button>
        <button type="button" class="btn-icon" data-down title="Move down">↓</button>
        <button type="button" class="btn-icon btn-danger" data-remove title="Remove">×</button>
      </div>
    </div>
  `,
    )
    .join('');

  return `
    <div class="dj-station-block glass" data-station-block="${s.id}">
      <h3>${escapeHtml(s.emoji ?? '📻')} ${escapeHtml(s.name)} <span style="font-weight: 400; color: var(--text-muted)">(${s.tracks.length})</span></h3>
      ${tracksHtml || '<p style="color: var(--text-muted)">No tracks yet.</p>'}
      <button type="button" class="btn-secondary btn-danger" data-delete-station style="margin-top: 12px">Delete station</button>
    </div>
  `;
}

function bindDjEvents(el: HTMLElement): void {
  el.querySelector('#dj-export')?.addEventListener('click', () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ytradio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup downloaded');
  });

  el.querySelector('#dj-import')?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importJson(text);
      toast('Backup imported');
    } catch {
      toast('Invalid backup file');
    }
    (e.target as HTMLInputElement).value = '';
  });

  el.querySelector('#dj-reset')?.addEventListener('click', () => {
    if (confirm('Reset all stations to defaults? This cannot be undone.')) {
      resetToSeed();
      toast('Reset to default stations');
    }
  });

  el.querySelector('#dj-add-track')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlInput = el.querySelector('#dj-url') as HTMLInputElement;
    const stationId = (el.querySelector('#dj-station-select') as HTMLSelectElement).value;
    const id = parseYouTubeId(urlInput.value);
    if (!id) {
      toast('Invalid YouTube URL or ID');
      return;
    }

    const watch = youtubeWatchUrl(id);
    const meta = await fetchOEmbed(watch);
    const track: Track = {
      videoId: id,
      title: meta?.title,
      channel: meta?.author_name,
      addedAt: Date.now(),
    };
    addTrack(stationId, track);
    urlInput.value = '';
    toast(`Added “${track.title ?? id}”`);
  });

  el.querySelector('#dj-add-station')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (el.querySelector('#dj-station-name') as HTMLInputElement).value.trim();
    const emoji = (el.querySelector('#dj-station-emoji') as HTMLInputElement).value.trim();
    const accent = (el.querySelector('#dj-station-accent') as HTMLInputElement).value;
    if (!name) return;

    const station: Station = {
      id: slugId(name),
      name,
      emoji: emoji || '📻',
      accent,
      tracks: [],
    };
    try {
      addStation(station);
      toast(`Created station “${name}”`);
      (el.querySelector('#dj-station-name') as HTMLInputElement).value = '';
    } catch {
      toast('Station ID already exists');
    }
  });

  el.querySelectorAll('[data-up]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.dj-track-item') as HTMLElement;
      const sid = item.dataset.station!;
      const i = parseInt(item.dataset.index!, 10);
      if (i > 0) reorderTrack(sid, i, i - 1);
    });
  });

  el.querySelectorAll('[data-down]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.dj-track-item') as HTMLElement;
      const sid = item.dataset.station!;
      const i = parseInt(item.dataset.index!, 10);
      const st = getStations().find((s) => s.id === sid);
      if (st && i < st.tracks.length - 1) reorderTrack(sid, i, i + 1);
    });
  });

  el.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.dj-track-item') as HTMLElement;
      removeTrack(item.dataset.station!, parseInt(item.dataset.index!, 10));
      toast('Track removed');
    });
  });

  el.querySelectorAll('[data-delete-station]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const block = btn.closest('[data-station-block]') as HTMLElement;
      const id = block.dataset.stationBlock!;
      if (confirm('Delete this station and all its tracks?')) {
        removeStation(id);
        toast('Station deleted');
      }
    });
  });
}
