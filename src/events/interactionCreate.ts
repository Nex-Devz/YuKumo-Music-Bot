import { Events, type Interaction } from "discord.js";
import { client, yukumo } from "../yukumo/client.js";
import { getCommand } from "../commands/index.js";
import { errorEmbed } from "../utils/embeds.js";
import { handleSlashCommand } from "../handlers/commandHandler.js";
import { handleMusicComponent } from "../handlers/componentHandler.js";

export function registerInteractionCreateEvent(): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
      await handleMusicComponent(interaction, yukumo);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = getCommand(interaction.commandName);
    if (!command) {
      await interaction.reply({ embeds: [errorEmbed("Unknown command.")], ephemeral: true });
      return;
    }

    await handleSlashCommand(interaction, yukumo, command);
  });
}
