import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { buildPlayerComponents } from "../../components/playerComponents.js";

export const loopCommand: Command = {
  name: "loop",
  description: "Set repeat mode",
  requiresVoice: true,
  requiresPlayer: true,
  options: [{ name: "mode", type: "string", required: true, choices: ["none", "track", "queue"] }],
  slashData: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Set repeat mode")
    .addStringOption((o) =>
      o
        .setName("mode")
        .setDescription("Repeat mode")
        .setRequired(true)
        .addChoices(
          { name: "Off", value: "none" },
          { name: "Current Track", value: "track" },
          { name: "Entire Queue", value: "queue" }
        )
    ),
  execute: async (ctx: CommandContext) => {
    if (!ctx.player) return;
    const mode = ctx.opts.getString("mode")?.toLowerCase() ?? "";
    if (!["none", "track", "queue"].includes(mode)) {
      await ctx.reply({ embeds: [errorEmbed("Valid loop modes: `none`, `track`, `queue`.")] });
      return;
    }
    ctx.player.setLoop(mode as never);
    await ctx.reply({
      embeds: [successEmbed("Loop mode updated", `Repeat mode set to **${mode}**.`)],
      components: buildPlayerComponents(ctx.player),
    });
  },
};
