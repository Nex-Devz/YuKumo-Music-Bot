import { Events, type Message } from "discord.js";
import { client, yukumo } from "../yukumo/client.js";
import { CONFIG } from "../config/config.js";
import { getCommand } from "../commands/index.js";
import { handlePrefixCommand } from "../handlers/commandHandler.js";

export function registerMessageCreateEvent(): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot || !message.guild || !message.content.startsWith(CONFIG.PREFIX)) return;

    const args = message.content.slice(CONFIG.PREFIX.length).trim().split(/ +/);
    const rawCommand = args.shift()?.toLowerCase();
    if (!rawCommand) return;

    const command = getCommand(rawCommand);
    if (!command) return;

    await handlePrefixCommand(message, yukumo, command, args);
  });
}
