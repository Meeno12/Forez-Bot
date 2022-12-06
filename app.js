import { Client, Events, GatewayIntentBits } from "discord.js";
import { messageHandler } from "./src/events.js";
import dotenv from "dotenv";
import { buttonHandler } from "./src/commands.js";

dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;

export const client = new Client({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // const guildManager = client.guilds;
  // const guilds = await guildManager.fetch();
  // guilds.forEach(async (g) => {
  //   const guild = await g.fetch();
  //   guild.systemChannel.send("World");
  // });
});

client.on("messageCreate", messageHandler);

client.on(Events.InteractionCreate, buttonHandler);

client.login(TOKEN);
