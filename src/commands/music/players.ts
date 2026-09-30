import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { yellowEmbed } from "../../utils/embeds.js";

export const playersCommand: Command = {
  name: "players",
  description: "Inspect all active players managed by YuKumo wrapper across guilds",
  slashData: new SlashCommandBuilder()
    .setName("players")
    .setDescription("Inspect all active players managed by YuKumo wrapper across guilds"),
  execute: async (ctx: CommandContext) => {
    const allPlayers = ctx.yukumo.getPlayers();

    const details = allPlayers
      .map(
        (p) =>
          `Guild: \`${p.guildId}\` | Node: \`${p.node.id}\` | Status: \`${p.status}\` | Queue: \`${p.queue.size}\``
      )
      .join("\n");

    const embed = yellowEmbed()
      .setAuthor({ name: "Active Players" })
      .setDescription(details || "No active players across any server.")
      .setFooter({ text: `Total active players: ${allPlayers.length}` });

    await ctx.reply({ embeds: [embed] });
  },
};
