import type { ChatInputCommandInteraction } from "discord.js";
import type { Command, CommandOption, ParsedOptions } from "../commands/types.js";

const TRUE_TOKENS = new Set(["true", "yes", "on", "1", "enable", "enabled"]);
const FALSE_TOKENS = new Set(["false", "no", "off", "0", "disable", "disabled"]);

/** ParsedOptions backed by a slash-command interaction. */
export function slashOptions(interaction: ChatInputCommandInteraction): ParsedOptions {
  return {
    getString: (n) => interaction.options.getString(n),
    getInteger: (n) => interaction.options.getInteger(n),
    getNumber: (n) => interaction.options.getNumber(n),
    getBoolean: (n) => interaction.options.getBoolean(n),
  };
}

export interface PrefixParseResult {
  opts: ParsedOptions;
  /** Required options with no value supplied. */
  missing: string[];
  /** Options whose supplied value failed type/choice validation. */
  invalid: string[];
}

/**
 * Map positional prefix tokens onto a command's declared options. Optional
 * choice-constrained options are only consumed when the leading token matches
 * a choice, which lets `play [engine] <query>` work without ambiguity.
 */
export function prefixOptions(command: Command, args: string[]): PrefixParseResult {
  const values = new Map<string, string | number | boolean>();
  const missing: string[] = [];
  const invalid: string[] = [];
  const options = command.options ?? [];
  let i = 0;

  for (const opt of options) {
    let token: string | undefined;

    if (opt.rest) {
      const rest = args.slice(i).join(" ").trim();
      token = rest.length ? rest : undefined;
      i = args.length;
    } else {
      token = args[i];
      if (
        token !== undefined &&
        opt.choices &&
        !opt.required &&
        !opt.choices.includes(token.toLowerCase())
      ) {
        continue; // leave this token for the next option
      }
      if (token !== undefined) i++;
    }

    if (token === undefined) {
      if (opt.required) missing.push(opt.name);
      continue;
    }

    const coerced = coerce(opt, token);
    if (coerced === undefined) {
      invalid.push(opt.name);
      continue;
    }
    if (opt.choices && !opt.choices.includes(String(coerced).toLowerCase())) {
      invalid.push(opt.name);
      continue;
    }
    values.set(opt.name, coerced);
  }

  return { opts: fromMap(values), missing, invalid };
}

function coerce(opt: CommandOption, token: string): string | number | boolean | undefined {
  switch (opt.type) {
    case "string":
      return token;
    case "integer": {
      const n = parseInt(token, 10);
      return Number.isNaN(n) ? undefined : n;
    }
    case "number": {
      const n = Number(token);
      return Number.isNaN(n) ? undefined : n;
    }
    case "boolean": {
      const t = token.toLowerCase();
      if (TRUE_TOKENS.has(t)) return true;
      if (FALSE_TOKENS.has(t)) return false;
      return undefined;
    }
  }
}

function fromMap(values: Map<string, string | number | boolean>): ParsedOptions {
  const get = (n: string) => (values.has(n) ? values.get(n)! : null);
  return {
    getString: (n) => {
      const v = get(n);
      return v == null ? null : String(v);
    },
    getInteger: (n) => {
      const v = get(n);
      return typeof v === "number" ? Math.trunc(v) : null;
    },
    getNumber: (n) => {
      const v = get(n);
      return typeof v === "number" ? v : null;
    },
    getBoolean: (n) => {
      const v = get(n);
      return typeof v === "boolean" ? v : null;
    },
  };
}
