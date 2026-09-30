import type { ButtonInteraction, StringSelectMenuInteraction } from "discord.js";
import type { TrackData, YuKumo } from "yukumo";
import { addedEmbed, errorEmbed, queueEmbed, trackEmbed } from "../utils/embeds.js";
import { buildPlayerComponents, buildQueueControls } from "../components/playerComponents.js";
import { consumeSearchSession, getSearchSession } from "./searchSessions.js";

type MusicComponentInteraction = ButtonInteraction | StringSelectMenuInteraction;

function memberVoiceChannel(interaction: MusicComponentInteraction): string | null {
  return (interaction.member as { voice?: { channelId?: string | null } } | null)?.voice?.channelId ?? null;
}

async function applyFilter(
  player: NonNullable<ReturnType<YuKumo["getPlayer"]>>,
  value: string
): Promise<void> {
  switch (value) {
    case "filter_clear":
      player.filters.clear();
      break;
    case "filter_bassboost":
      player.filters.setBassBoost();
      break;
    case "filter_nightcore":
      player.filters.setNightcore();
      break;
    case "filter_vaporwave":
      player.filters.setVaporwave();
      break;
    case "filter_3d":
      player.filters.set8D();
      break;
    case "filter_karaoke":
      player.filters.setKaraoke();
      break;
    default:
      return;
  }
  await player.setFilters();
}

/** Route every component interaction to the right handler. */
export async function handleMusicComponent(
  interaction: MusicComponentInteraction,
  yukumo: YuKumo
): Promise<void> {
  const { customId, guildId } = interaction;
  if (!guildId) return;

  if (customId === "queue_noop") {
    await interaction.deferUpdate();
    return;
  }
  if (customId === "search_pick" && interaction.isStringSelectMenu()) {
    await handleSearchPick(interaction, yukumo);
    return;
  }
  if (customId.startsWith("queue_page:")) {
    await handleQueuePage(interaction, yukumo, Number(customId.split(":")[1]));
    return;
  }
  if (customId.startsWith("music_")) {
    await handlePlayerControl(interaction, yukumo);
    return;
  }
}

async function handleQueuePage(
  interaction: MusicComponentInteraction,
  yukumo: YuKumo,
  page: number
): Promise<void> {
  const player = yukumo.getPlayer(interaction.guildId!);
  if (!player) {
    await interaction.update({ embeds: [errorEmbed("There is no active player in this server.")], components: [] });
    return;
  }
  const target = Number.isFinite(page) ? page : 1;
  await interaction.update({ embeds: [queueEmbed(player, target)], components: buildQueueControls(player, target) });
}

async function handleSearchPick(interaction: StringSelectMenuInteraction, yukumo: YuKumo): Promise<void> {
  const session = getSearchSession(interaction.message.id);
  if (!session) {
    await interaction.reply({ embeds: [errorEmbed("This search has expired. Run `/search` again.")], ephemeral: true });
    return;
  }
  if (interaction.user.id !== session.requesterId) {
    await interaction.reply({ embeds: [errorEmbed("This search belongs to someone else.")], ephemeral: true });
    return;
  }

  const voiceChannelId = memberVoiceChannel(interaction);
  if (!voiceChannelId) {
    await interaction.reply({ embeds: [errorEmbed("Join a voice channel first.")], ephemeral: true });
    return;
  }

  const track = session.tracks[Number(interaction.values[0])];
  if (!track) {
    await interaction.reply({ embeds: [errorEmbed("That track is no longer available.")], ephemeral: true });
    return;
  }

  consumeSearchSession(interaction.message.id);

  (track as { userData?: Record<string, unknown> }).userData = {
    ...((track as { userData?: Record<string, unknown> }).userData ?? {}),
    requester: interaction.user.id,
  };

  const guildId = interaction.guildId!;
  let player = yukumo.getPlayer(guildId);
  if (!player) {
    player = await yukumo.createPlayer({
      guildId,
      voiceChannelId,
      textChannelId: interaction.channelId ?? "",
    });
  }

  const wasActive = Boolean(player.currentTrack) || player.status === "playing";
  await yukumo.play(guildId, track as TrackData);

  const embed = wasActive ? addedEmbed(track, player.queue.size) : trackEmbed(track, player);
  await interaction.update({ content: "", embeds: [embed], components: buildPlayerComponents(player) });
}

async function handlePlayerControl(interaction: MusicComponentInteraction, yukumo: YuKumo): Promise<void> {
  const guildId = interaction.guildId!;
  const voiceChannelId = memberVoiceChannel(interaction);
  if (!voiceChannelId) {
    await interaction.reply({ embeds: [errorEmbed("Join a voice channel to use the controls.")], ephemeral: true });
    return;
  }

  const player = yukumo.getPlayer(guildId);
  if (!player) {
    await interaction.reply({ embeds: [errorEmbed("There is no active player in this server.")], ephemeral: true });
    return;
  }
  if (player.voiceChannelId && player.voiceChannelId !== voiceChannelId) {
    await interaction.reply({ embeds: [errorEmbed("You must be in the same voice channel as the bot.")], ephemeral: true });
    return;
  }

  try {
    if (interaction.customId === "music_queue") {
      await interaction.reply({ embeds: [queueEmbed(player, 1)], components: buildQueueControls(player, 1), ephemeral: true });
      return;
    }

    switch (interaction.customId) {
      case "music_pause_resume":
        player.paused ? await yukumo.resume(guildId) : await yukumo.pause(guildId);
        break;
      case "music_skip":
        await yukumo.skip(guildId);
        break;
      case "music_stop":
        await yukumo.stop(guildId);
        break;
      case "music_shuffle":
        player.queue.shuffle();
        break;
      case "music_loop": {
        const next = player.queue.repeatMode === "none" ? "track" : player.queue.repeatMode === "track" ? "queue" : "none";
        player.setLoop(next as never);
        break;
      }
      case "music_prev": {
        const prev = player.queue.previous();
        if (prev) await player.playTrack(prev);
        break;
      }
      case "music_voldown":
        await player.setVolume(Math.max(0, player.volume - 10));
        break;
      case "music_volup":
        await player.setVolume(Math.min(1000, player.volume + 10));
        break;
      case "music_filters_select":
        if (interaction.isStringSelectMenu()) await applyFilter(player, interaction.values[0]);
        break;
    }

    await interaction.update({ components: buildPlayerComponents(player) });
  } catch (err) {
    console.error("[COMPONENT] interaction failed:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction
        .reply({ embeds: [errorEmbed("Failed to process that control.")], ephemeral: true })
        .catch(() => undefined);
    }
  }
}
