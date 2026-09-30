import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { buildPlayerComponents } from "../../components/playerComponents.js";
import { TimescaleFilter } from "yukumo";

export const speedCommand: Command = {
  name: "speed",
  description: "Set timescale playback speed multiplier (e.g. 1.25)",
  requiresVoice: true,
  requiresPlayer: true,
  options: [{ name: "value", type: "number", required: true }],
  slashData: new SlashCommandBuilder()
    .setName("speed")
    .setDescription("Set timescale playback speed multiplier (e.g. 1.25)")
    .addNumberOption((o) =>
      o.setName("value").setDescription("Speed multiplier (0.5 to 3.0)").setRequired(true)
    ),
  execute: async (ctx: CommandContext) => {
    if (!ctx.player) return;
    const speedVal = ctx.opts.getNumber("value");
    if (speedVal === null || speedVal < 0.5 || speedVal > 3.0) {
      await ctx.reply({ embeds: [errorEmbed("Speed multiplier must be between 0.5 and 3.0.")] });
      return;
    }
    ctx.player.filters.add(new TimescaleFilter({ speed: speedVal }));
    await ctx.player.setFilters();
    await ctx.reply({
      embeds: [successEmbed("Speed updated", `Playback speed set to **${speedVal}x**.`)],
      components: buildPlayerComponents(ctx.player),
    });
  },
};
