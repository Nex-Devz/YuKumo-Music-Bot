import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { buildPlayerComponents } from "../../components/playerComponents.js";

export const removeCommand: Command = {
  name: "remove",
  description: "Remove a track from queue by position number",
  requiresVoice: true,
  requiresPlayer: true,
  options: [{ name: "position", type: "integer", required: true }],
  slashData: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a track from queue by position number")
    .addIntegerOption((o) =>
      o.setName("position").setDescription("Track position number in queue").setMinValue(1).setRequired(true)
    ),
  execute: async (ctx: CommandContext) => {
    if (!ctx.player) return;
    const pos = ctx.opts.getInteger("position");
    if (pos === null || pos < 1 || pos > ctx.player.queue.size) {
      await ctx.reply({
        embeds: [errorEmbed(`Invalid position. Provide a number between 1 and ${ctx.player.queue.size}.`)],
      });
      return;
    }

    const removed = ctx.player.queue.remove(pos - 1);
    const removedTrack = removed[0];

    await ctx.reply({
      embeds: [
        removedTrack
          ? successEmbed("Track removed", `Removed **${removedTrack.info.title}** from position ${pos}.`)
          : errorEmbed("Failed to remove track from queue."),
      ],
      components: buildPlayerComponents(ctx.player),
    });
  },
};
