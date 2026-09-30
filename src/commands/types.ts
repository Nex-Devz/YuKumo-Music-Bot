import type {
  ChatInputCommandInteraction,
  GuildMember,
  Message,
  User,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import type { Player, YuKumo } from "yukumo";

export type CommandOptionType = "string" | "integer" | "number" | "boolean";

export interface CommandOption {
  name: string;
  type: CommandOptionType;
  required?: boolean;
  /** Restrict accepted values (validated for prefix input; slash relies on Discord choices). */
  choices?: string[];
  /**
   * Prefix parsing only: consume all remaining args as a single string.
   * Must be the last option and applies to `string` options.
   */
  rest?: boolean;
}

/** Uniform option accessor backed by either a slash interaction or parsed prefix args. */
export interface ParsedOptions {
  getString(name: string): string | null;
  getInteger(name: string): number | null;
  getNumber(name: string): number | null;
  getBoolean(name: string): boolean | null;
}

export interface CommandContext {
  guildId: string;
  voiceChannelId: string | null;
  textChannelId: string;
  /** Raw prefix tokens (empty for slash invocations). Prefer `opts` for typed access. */
  args: string[];
  opts: ParsedOptions;
  user: User;
  member: GuildMember | null;
  reply: (options: { embeds?: any[]; components?: any[]; content?: string }) => Promise<any>;
  yukumo: YuKumo;
  player: Player | undefined;
  interaction?: ChatInputCommandInteraction;
  message?: Message;
}

export interface Command {
  name: string;
  description: string;
  aliases?: string[];
  slashData: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder;
  /** Declarative option schema, shared by slash and prefix parsing. */
  options?: CommandOption[];
  requiresVoice?: boolean;
  requiresPlayer?: boolean;
  /** Per-user cooldown in ms. Falls back to DEFAULT_COOLDOWN_MS when undefined. */
  cooldown?: number;
  execute: (ctx: CommandContext) => Promise<void>;
}
