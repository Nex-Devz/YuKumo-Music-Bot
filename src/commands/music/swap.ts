import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

export const swapCommand: Command = {
  name: "swap",
  description: "Swap positions of two tracks in the queue",
  requiresVoice: true,
  requiresPlayer: true,
  options: [
    { name: "track1", type: "integer", required: true },
    { name: "track2", type: "integer", required: true },
  ],
  slashData: new SlashCommandBuilder()
    .setName("swap")
    .setDescription("Swap two tracks in the queue by position number")
    .addIntegerOption((option) =>
      option.setName("track1").setDescription("Position of first track").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("track2").setDescription("Position of second track").setRequired(true)
    ),
  execute: async (ctx: CommandContext) => {
    const player = ctx.player;
    if (!player || player.queue.isEmpty) {
      await ctx.reply({ embeds: [errorEmbed("Queue is empty.")] });
      return;
    }

    const pos1 = (ctx.opts.getInteger("track1") ?? 0) - 1;
    const pos2 = (ctx.opts.getInteger("track2") ?? 0) - 1;

    const success = player.queue.swap(pos1, pos2);
    if (!success) {
      await ctx.reply({ embeds: [errorEmbed("Invalid track positions specified.")] });
      return;
    }

    await ctx.reply({
      embeds: [successEmbed("Queue updated", `Swapped track #${pos1 + 1} and #${pos2 + 1}.`)],
    });
  },
};
