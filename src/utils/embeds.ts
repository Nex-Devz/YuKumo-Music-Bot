import { EmbedBuilder } from "discord.js";
import { COLORS, YELLOW_THEME } from "../config/config.js";
import { createProgressBar, formatDuration, hyperlink, titleCase, truncate } from "./formatters.js";
import type { TrackData, Player } from "yukumo";

/** Base embed carrying the brand footer + timestamp. */
export function baseEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setFooter({ text: YELLOW_THEME.FOOTER_TEXT })
    .setTimestamp();
}

/** Kept for backward compatibility with existing imports. */
export const yellowEmbed = baseEmbed;

export function successEmbed(title: string, description: string): EmbedBuilder {
  return baseEmbed().setColor(COLORS.SUCCESS).setAuthor({ name: titleCase(title) }).setDescription(description);
}

export function errorEmbed(description: string): EmbedBuilder {
  return baseEmbed().setColor(COLORS.ERROR).setAuthor({ name: "Error" }).setDescription(description);
}

export function warningEmbed(description: string): EmbedBuilder {
  return baseEmbed().setColor(COLORS.WARNING).setAuthor({ name: "Notice" }).setDescription(description);
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return baseEmbed().setColor(COLORS.INFO).setAuthor({ name: titleCase(title) }).setDescription(description);
}

/** Resolve a "<@id>" mention (or plain label) from whatever requester data a track carries. */
function requesterMention(track: TrackData): string | null {
  const raw = (track as unknown as { requester?: unknown }).requester
    ?? (track.userData as { requester?: unknown } | undefined)?.requester;
  if (!raw) return null;
  if (typeof raw === "string") return /^\d+$/.test(raw) ? `<@${raw}>` : raw;
  if (typeof raw === "object" && raw !== null && "id" in raw) return `<@${(raw as { id: string }).id}>`;
  return null;
}

/** Rich "now playing" card. Shows a live progress bar and player state when a player is supplied. */
export function trackEmbed(track: TrackData, player?: Player): EmbedBuilder {
  const requester = requesterMention(track);
  const embed = baseEmbed()
    .setAuthor({ name: player ? "Now Playing" : "Track" })
    .setTitle(truncate(track.info.title, 96))
    .setURL(track.info.uri ?? null)
    .addFields(
      { name: "Artist", value: truncate(track.info.author || "Unknown", 40), inline: true },
      { name: "Duration", value: formatDuration(track.info.length), inline: true },
      { name: "Source", value: titleCase(track.info.sourceName || "Unknown"), inline: true }
    );

  if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);

  if (player) {
    const bar = createProgressBar(player.position, track.info.length);
    const time = `${formatDuration(player.position)} / ${formatDuration(track.info.length)}`;
    embed.setDescription(`\`${bar}\`\n${time}`);
    embed.addFields(
      { name: "Volume", value: `${player.volume}%`, inline: true },
      { name: "Loop", value: titleCase(player.queue.repeatMode), inline: true },
      {
        name: "State",
        value: [
          player.paused ? "Paused" : "Playing",
          player.autoplay ? "Autoplay" : null,
          player.stayInVc ? "24/7" : null,
        ]
          .filter(Boolean)
          .join(" · "),
        inline: true,
      }
    );
  }

  if (requester) embed.addFields({ name: "Requested by", value: requester, inline: false });
  return embed;
}

/** Compact confirmation when a track (or playlist item) is queued rather than played immediately. */
export function addedEmbed(track: TrackData, position?: number): EmbedBuilder {
  const requester = requesterMention(track);
  const embed = baseEmbed()
    .setColor(COLORS.SUCCESS)
    .setAuthor({ name: "Added to Queue" })
    .setDescription(`**${hyperlink(track.info.title, track.info.uri)}**\n${truncate(track.info.author || "Unknown", 60)}`)
    .addFields({ name: "Duration", value: formatDuration(track.info.length), inline: true });
  if (typeof position === "number") embed.addFields({ name: "Position", value: `#${position}`, inline: true });
  if (requester) embed.addFields({ name: "Requested by", value: requester, inline: true });
  if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);
  return embed;
}

/** Paginated queue listing. */
export function queueEmbed(player: Player, page = 1): EmbedBuilder {
  const tracksList: TrackData[] = Array.from(player.queue.tracksList);
  const current = player.currentTrack;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(tracksList.length / itemsPerPage) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageTracks = tracksList.slice(startIndex, startIndex + itemsPerPage);

  const upNext = pageTracks
    .map(
      (t, idx) =>
        `\`${String(startIndex + idx + 1).padStart(2, " ")}\` ${hyperlink(t.info.title, t.info.uri)} \`${formatDuration(t.info.length)}\``
    )
    .join("\n");

  const nowPlaying = current
    ? `**${hyperlink(current.info.title, current.info.uri)}** \`${formatDuration(current.info.length)}\``
    : "_Nothing playing_";

  const totalMs = tracksList.reduce((sum, t) => sum + (t.info.length || 0), 0);

  return baseEmbed()
    .setAuthor({ name: "Queue" })
    .setDescription(
      `**Now Playing**\n${nowPlaying}\n\n**Up Next** — page ${currentPage}/${totalPages}\n${upNext || "_Queue is empty_"}`
    )
    .addFields(
      { name: "Tracks", value: `${player.queue.size}`, inline: true },
      { name: "Total Length", value: formatDuration(totalMs), inline: true },
      { name: "Loop", value: titleCase(player.queue.repeatMode), inline: true }
    );
}
