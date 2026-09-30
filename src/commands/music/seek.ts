import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { formatDuration } from "../../utils/formatters.js";
import { buildPlayerComponents } from "../../components/playerComponents.js";

export const seekCommand: Command = {
  name: "seek",
  description: "Seek to a timestamp (in seconds)",
  requiresVoice: true,
  requiresPlayer: true,
  options: [{ name: "seconds", type: "integer", required: true }],
  slashData: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("Seek to a timestamp (in seconds)")
    .addIntegerOption((o) =>
      o.setName("seconds").setDescription("Position in seconds").setMinValue(0).setRequired(true)
    ),
  execute: async (ctx: CommandContext) => {
    if (!ctx.player || !ctx.player.currentTrack) {
      await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing to seek.")] });
      return;
    }
    const seconds = ctx.opts.getInteger("seconds");
    if (seconds === null || seconds < 0) {
      await ctx.reply({ embeds: [errorEmbed("Please provide valid seconds to seek.")] });
      return;
    }
    const seekMs = seconds * 1000;
    await ctx.player.seek(seekMs);
    await ctx.reply({
      embeds: [successEmbed("Seek", `Jumped to \`${formatDuration(seekMs)}\`.`)],
      components: buildPlayerComponents(ctx.player),
    });
  },
};
