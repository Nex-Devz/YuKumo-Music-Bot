import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, baseEmbed } from "../../utils/embeds.js";
import { formatDuration, hyperlink, truncate } from "../../utils/formatters.js";
import { setSearchSession } from "../../handlers/searchSessions.js";
import type { SearchResult } from "yukumo";

const ENGINES = ["ytsearch", "ytmsearch", "scsearch"];

export const searchCommand: Command = {
  name: "search",
  description: "Search and choose from the top results",
  aliases: ["find"],
  requiresVoice: true,
  options: [
    { name: "engine", type: "string", required: false, choices: ENGINES },
    { name: "query", type: "string", required: true, rest: true },
  ],
  slashData: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search and choose from the top results")
    .addStringOption((o) =>
      o.setName("query").setDescription("Song title or keywords").setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName("engine")
        .setDescription("Search engine")
        .setRequired(false)
        .addChoices(
          { name: "YouTube", value: "ytsearch" },
          { name: "YouTube Music", value: "ytmsearch" },
          { name: "SoundCloud", value: "scsearch" }
        )
    ),
  execute: async (ctx: CommandContext) => {
    const engine = ctx.opts.getString("engine") ?? undefined;
    const query = ctx.opts.getString("query");
    if (!query) {
      await ctx.reply({ embeds: [errorEmbed("Please provide a search query.")] });
      return;
    }

    // Search at the manager level so we don't join the channel until a pick is made.
    const result: SearchResult = await ctx.yukumo.search(query, engine);
    if (result.loadType === "empty" || result.loadType === "error" || result.tracks.length === 0) {
      await ctx.reply({ embeds: [errorEmbed(result.exception?.message ?? "No results found.")] });
      return;
    }
    if (result.loadType === "playlist") {
      await ctx.reply({ embeds: [errorEmbed("That is a playlist — use `/play` to queue the whole thing.")] });
      return;
    }

    const top = result.tracks.slice(0, 5);
    const menu = new StringSelectMenuBuilder()
      .setCustomId("search_pick")
      .setPlaceholder("Select a track to play…")
      .addOptions(
        top.map((t, i) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(truncate(t.info.title, 95))
            .setValue(String(i))
            .setDescription(truncate(`${t.info.author || "Unknown"} · ${formatDuration(t.info.length)}`, 95))
        )
      );

    const embed = baseEmbed()
      .setAuthor({ name: "Search Results" })
      .setDescription(
        top
          .map((t, i) => `\`${i + 1}.\` ${hyperlink(t.info.title, t.info.uri)} \`${formatDuration(t.info.length)}\``)
          .join("\n")
      );

    const message = await ctx.reply({
      embeds: [embed],
      components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
    });
    if (message?.id) setSearchSession(message.id, top, ctx.user.id);
  },
};
