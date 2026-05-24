import './styles/main.css';
import { navigate, parseDeepLink } from './app/router';
import { initQueue, playStation, togglePlay, next, previous, getState } from './player/queue';
import { mountShell } from './ui/shell';
import { toast } from './ui/toast';

const app = document.getElementById('app');
if (!app) throw new Error('#app not found');

mountShell(app);

void initQueue().then(() => {
  const link = parseDeepLink();
  if (link) {
    navigate({ name: 'station', stationId: link.stationId }, true);
    document.body.addEventListener(
      'click',
      () => {
        void playStation(link.stationId, link.trackIndex);
      },
      { once: true },
    );
    toast('Click anywhere to start playback from your link');
  }
});

document.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
    return;
  }

  const s = getState();
  if (!s.videoId && e.code !== 'Space') return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      if (s.videoId) togglePlay();
      break;
    case 'ArrowRight':
      e.preventDefault();
      void next();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      void previous();
      break;
  }
});
