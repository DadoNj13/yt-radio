type StateHandler = (data: number) => void;
type ErrorHandler = (code: number) => void;

let apiReady: Promise<void> | null = null;
let player: YT.Player | null = null;
let onState: StateHandler | null = null;
let onErr: ErrorHandler | null = null;

export function loadYouTubeApi(): Promise<void> {
  if (apiReady) return apiReady;

  apiReady = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });

  return apiReady;
}

export function setPlayerHandlers(handlers: {
  onStateChange?: StateHandler;
  onError?: ErrorHandler;
}): void {
  onState = handlers.onStateChange ?? null;
  onErr = handlers.onError ?? null;
}

export function createPlayer(host: HTMLElement): Promise<YT.Player> {
  return loadYouTubeApi().then(
    () =>
      new Promise((resolve) => {
        if (player) {
          resolve(player);
          return;
        }

        const div = document.createElement('div');
        div.id = 'yt-iframe';
        host.appendChild(div);

        player = new YT.Player(div, {
          height: '1',
          width: '1',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: (e) => resolve(e.target),
            onStateChange: (e) => onState?.(e.data),
            onError: (e) => onErr?.(e.data),
          },
        });
      }),
  );
}

export function getPlayer(): YT.Player | null {
  return player;
}
