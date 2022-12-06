import {
  createAudioPlayer,
  joinVoiceChannel,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
} from "@discordjs/voice";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import ytdl from "ytdl-core";
import { client } from "../app.js";
import { getTitle, search } from "./youtubeApi.js";

const player = createAudioPlayer();
const voiceClients = {
  connection: null,
  queue: [],
  musicChannel: null,
};

player.on("error", (error) => {
  console.error(error);
});

player.on(AudioPlayerStatus.Idle, () => {
  voiceClients.queue.shift();

  if (voiceClients.queue[0]) {
    playMusic();
  }
});

const inVC = (msg) => {
  const voiceChannel = msg.member?.voice.channel;
  if (!voiceChannel) {
    msg.channel.send("You aren't connected to any voice channels");
    return false;
  }
  return voiceChannel;
};

const joinVoice = (msg) => {
  const voiceChannel = inVC(msg);
  if (!voiceChannel) return false;

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: msg.guild.id,
    adapterCreator: msg.guild.voiceAdapterCreator,
    selfDeaf: false,
  });
  voiceClients.connection = connection;
  return connection;
};

const leaveVoice = (msg) => {
  const { connection } = voiceClients;
  if (!connection)
    return msg.channel.send("I haven't connected to any voice channels");
  connection.destroy();
  voiceClients.connection = null;
};

const playMusic = () => {
  const { connection } = voiceClients;
  const song = voiceClients.queue[0];
  player.play(song.resource);
  voiceClients.musicChannel.send("Now playing `" + song.title + "`");
  entersState(player, AudioPlayerStatus.Playing, 5000);
  connection.subscribe(player);
};

const checkUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (err) {
    return false;
  }
};

const searchMusic = async (query, msg) => {
  const results = await search(query);
  let songs = "";
  results.forEach((res, idx) => {
    const duration = res.contentDetails.duration.substring(2).split(/M|S/);
    duration.pop();

    songs +=
      "**" +
      (idx + 1) +
      "**. " +
      res.snippet.title +
      " | (*" +
      duration.join(":") +
      "*)\n\n";
  });

  const embed = new EmbedBuilder()
    .setColor(0x40f790)
    .setTitle("Placeholder title")
    .setDescription(songs);

  const buttons = results.map((res, idx) =>
    new ButtonBuilder()
      .setCustomId(res.id)
      .setLabel((idx + 1).toString())
      .setStyle(ButtonStyle.Success)
  );

  const actions = new ActionRowBuilder().addComponents(
    buttons[0],
    buttons[1],
    buttons[2],
    buttons[3],
    buttons[4]
  );

  msg.channel.send({ embeds: [embed], components: [actions] });
};

const addMusic = (msg, content) => {
  if (!voiceClients.connection) {
    const res = joinVoice(msg);
    if (!res) return;
    voiceClients.connection = res;
  }

  if (!checkUrl(content)) {
    const query = msg.content.split(" ");
    query.shift();
    searchMusic(query.join(" "), msg);
    return;
  }

  addToQueue(msg.channel);
};

const addToQueue = async (channel, url) => {
  voiceClients.musicChannel = channel;
  const videoId = url.split("/")[3].split("=").reverse()[0];
  try {
    const resource = createAudioResource(
      ytdl("https://www.youtube.com/watch?v=" + videoId, {
        filter: "audioonly",
        quality: "lowestaudio",
      })
    );
    const title = await getTitle(videoId);
    voiceClients.queue.push({
      resource,
      title,
    });

    if (player.state.status === "idle") {
      playMusic();
    }
  } catch (e) {
    channel.send("Invalid youtube url");
  }
};

export default (msg, content) => {
  const message = content.substring(0, content.length - 1).split(" ");
  switch (message[0]) {
    case "join":
      joinVoice(msg);
      break;
    case "play":
      addMusic(msg, message[1]);
      break;
    case "leave":
      leaveVoice(msg);
      break;
    case "skip":
      inVC(msg);
      if (!voiceClients.queue[0]) {
        msg.channel.send("There aren't any music playing");
        return;
      }
      player.stop();
      msg.channel.send("skipped `" + voiceClients.queue[0].title + "`");
      break;
  }
};

export const buttonHandler = async (i) => {
  if (!i.isButton() || i.message.author.id !== client.user.id) return;
  i.deferUpdate();
  const videoId = i.customId;
  const title = await getTitle(videoId);
  const embeds = [
    new EmbedBuilder()
      .setColor(0x40f790)
      .setDescription(
        "🎵 " +
          (voiceClients.queue[0]
            ? " Adding " + title + " to the queue "
            : " " + title + " has been selected ") +
          " 🎵"
      ),
  ];
  i.message.edit({ components: [], embeds });
  addToQueue(i.message.channel, "https://youtu.be/" + videoId);
};
