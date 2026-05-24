let timer: ReturnType<typeof setTimeout> | null = null;

export function toast(message: string, durationMs = 3200): void {
  const root = document.getElementById('toast-root');
  if (!root) return;

  root.textContent = message;
  root.classList.add('visible');

  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    root.classList.remove('visible');
    timer = null;
  }, durationMs);
}
