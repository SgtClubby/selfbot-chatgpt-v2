const { client, initClient } = require("./modules/client.js");
const { handleMessage } = require("./modules/messageHandler.js");

// Init discord client connection
initClient();

// Message handler
client.on("messageCreate", handleMessage);
