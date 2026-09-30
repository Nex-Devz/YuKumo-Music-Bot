import type { Client } from "discord.js";

interface LiveLyricsSession {
  channelId: string;
  messageId: string;
  title: string;
  lines: string[];
}

const sessions = new Map<string, LiveLyricsSession>();
const MAX_LINES = 12;

export function startLiveLyrics(guildId: string, channelId: string, messageId: string, title: string): void {
  sessions.set(guildId, { channelId, messageId, title, lines: [] });
}

export function stopLiveLyrics(guildId: string): boolean {
  return sessions.delete(guildId);
}

export function hasLiveLyrics(guildId: string): boolean {
  return sessions.has(guildId);
}

/** Extract a printable line of text from LavaLyrics' loosely-typed line payload. */
function lineText(line: unknown): string | null {
  if (!line) return null;
  if (typeof line === "string") return line;
  if (typeof line === "object") {
    const obj = line as Record<string, unknown>;
    const value = obj.line ?? obj.text ?? obj.words;
    if (typeof value === "string") return value;
  }
  return null;
}

/**
 * Append the newest lyric line and re-render the tracking message. Errors are
 * swallowed — a stale message or missing channel should never crash playback.
 */
export async function pushLyricLine(client: Client, guildId: string, line: unknown): Promise<void> {
  const session = sessions.get(guildId);
  if (!session) return;
  const text = lineText(line);
  if (!text) return;

  session.lines.push(text);
  if (session.lines.length > MAX_LINES) session.lines.shift();

  try {
    const channel = await client.channels.fetch(session.channelId);
    if (!channel || !channel.isTextBased() || !("messages" in channel)) return;
    const message = await channel.messages.fetch(session.messageId);
    const body = session.lines
      .map((l, i) => (i === session.lines.length - 1 ? `**${l}**` : l))
      .join("\n");
    await message.edit({ content: `**Live lyrics — ${session.title}**\n${body || "…"}` });
  } catch {
    sessions.delete(guildId);
  }
}
