const { Client, Intents } = require("discord.js-selfbot-v13");
require("dotenv").config();
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

const initClient = () => {
  client.login(process.env.TOKEN);

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });
};

module.exports = { client, initClient };
