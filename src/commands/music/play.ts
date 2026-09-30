import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, successEmbed, trackEmbed, addedEmbed } from "../../utils/embeds.js";
import { buildPlayerComponents } from "../../components/playerComponents.js";
import type { SearchResult, TrackData } from "yukumo";

const ENGINES = ["ytsearch", "ytmsearch", "scsearch"];

export const playCommand: Command = {
  name: "play",
  description: "Search and play a track or playlist",
  requiresVoice: true,
  options: [
    { name: "engine", type: "string", required: false, choices: ENGINES },
    { name: "query", type: "string", required: true, rest: true },
  ],
  slashData: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Search and play a track or playlist")
    .addStringOption((o) =>
      o.setName("query").setDescription("Song title, URL, or playlist link").setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName("engine")
        .setDescription("Search engine prefix")
        .setRequired(false)
        .addChoices(
          { name: "YouTube", value: "ytsearch" },
          { name: "YouTube Music", value: "ytmsearch" },
          { name: "SoundCloud", value: "scsearch" }
        )
    ),
  execute: async (ctx: CommandContext) => {
    const engine = ctx.opts.getString("engine") ?? undefined;
    const query = ctx.opts.getString("query");

    if (!query) {
      await ctx.reply({ embeds: [errorEmbed("Please provide a search query or URL.")] });
      return;
    }

    let player = ctx.player;
    if (!player) {
      player = await ctx.yukumo.createPlayer({
        guildId: ctx.guildId,
        voiceChannelId: ctx.voiceChannelId!,
        textChannelId: ctx.textChannelId ?? "",
      });
    }

    const searchResult: SearchResult = await player.search(query, engine);

    if (
      searchResult.loadType === "empty" ||
      searchResult.loadType === "error" ||
      searchResult.tracks.length === 0
    ) {
      const errorMsg = searchResult.exception?.message ?? "No tracks found for your search query.";
      await ctx.reply({ embeds: [errorEmbed(errorMsg)] });
      return;
    }

    // Attribute every queued track to the requester for display in embeds.
    const stamp = (track: TrackData) => {
      (track as { userData?: Record<string, unknown> }).userData = {
        ...((track as { userData?: Record<string, unknown> }).userData ?? {}),
        requester: ctx.user.id,
      };
    };
    searchResult.tracks.forEach(stamp);

    if (searchResult.loadType === "playlist" && searchResult.playlistInfo) {
      for (const track of searchResult.tracks) {
        player.queue.enqueue(track);
      }
      if (player.status === "idle") {
        await player.play();
      }
      await ctx.reply({
        embeds: [
          successEmbed(
            "Playlist added",
            `Queued **${searchResult.tracks.length}** tracks from **${searchResult.playlistInfo.name}**.`
          ),
        ],
        components: buildPlayerComponents(player),
      });
    } else {
      const track = searchResult.tracks[0];
      await ctx.yukumo.play(ctx.guildId, track);

      if (player.queue.size > 1 || player.status === "playing") {
        await ctx.reply({
          embeds: [addedEmbed(track, player.queue.size)],
          components: buildPlayerComponents(player),
        });
      } else {
        await ctx.reply({
          embeds: [trackEmbed(track, player)],
          components: buildPlayerComponents(player),
        });
      }
    }
  },
};
