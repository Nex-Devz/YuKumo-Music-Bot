import { SlashCommandBuilder } from "discord.js";
import type { Command, CommandContext } from "../types.js";
import { errorEmbed, successEmbed, warningEmbed } from "../../utils/embeds.js";
import { buildPlayerComponents } from "../../components/playerComponents.js";
import { TremoloFilter, VibratoFilter, LowPassFilter } from "yukumo";

export const filterCommand: Command = {
  name: "filter",
  description: "Apply an audio filter preset",
  requiresVoice: true,
  requiresPlayer: true,
  options: [
    {
      name: "preset",
      type: "string",
      required: true,
      choices: [
        "clear", "reset", "bassboost", "nightcore", "vaporwave", "slowedreverb",
        "vocalboost", "karaoke", "3d", "rotation", "tremolo", "vibrato", "lowpass",
      ],
    },
  ],
  slashData: new SlashCommandBuilder()
    .setName("filter")
    .setDescription("Apply an audio filter preset")
    .addStringOption((o) =>
      o
        .setName("preset")
        .setDescription("Filter preset to apply")
        .setRequired(true)
        .addChoices(
          { name: "Clear / Reset", value: "clear" },
          { name: "Bass Boost", value: "bassboost" },
          { name: "Nightcore", value: "nightcore" },
          { name: "Vaporwave", value: "vaporwave" },
          { name: "Slowed + Reverb", value: "slowedreverb" },
          { name: "Vocal Boost", value: "vocalboost" },
          { name: "Karaoke", value: "karaoke" },
          { name: "3D Rotation", value: "3d" },
          { name: "Tremolo", value: "tremolo" },
          { name: "Vibrato", value: "vibrato" },
          { name: "Low Pass", value: "lowpass" }
        )
    ),
  execute: async (ctx: CommandContext) => {
    if (!ctx.player) return;
    const preset = ctx.opts.getString("preset")?.toLowerCase();

    switch (preset) {
      case "clear":
      case "reset":
        ctx.player.filters.clear();
        await ctx.player.setFilters();
        await ctx.reply({
          embeds: [warningEmbed("Cleared all active audio filters.")],
          components: buildPlayerComponents(ctx.player),
        });
        break;
      case "bassboost":
        ctx.player.filters.setBassBoost();
        await ctx.player.setFilters();
        await ctx.reply({
          embeds: [successEmbed("FILTER APPLIED", "Bass Boost filter enabled.")],
          components: buildPlayerComponents(ctx.player),
        });
        break;
      case "nightcore":
        ctx.player.filters.setNightcore();
        await ctx.player.setFilters();
        await ctx.reply({
          embeds: [successEmbed("FILTER APPLIED", "Nightcore filter enabled.")],
          components: buildPlayerComponents(ctx.player),
        });
        break;
      case "vaporwave":
        ctx.player.filters.setVaporwave();
        await ctx.player.setFilters();
        await ctx.reply({
          embeds: [successEmbed("FILTER APPLIED", "Vaporwave filter enabled.")],
          components: buildPlayerComponents(ctx.player),
        });
        break;
      case "slowedreverb":
        ctx.player.filters.setSlowedReverb();
        await ctx.player.setFilters();
        await ctx.reply({
          embeds: [successEmbed("FILTER APPLIED", "Slowed + Reverb filter enabled.")],
          components: buildPlayerComponents(ctx.player),
        });
        break;
      case "vocalboost":
        ctx.player.filters.setVoiceIsolation();
        await ctx.player.setFilters();
        await ctx.reply({
          embeds: [successEmbed("FILTER APPLIED", "Vocal Boost filter enabled.")],
          components: buildPlayerComponents(ctx.player),
        });
        break;
      case "karaoke":
        ctx.player.filters.setKaraoke();
        await ctx.player.setFilters();
        await ctx.reply({
          embeds: [successEmbed("FILTER APPLIED", "Karaoke vocal suppressor enabled.")],
          components: buildPlayerComponents(ctx.player),
        });
        break;
      case "3d":
      case "rotation":
        ctx.player.filters.set8D();
        await ctx.player.setFilters();
        await ctx.reply({
          embeds: [successEmbed("FILTER APPLIED", "3D Spatial Rotation filter enabled.")],
          components: buildPlayerComponents(ctx.player),
        });
        break;
      case "tremolo":
        ctx.player.filters.add(new TremoloFilter({ frequency: 4.0, depth: 0.5 }));
        await ctx.player.setFilters();
        await ctx.reply({
          embeds: [successEmbed("FILTER APPLIED", "Tremolo filter enabled.")],
          components: buildPlayerComponents(ctx.player),
        });
        break;
      case "vibrato":
        ctx.player.filters.add(new VibratoFilter({ frequency: 6.0, depth: 0.5 }));
        await ctx.player.setFilters();
        await ctx.reply({
          embeds: [successEmbed("FILTER APPLIED", "Vibrato filter enabled.")],
          components: buildPlayerComponents(ctx.player),
        });
        break;
      case "lowpass":
        ctx.player.filters.add(new LowPassFilter({ smoothing: 20.0 }));
        await ctx.player.setFilters();
        await ctx.reply({
          embeds: [successEmbed("FILTER APPLIED", "Low Pass audio filter enabled.")],
          components: buildPlayerComponents(ctx.player),
        });
        break;
      default:
        await ctx.reply({
          embeds: [
            errorEmbed(
              "Unknown preset. Available: `clear`, `bassboost`, `nightcore`, `vaporwave`, `slowedreverb`, `vocalboost`, `karaoke`, `3d`, `tremolo`, `vibrato`, `lowpass`"
            ),
          ],
        });
        break;
    }
  },
};
