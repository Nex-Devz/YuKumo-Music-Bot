import type { ChatInputCommandInteraction, GuildMember, Message } from "discord.js";
import type { Player, YuKumo } from "yukumo";
import type { Command, CommandContext } from "../commands/types.js";
import { DEFAULT_COOLDOWN_MS } from "../config/config.js";
import { errorEmbed } from "../utils/embeds.js";
import { prefixOptions, slashOptions } from "./options.js";

const cooldowns = new Map<string, number>();

/** Returns remaining cooldown in ms (0 when ready) and arms the cooldown when ready. */
function consumeCooldown(userId: string, command: Command): number {
  const ms = command.cooldown ?? DEFAULT_COOLDOWN_MS;
  if (ms <= 0) return 0;
  const key = `${userId}:${command.name}`;
  const now = Date.now();
  const until = cooldowns.get(key) ?? 0;
  if (now < until) return until - now;
  cooldowns.set(key, now + ms);
  return 0;
}

/** Shared gate checks. Returns an error message, or null when the command may run. */
function validate(
  command: Command,
  voiceChannelId: string | null,
  player: Player | undefined,
  userId: string
): string | null {
  if (command.requiresVoice && !voiceChannelId) {
    return "You must be in a voice channel to use this command.";
  }
  if (command.requiresPlayer && !player) {
    return "Nothing is playing right now. Use `/play` to start.";
  }
  if (
    (command.requiresVoice || command.requiresPlayer) &&
    player?.voiceChannelId &&
    voiceChannelId &&
    player.voiceChannelId !== voiceChannelId
  ) {
    return "You must be in the same voice channel as the bot.";
  }
  const remaining = consumeCooldown(userId, command);
  if (remaining > 0) {
    return `Please wait ${(remaining / 1000).toFixed(1)}s before using \`${command.name}\` again.`;
  }
  return null;
}

/** Run the command body with a uniform error boundary. `onError` reports failures to the user. */
async function runCommand(
  command: Command,
  ctx: CommandContext,
  onError: (message: string) => Promise<unknown>
): Promise<void> {
  try {
    await command.execute(ctx);
  } catch (err) {
    console.error(`[COMMAND:${command.name}] execution failed:`, err);
    await onError("Something went wrong while running that command.").catch(() => undefined);
  }
}

/** Entry point for slash-command interactions. */
export async function handleSlashCommand(
  interaction: ChatInputCommandInteraction,
  yukumo: YuKumo,
  command: Command
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ embeds: [errorEmbed("Commands can only be used in a server.")], ephemeral: true });
    return;
  }

  const member = interaction.member as GuildMember | null;
  const voiceChannelId = member?.voice?.channelId ?? null;
  const player = yukumo.getPlayer(guildId);

  const error = validate(command, voiceChannelId, player, interaction.user.id);
  if (error) {
    await interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });
    return;
  }

  await interaction.deferReply();

  await runCommand(
    command,
    {
      guildId,
      voiceChannelId,
      textChannelId: interaction.channelId ?? "",
      args: [],
      opts: slashOptions(interaction),
      user: interaction.user,
      member,
      reply: (options) => interaction.editReply(options),
      yukumo,
      player,
      interaction,
    },
    (message) => interaction.editReply({ embeds: [errorEmbed(message)] })
  );
}

/** Entry point for prefix (message) commands. */
export async function handlePrefixCommand(
  message: Message,
  yukumo: YuKumo,
  command: Command,
  args: string[]
): Promise<void> {
  const guildId = message.guild?.id;
  if (!guildId) return;

  const voiceChannelId = message.member?.voice?.channelId ?? null;
  const player = yukumo.getPlayer(guildId);

  const error = validate(command, voiceChannelId, player, message.author.id);
  if (error) {
    await message.reply({ embeds: [errorEmbed(error)] });
    return;
  }

  const { opts, missing, invalid } = prefixOptions(command, args);
  if (missing.length || invalid.length) {
    const problem = missing.length
      ? `Missing argument: \`${missing.join("`, `")}\``
      : `Invalid value for: \`${invalid.join("`, `")}\``;
    await message.reply({ embeds: [errorEmbed(`${problem}. Try \`/${command.name}\` for guided input.`)] });
    return;
  }

  await runCommand(
    command,
    {
      guildId,
      voiceChannelId,
      textChannelId: message.channelId,
      args,
      opts,
      user: message.author,
      member: message.member,
      reply: (options) => message.reply(options),
      yukumo,
      player,
      message,
    },
    (msg) => message.reply({ embeds: [errorEmbed(msg)] })
  );
}
