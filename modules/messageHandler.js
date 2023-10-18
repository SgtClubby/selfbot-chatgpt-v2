require("dotenv").config();
const {
  clearContextByGuildId,
  getContextByGuildId,
  getAllUsage,
  getAllUsageAndTokens,
  clearAllUsageAndTokens,
} = require("../mongo/mongo.js");
const { parseMessage, parseArgsImage } = require("../utils/parsers.js");
const imageCompletion = require("../openai/DALLE.js");
const { chatCompletion } = require("../openai/ChatGPT.js");
const { encode } = require("gpt-3-encoder");
const { cost } = require("../utils/utils.js");

let model = "gpt-3.5-turbo";

const handleMessage = async (message) => {
  // Ignore messages from other bots
  if (message.author.bot) return;

  // Parse the incoming message object, aswell as ignore messages that don't start with the prefix
  const { command, args, type } = parseMessage(message);
  const guildId = message.guild ? message.guild.id : message.channel.id;

  if (type === "none") return;

  switch (command) {
    case "token":
      const tokens = encode(args.join(" "));
      console.log(tokens);
      return message.channel.send(Array.from(tokens).length.toString());
    case "model":
      if (!args[1]) return message.channel.send(`Current model: ${model}`);
      if (args[1] === "default") {
        model = "gpt-3.5-turbo";
        return message.channel.send(`Updated model to: ${model}`);
      }
      if (args[1] === "list")
        return message.channel.send(
          "Available models: gpt-3.5-turbo (default) and gpt-4"
        );
      if (args[1] != "gpt-3.5-turbo" && args[1] != "gpt-4") {
        return message.channel.send(
          "Invalid model. Available models: gpt-3.5-turbo (default) and gpt-4"
        );
      }
      model = args[1];
      return message.channel.send(`Updated model to: ${model}`);
    case "usage":
      return message.channel.send(await cost());

    case "clear":
      clearContextByGuildId(guildId);
      return message.channel.send("Cleared context!");
    case "logs":
    case "log":
      return console.log((await getContextByGuildId(guildId)).context);
    case "image":
      const { prompt, number } = parseArgsImage(args);
      if (!prompt) return message.channel.send("Please provide a prompt.");
      if (number > 5)
        return message.channel.send("You can only generate 5 images.");
      return imageCompletion(prompt, message, number);
    case "usage-clear":
      const response = await awaitReply(
        message,
        "Are you sure you want to clear all usage data? Y / n"
      );
      if (response.toLowerCase() != "y")
        return message.channel.send("Cancelled.");

      await clearAllUsageAndTokens();
      return message.channel.send("Cleared usage data!");
    default:
      return chatCompletion(args.join(" "), guildId, message, model);
  }
};
module.exports = { handleMessage };

async function awaitReply(msg, question, limit = 60000) {
  const filter = (m) => m.author.id === msg.author.id;
  await msg.channel.send(question);
  try {
    const collected = await msg.channel.awaitMessages({
      filter,
      max: 1,
      time: limit,
      errors: ["time"],
    });
    return collected.first().content;
  } catch (e) {
    return false;
  }
}
