/** Format a millisecond duration as `m:ss` or `h:mm:ss`. Zero/undefined is treated as a live stream. */
export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "LIVE";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

/**
 * Monochrome track progress bar built from box-drawing glyphs, e.g.
 * `━━━━━━●───────────`. Renders as a live-stream marker when total is unknown.
 */
export function createProgressBar(current: number, total: number, size = 18): string {
  if (!total || total <= 0) return "─".repeat(size);
  const progress = Math.min(Math.max(current / total, 0), 1);
  const knob = Math.min(size - 1, Math.round(size * progress));
  const filled = "━".repeat(knob);
  const empty = "─".repeat(Math.max(0, size - knob - 1));
  return `${filled}●${empty}`;
}

/** Trim a string to `max` characters, appending an ellipsis when truncated. */
export function truncate(text: string, max = 60): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Normalise SHOUTY or lower-case labels into "Title Case". */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

/** Markdown link that degrades gracefully when a track has no URI. */
export function hyperlink(title: string, uri?: string | null): string {
  const safe = truncate(title.replace(/[[\]]/g, ""), 70);
  return uri ? `[${safe}](${uri})` : safe;
}
