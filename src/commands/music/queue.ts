import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { queueEmbed, warningEmbed } from "../../utils/embeds.js";
import { buildQueueControls } from "../../components/playerComponents.js";

export const queueCommand: Command = {
  name: "queue",
  description: "Show current song queue",
  requiresVoice: false,
  requiresPlayer: true,
  slashData: new SlashCommandBuilder().setName("queue").setDescription("Show current song queue"),
  execute: async (ctx: CommandContext) => {
    if (!ctx.player) return;
    if (!ctx.player.currentTrack && ctx.player.queue.size === 0) {
      await ctx.reply({ embeds: [warningEmbed("Queue is currently empty.")] });
      return;
    }

    await ctx.reply({
      embeds: [queueEmbed(ctx.player, 1)],
      components: buildQueueControls(ctx.player, 1),
    });
  },
};
