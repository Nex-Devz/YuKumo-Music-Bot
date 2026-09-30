import { Collection } from "discord.js";
import type { Command } from "./types.js";
import { playCommand } from "./music/play.js";
import { pauseCommand } from "./music/pause.js";
import { resumeCommand } from "./music/resume.js";
import { skipCommand } from "./music/skip.js";
import { stopCommand } from "./music/stop.js";
import { seekCommand } from "./music/seek.js";
import { previousCommand } from "./music/previous.js";
import { queueCommand } from "./music/queue.js";
import { clearCommand } from "./music/clear.js";
import { removeCommand } from "./music/remove.js";
import { moveCommand } from "./music/move.js";
import { nowplayingCommand } from "./music/nowplaying.js";
import { volumeCommand } from "./music/volume.js";
import { filterCommand } from "./music/filter.js";
import { speedCommand } from "./music/speed.js";
import { pitchCommand } from "./music/pitch.js";
import { shuffleCommand } from "./music/shuffle.js";
import { loopCommand } from "./music/loop.js";
import { nodeinfoCommand } from "./music/nodeinfo.js";
import { nodeselectCommand } from "./music/nodeselect.js";
import { playerstatusCommand } from "./music/playerstatus.js";
import { playersCommand } from "./music/players.js";
import { leaveCommand } from "./music/leave.js";
import { joinCommand } from "./music/join.js";
import { helpCommand } from "./music/help.js";
import { autoplayCommand } from "./music/autoplay.js";
import { stayCommand } from "./music/stay.js";
import { lyricsCommand } from "./music/lyrics.js";
import { swapCommand } from "./music/swap.js";
import { skiptoCommand } from "./music/skipto.js";
import { searchCommand } from "./music/search.js";

export const commands = new Collection<string, Command>();
export const commandAliases = new Map<string, string>();

const commandList: Command[] = [
  playCommand,
  pauseCommand,
  resumeCommand,
  skipCommand,
  stopCommand,
  seekCommand,
  previousCommand,
  queueCommand,
  clearCommand,
  removeCommand,
  moveCommand,
  nowplayingCommand,
  volumeCommand,
  filterCommand,
  speedCommand,
  pitchCommand,
  shuffleCommand,
  loopCommand,
  nodeinfoCommand,
  nodeselectCommand,
  playerstatusCommand,
  playersCommand,
  leaveCommand,
  joinCommand,
  helpCommand,
  autoplayCommand,
  stayCommand,
  lyricsCommand,
  swapCommand,
  skiptoCommand,
  searchCommand,
];

for (const cmd of commandList) {
  commands.set(cmd.name, cmd);
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      commandAliases.set(alias, cmd.name);
    }
  }
}

export function getCommand(name: string): Command | undefined {
  const resolved = commandAliases.get(name.toLowerCase()) || name.toLowerCase();
  return commands.get(resolved);
}
