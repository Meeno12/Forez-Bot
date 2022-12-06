import commands from "./commands.js";
export const messageHandler = (msg) => {
  const { content } = msg;

  if (content.endsWith(";") && !msg.author.bot) {
    commands(msg, content);
  }
};
