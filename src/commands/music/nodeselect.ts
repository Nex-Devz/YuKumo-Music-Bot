import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import {
  LeastUsedSelector,
  LeastPenaltySelector,
  RoundRobinSelector,
  RandomSelector,
} from "yukumo";

export const nodeselectCommand: Command = {
  name: "nodeselect",
  description: "Switch wrapper node selection strategy algorithm",
  options: [
    {
      name: "strategy",
      type: "string",
      required: true,
      choices: ["least-used", "least-penalty", "round-robin", "random"],
    },
  ],
  slashData: new SlashCommandBuilder()
    .setName("nodeselect")
    .setDescription("Switch wrapper node selection strategy algorithm")
    .addStringOption((o) =>
      o
        .setName("strategy")
        .setDescription("Node selection strategy algorithm")
        .setRequired(true)
        .addChoices(
          { name: "Least Used (Fewest Players)", value: "least-used" },
          { name: "Least Penalty (Lowest CPU/Lag Penalty)", value: "least-penalty" },
          { name: "Round Robin", value: "round-robin" },
          { name: "Random", value: "random" }
        )
    ),
  execute: async (ctx: CommandContext) => {
    const strategy = ctx.opts.getString("strategy")?.toLowerCase();
    switch (strategy) {
      case "least-used":
        ctx.yukumo.nodes.setSelector(new LeastUsedSelector());
        break;
      case "least-penalty":
        ctx.yukumo.nodes.setSelector(new LeastPenaltySelector());
        break;
      case "round-robin":
        ctx.yukumo.nodes.setSelector(new RoundRobinSelector());
        break;
      case "random":
        ctx.yukumo.nodes.setSelector(new RandomSelector());
        break;
      default:
        await ctx.reply({
          embeds: [errorEmbed("Available strategies: `least-used`, `least-penalty`, `round-robin`, `random`")],
        });
        return;
    }

    await ctx.reply({
      embeds: [
        successEmbed(
          "NODE STRATEGY UPDATED",
          `Switched node selection algorithm strategy to **${strategy}**`
        ),
      ],
    });
  },
};
