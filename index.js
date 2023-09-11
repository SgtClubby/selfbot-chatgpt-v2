const { Client } = require("discord.js-selfbot-v13");
require("dotenv").config();
const {
  clearContextByGuildId,
  getContextByGuildId,
  getPersonaByGuildId,
} = require("./mongo/mongo.js");
const { parseMessage, parseArgsImage } = require("./utils/parsers.js");
const imageCompletion = require("./openai/DALLE.js");
const { chatCompletion } = require("./openai/ChatGPT.js");
// Init discord client connection
const client = new Client({
  checkUpdate: false,
});

// Init Discord
client.login(process.env.TOKEN);

// Print when connected
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Message handler
client.on("messageCreate", async (message) => {
  // Ignore messages from other bots
  if (message.author.bot) return;

  // Parse the incoming message object, aswell as ignore messages that don't start with the prefix
  const { command, args, type } = parseMessage(message);
  const guildId = message.guild ? message.guild.id : message.channel.id;

  if (type === "none") return;

  switch (command) {
    case "clear":
      clearContextByGuildId(guildId);
      return message.channel.send("Conversation cleared.");
    case "show":
      return message.channel.send(
        (await getContextByGuildId(guildId)).context
          .map(({ content, role }) => `${role}: ${content}`)
          .join("\n")
      );
    case "logs":
    case "log":
      return console.log((await getContextByGuildId(guildId)).context);
    case "image":
      const { prompt, number } = parseArgsImage(args);
      if (!prompt) return message.channel.send("Please provide a prompt.");
      if (number > 5)
        return message.channel.send("You can only generate 5 images.");
      return imageCompletion(prompt, message, number);
    default:
      return chatCompletion(args.join(" "), guildId, message);
  }
});
