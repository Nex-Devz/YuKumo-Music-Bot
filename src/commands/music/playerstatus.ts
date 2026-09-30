import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, yellowEmbed } from "../../utils/embeds.js";
import { formatDuration } from "../../utils/formatters.js";
import { buildPlayerComponents } from "../../components/playerComponents.js";

export const playerstatusCommand: Command = {
  name: "playerstatus",
  description: "Inspect wrapper Player diagnostic status for this server",
  aliases: ["status"],
  requiresPlayer: true,
  slashData: new SlashCommandBuilder()
    .setName("playerstatus")
    .setDescription("Inspect wrapper Player diagnostic status for this server"),
  execute: async (ctx: CommandContext) => {
    if (!ctx.player) {
      await ctx.reply({ embeds: [errorEmbed("No active player in this server.")] });
      return;
    }

    const voice = ctx.player.voiceState;
    const embed = yellowEmbed()
      .setAuthor({ name: "Player Diagnostics" })
      .setTitle(`Guild ${ctx.guildId}`)
      .addFields(
        { name: "Status", value: `\`${ctx.player.status}\``, inline: true },
        { name: "Voice Channel", value: `<#${ctx.player.voiceChannelId}>`, inline: true },
        { name: "Assigned Node", value: `\`${ctx.player.node.id}\``, inline: true },
        { name: "Queue Size", value: `\`${ctx.player.queue.size}\``, inline: true },
        { name: "Volume", value: `\`${ctx.player.volume}%\``, inline: true },
        { name: "Paused", value: `\`${ctx.player.paused}\``, inline: true },
        {
          name: "Voice Credentials",
          value: voice
            ? `Session: \`${voice.sessionId ? "Yes" : "No"}\` | Token: \`${voice.token ? "Yes" : "No"}\` | Endpoint: \`${voice.endpoint ? "Yes" : "No"}\``
            : "`None`",
          inline: false,
        },
        { name: "Current Position", value: `\`${formatDuration(ctx.player.position)}\``, inline: true }
      );

    await ctx.reply({
      embeds: [embed],
      components: buildPlayerComponents(ctx.player),
    });
  },
};
