import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { CONFIG } from "../../config/config.js";
import { baseEmbed } from "../../utils/embeds.js";

export const helpCommand: Command = {
  name: "help",
  description: "Show the command list",
  slashData: new SlashCommandBuilder().setName("help").setDescription("Show the command list"),
  execute: async (ctx: CommandContext) => {
    const embed = baseEmbed()
      .setAuthor({ name: "Yukumo Music" })
      .setDescription(
        `Use slash commands or the \`${CONFIG.PREFIX}\` prefix. Interactive controls appear under the now-playing card.`
      )
      .addFields(
        { name: "Voice", value: "`join`, `leave`" },
        {
          name: "Playback",
          value: "`play <query> [engine]`, `search <query>`, `pause`, `resume`, `skip`, `stop`, `seek <seconds>`, `previous`",
        },
        {
          name: "Queue",
          value:
            "`queue`, `nowplaying` (`np`), `clear`, `remove <pos>`, `move <from> <to>`, `swap <a> <b>`, `skipto <pos>`, `shuffle`, `loop <off|track|queue>`",
        },
        {
          name: "Audio",
          value: "`volume <0-1000>`, `filter <preset>`, `speed <0.5-3.0>`, `pitch <0.5-3.0>`",
        },
        { name: "Session", value: "`autoplay [on|off]`, `stay [on|off]`, `lyrics [query]`, `lyrics live:true`" },
        {
          name: "Diagnostics",
          value: "`nodeinfo` (`stats`), `nodeselect <strategy>`, `playerstatus` (`status`), `players`",
        }
      );

    await ctx.reply({ embeds: [embed] });
  },
};
