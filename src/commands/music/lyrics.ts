import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { infoEmbed, errorEmbed, successEmbed } from "../../utils/embeds.js";
import { startLiveLyrics, stopLiveLyrics } from "../../handlers/liveLyrics.js";

export const lyricsCommand: Command = {
  name: "lyrics",
  description: "Fetch synced lyrics for current playing track or query",
  requiresVoice: false,
  requiresPlayer: false,
  options: [{ name: "query", type: "string", required: false, rest: true }],
  slashData: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Fetch synchronized lyrics for current track or song title")
    .addStringOption((option) =>
      option.setName("query").setDescription("Song name to search").setRequired(false)
    )
    .addBooleanOption((option) =>
      option.setName("live").setDescription("Stream karaoke-style synced lyrics (requires LavaLyrics)")
    ),
  execute: async (ctx: CommandContext) => {
    const query = ctx.opts.getString("query");
    const player = ctx.player;
    const live = ctx.opts.getBoolean("live");

    // Stop an active live session.
    if (live === false) {
      await player?.unsubscribeLyrics().catch(() => undefined);
      stopLiveLyrics(ctx.guildId);
      await ctx.reply({ embeds: [successEmbed("Live lyrics", "Stopped the live lyrics feed.")] });
      return;
    }

    // Start a live, self-updating lyrics feed for the current track.
    if (live === true) {
      if (!player?.currentTrack?.info) {
        await ctx.reply({ embeds: [errorEmbed("Play a track first to stream its lyrics.")] });
        return;
      }
      try {
        await player.subscribeLyrics();
      } catch {
        await ctx.reply({
          embeds: [errorEmbed("This Lavalink node doesn't provide live lyrics (LavaLyrics plugin required).")],
        });
        return;
      }
      const title = player.currentTrack.info.title;
      const message = await ctx.reply({ content: `**Live lyrics — ${title}**\n…` });
      if (message?.id) startLiveLyrics(ctx.guildId, ctx.textChannelId, message.id, title);
      return;
    }

    let title = "";
    let author = "";

    if (query) {
      title = query;
    } else if (player?.currentTrack?.info) {
      title = player.currentTrack.info.title;
      author = player.currentTrack.info.author;
    } else {
      await ctx.reply({ embeds: [errorEmbed("Please specify a song title or play a track first.")] });
      return;
    }

    const { LyricsClient } = await import("yukumo");
    const lyricsClient = new LyricsClient();
    const result = await lyricsClient.getLyrics(title, author);

    if (!result || (!result.plainLyrics && result.syncedLyrics.length === 0)) {
      await ctx.reply({ embeds: [errorEmbed(`No lyrics found for **${title}**.`)] });
      return;
    }

    const lyricsText = result.plainLyrics || result.syncedLyrics.map((line) => line.text).join("\n");
    const truncated = lyricsText.length > 3900 ? lyricsText.slice(0, 3900) + "…" : lyricsText;

    const embed = infoEmbed(`${result.title} — ${result.artist}`, truncated);
    await ctx.reply({ embeds: [embed] });
  },
};
