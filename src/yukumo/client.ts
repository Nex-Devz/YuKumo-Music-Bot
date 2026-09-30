import { Client, GatewayIntentBits } from "discord.js";
import {
  YuKumo,
  DiscordJSAdapter,
  ConsoleLogger,
  levelFilteredLogger,
} from "yukumo";
import type { NodeStats } from "yukumo";
import { CONFIG } from "../config/config.js";
import { trackEmbed, warningEmbed } from "../utils/embeds.js";
import { buildPlayerComponents } from "../components/playerComponents.js";
import { FileStorage } from "./fileStorage.js";
import { pushLyricLine, stopLiveLyrics } from "../handlers/liveLyrics.js";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

export const yukumo = new YuKumo({
  userId: CONFIG.CLIENT_ID,
  nodes: [
    {
      host: CONFIG.LAVALINK_HOST,
      port: CONFIG.LAVALINK_PORT,
      password: CONFIG.LAVALINK_PASS,
      secure: CONFIG.LAVALINK_SECURE,
      name: "MainNode",
    },
  ],
  send: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    guild?.shard.send(payload);
  },
  logger: levelFilteredLogger(new ConsoleLogger(), "info"),
  // Survive restarts: persist queues + full player state to a local JSON file
  // and reclaim Lavalink sessions on init().
  storageAdapter: new FileStorage(".data/yukumo.json"),
  resuming: { enabled: true, timeout: 60, persistPlayers: true },
  queueOptions: { persist: true },
});

export const adapter = new DiscordJSAdapter(client, yukumo);

yukumo.on("nodeReady", (nodeId) => {
  console.log(`[YUKUMO] Node ready: ${nodeId}`);
});

yukumo.on("nodeDisconnected", (nodeId, code, reason) => {
  console.log(`[YUKUMO] Node disconnected (${nodeId}): code=${code}, reason=${reason}`);
});

yukumo.on("nodeReconnected", (nodeId) => {
  console.log(`[YUKUMO] Node reconnected: ${nodeId}`);
});

yukumo.on("nodeError", (nodeId, error) => {
  console.error(`[YUKUMO] Node error (${nodeId}):`, error);
});

yukumo.on("stats", (nodeId, stats: NodeStats) => {
  const memUsedMb = Math.round((stats.memory?.used ?? 0) / 1024 / 1024);
  const memAllocMb = Math.round((stats.memory?.allocated ?? 0) / 1024 / 1024);
  const cpuLavalink = ((stats.cpu?.lavalinkLoad ?? 0) * 100).toFixed(1);
  const cpuSystem = ((stats.cpu?.systemLoad ?? 0) * 100).toFixed(1);
  console.log(
    `[YUKUMO:STATS] [${nodeId}] Players: ${stats.playingPlayers}/${stats.players} | CPU: Lava ${cpuLavalink}%, Sys ${cpuSystem}% | Mem: ${memUsedMb}MB / ${memAllocMb}MB`
  );
});

yukumo.on("trackStart", async (guildId, track) => {
  const player = yukumo.getPlayer(guildId);
  if (!player || !player.textChannelId) return;

  try {
    const channel = await client.channels.fetch(player.textChannelId);
    if (channel && channel.isTextBased() && "send" in channel) {
      await channel.send({
        embeds: [trackEmbed(track, player)],
        components: buildPlayerComponents(player),
      });
    }
  } catch (err) {
    console.error("[ERROR] Failed to send trackStart embed:", err);
  }
});

yukumo.on("queueEnd", async (guildId) => {
  const player = yukumo.getPlayer(guildId);
  if (!player || !player.textChannelId) return;

  try {
    const channel = await client.channels.fetch(player.textChannelId);
    if (channel && channel.isTextBased() && "send" in channel) {
      await channel.send({
        embeds: [warningEmbed("Queue has ended. Use play command to add more tracks.")],
      });
    }
  } catch (err) {
    console.error("[ERROR] Failed to send queueEnd embed:", err);
  }
});

// Live lyrics (LavaLyrics). Feed lines into the tracking message; tear the
// session down when lyrics can't be found or the track ends.
yukumo.on("lyricsLine", (guildId, line) => {
  void pushLyricLine(client, guildId, line);
});

yukumo.on("lyricsNotFound", (guildId) => {
  stopLiveLyrics(guildId);
});

yukumo.on("trackEnd", (guildId) => {
  stopLiveLyrics(guildId);
});
