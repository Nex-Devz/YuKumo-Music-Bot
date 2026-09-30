import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import type { Player } from "yukumo";
import { titleCase } from "../utils/formatters.js";

/**
 * Interactive player control panel: transport buttons, volume/queue row and an
 * audio-filter select. Labels are plain text (no emoji) and reflect live state.
 */
export function buildPlayerComponents(
  player?: Player
): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {
  const isPaused = player?.paused ?? false;
  const repeatMode = player?.queue.repeatMode ?? "none";
  const queueSize = player?.queue.size ?? 0;

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("music_prev")
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_pause_resume")
      .setLabel(isPaused ? "Resume" : "Pause")
      .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("music_skip")
      .setLabel("Skip")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_stop")
      .setLabel("Stop")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("music_loop")
      .setLabel(repeatMode === "none" ? "Loop" : `Loop: ${titleCase(repeatMode)}`)
      .setStyle(repeatMode !== "none" ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("music_voldown")
      .setLabel("Vol −10")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_volup")
      .setLabel("Vol +10")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_shuffle")
      .setLabel("Shuffle")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(queueSize < 2),
    new ButtonBuilder()
      .setCustomId("music_queue")
      .setLabel(`Queue (${queueSize})`)
      .setStyle(ButtonStyle.Secondary)
  );

  const filterSelect = new StringSelectMenuBuilder()
    .setCustomId("music_filters_select")
    .setPlaceholder("Apply an audio filter…")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Clear filters")
        .setValue("filter_clear")
        .setDescription("Reset all active equalizers and effects"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Bass Boost")
        .setValue("filter_bassboost")
        .setDescription("Emphasise low-end frequencies"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Nightcore")
        .setValue("filter_nightcore")
        .setDescription("Faster tempo, higher pitch"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Vaporwave")
        .setValue("filter_vaporwave")
        .setDescription("Slower tempo, lower pitch"),
      new StringSelectMenuOptionBuilder()
        .setLabel("3D Rotation")
        .setValue("filter_3d")
        .setDescription("Rotating spatial audio"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Karaoke")
        .setValue("filter_karaoke")
        .setDescription("Suppress vocal frequencies")
    );

  const row3 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(filterSelect);

  return [row1, row2, row3];
}

const QUEUE_PAGE_SIZE = 10;

/** Prev/Next pager for a queue listing. `page` is 1-based. */
export function buildQueueControls(player: Player | undefined, page: number): ActionRowBuilder<ButtonBuilder>[] {
  const size = player?.queue.size ?? 0;
  const totalPages = Math.max(1, Math.ceil(size / QUEUE_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`queue_page:${current - 1}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(current <= 1),
    new ButtonBuilder()
      .setCustomId("queue_noop")
      .setLabel(`Page ${current}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`queue_page:${current + 1}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(current >= totalPages)
  );

  return [row];
}
