import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  TOKEN: process.env.DISCORD_TOKEN ?? "",
  CLIENT_ID: process.env.CLIENT_ID ?? "",
  LAVALINK_HOST: process.env.LAVALINK_HOST ?? "localhost",
  LAVALINK_PORT: Number(process.env.LAVALINK_PORT ?? 2333),
  LAVALINK_PASS: process.env.LAVALINK_PASS ?? "youshallnotpass",
  LAVALINK_SECURE: process.env.LAVALINK_SECURE === "true",
  PREFIX: "!",
};

export const YELLOW_THEME = {
  PRIMARY: 0xFFD700,
  SECONDARY: 0xDAA520,
  ACCENT: 0xB8860B,
  LIGHT: 0xFFFF00,
  HEX: "#FFD700",
  FOOTER_TEXT: "Yukumo Music",
};

/**
 * Semantic palette. Gold stays the brand colour for content (now playing,
 * queue, info) while status feedback uses conventional colours so users can
 * parse success / failure at a glance.
 */
export const COLORS = {
  PRIMARY: 0xFFD700, // brand gold — content embeds
  SUCCESS: 0x57F287, // green
  ERROR: 0xED4245, // red
  WARNING: 0xFEE75C, // amber
  INFO: 0x5865F2, // blurple
  NEUTRAL: 0x2B2D31, // dark surface
} as const;

/** Per-user command cooldown in milliseconds (0 disables). */
export const DEFAULT_COOLDOWN_MS = 2000;
