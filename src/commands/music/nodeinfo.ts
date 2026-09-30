import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, yellowEmbed } from "../../utils/embeds.js";

export const nodeinfoCommand: Command = {
  name: "nodeinfo",
  description: "Display connected Lavalink node status, memory & CPU stats",
  aliases: ["stats"],
  slashData: new SlashCommandBuilder()
    .setName("nodeinfo")
    .setDescription("Display connected Lavalink node status, memory & CPU stats"),
  execute: async (ctx: CommandContext) => {
    const node = ctx.yukumo.nodes.get("MainNode") || ctx.yukumo.nodes.getAll()[0];
    if (!node) {
      await ctx.reply({ embeds: [errorEmbed("No nodes connected to Lavalink wrapper.")] });
      return;
    }

    const stats = node.stats;
    const embed = yellowEmbed()
      .setAuthor({ name: "Node Diagnostics" })
      .setTitle(node.id)
      .addFields(
        { name: "State", value: `\`${node.state}\``, inline: true },
        { name: "Players", value: `\`${node.playerCount}\``, inline: true },
        { name: "Penalties", value: `\`${node.penalties.total}\``, inline: true },
        {
          name: "Memory",
          value: stats
            ? `\`${Math.round((stats.memory?.used ?? 0) / 1024 / 1024)}MB / ${Math.round((stats.memory?.allocated ?? 0) / 1024 / 1024)}MB\``
            : "`N/A`",
          inline: true,
        },
        {
          name: "CPU",
          value: stats
            ? `\`Lavalink ${((stats.cpu?.lavalinkLoad ?? 0) * 100).toFixed(1)}% · System ${((stats.cpu?.systemLoad ?? 0) * 100).toFixed(1)}%\``
            : "`N/A`",
          inline: true,
        },
        {
          name: "Uptime",
          value: stats ? `\`${Math.floor((stats.uptime ?? 0) / 1000)}s\`` : "`N/A`",
          inline: true,
        }
      );

    await ctx.reply({ embeds: [embed] });
  },
};
