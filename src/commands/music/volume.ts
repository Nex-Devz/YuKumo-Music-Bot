import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { buildPlayerComponents } from "../../components/playerComponents.js";

export const volumeCommand: Command = {
  name: "volume",
  description: "Set playback volume (0 - 1000)",
  requiresVoice: true,
  requiresPlayer: true,
  options: [{ name: "level", type: "integer", required: true }],
  slashData: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set playback volume (0 - 1000)")
    .addIntegerOption((o) =>
      o.setName("level").setDescription("Volume percentage (default 100)").setMinValue(0).setMaxValue(1000).setRequired(true)
    ),
  execute: async (ctx: CommandContext) => {
    if (!ctx.player) return;
    const level = ctx.opts.getInteger("level");
    if (level === null || level < 0 || level > 1000) {
      await ctx.reply({ embeds: [errorEmbed("Please specify a volume level between 0 and 1000.")] });
      return;
    }

    await ctx.player.setVolume(level);
    await ctx.reply({
      embeds: [successEmbed("Volume updated", `Playback volume set to **${level}%**.`)],
      components: buildPlayerComponents(ctx.player),
    });
  },
};
