import type { TrackData } from "yukumo";

export interface SearchSession {
  tracks: TrackData[];
  requesterId: string;
  expires: number;
}

const TTL_MS = 60_000;
const MAX_SESSIONS = 200;
const sessions = new Map<string, SearchSession>();

function prune(): void {
  const now = Date.now();
  for (const [key, value] of sessions) {
    if (value.expires < now) sessions.delete(key);
  }
  if (sessions.size > MAX_SESSIONS) {
    const oldest = sessions.keys().next().value;
    if (oldest) sessions.delete(oldest);
  }
}

/** Store the candidate tracks for a `/search` select menu, keyed by its message id. */
export function setSearchSession(messageId: string, tracks: TrackData[], requesterId: string): void {
  prune();
  sessions.set(messageId, { tracks, requesterId, expires: Date.now() + TTL_MS });
}

/** Peek at a search session without consuming it. Returns null when missing or expired (expired ones are dropped). */
export function getSearchSession(messageId: string): SearchSession | null {
  const session = sessions.get(messageId);
  if (!session) return null;
  if (session.expires < Date.now()) {
    sessions.delete(messageId);
    return null;
  }
  return session;
}

/** Remove a search session once it has been acted upon. */
export function consumeSearchSession(messageId: string): void {
  sessions.delete(messageId);
}
