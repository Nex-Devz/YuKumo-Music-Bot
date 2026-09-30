import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { buildPlayerComponents } from "../../components/playerComponents.js";

export const moveCommand: Command = {
  name: "move",
  description: "Move a track from one queue position to another",
  requiresVoice: true,
  requiresPlayer: true,
  options: [
    { name: "from", type: "integer", required: true },
    { name: "to", type: "integer", required: true },
  ],
  slashData: new SlashCommandBuilder()
    .setName("move")
    .setDescription("Move a track from one queue position to another")
    .addIntegerOption((o) => o.setName("from").setDescription("Current position").setMinValue(1).setRequired(true))
    .addIntegerOption((o) => o.setName("to").setDescription("New position").setMinValue(1).setRequired(true)),
  execute: async (ctx: CommandContext) => {
    if (!ctx.player) return;
    const from = ctx.opts.getInteger("from");
    const to = ctx.opts.getInteger("to");

    if (
      from === null ||
      to === null ||
      from < 1 ||
      to < 1 ||
      from > ctx.player.queue.size ||
      to > ctx.player.queue.size
    ) {
      await ctx.reply({ embeds: [errorEmbed("Invalid from/to positions specified.")] });
      return;
    }

    const removed = ctx.player.queue.remove(from - 1);
    const track = removed[0];
    if (track) {
      ctx.player.queue.enqueue(track, to - 1);
      await ctx.reply({
        embeds: [
          successEmbed("Track moved", `Moved **${track.info.title}** from position \`${from}\` to \`${to}\`.`),
        ],
        components: buildPlayerComponents(ctx.player),
      });
    }
  },
};
