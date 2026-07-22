/** HH:MM:SS elapsed. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** Compact label for the taskbar badge: "5m", "59m", "2h", "12h". */
export function formatBadge(totalSeconds: number): string {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}
