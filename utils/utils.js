const fs = require("fs");
const request = require("request");
const { getAllUsageAndTokens } = require("../mongo/mongo");

let interval;
function startTyping(message) {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  if (!message.channel) return;
  message.channel.sendTyping();
  interval = setInterval(() => {
    message.channel.sendTyping();
  }, 1000);
}

let chaInterval;
function startTypingChannel(channel) {
  if (chaInterval) {
    clearInterval(chaInterval);
    chaInterval = null;
  }
  channel.sendTyping();
  chaInterval = setInterval(() => {
    channel.sendTyping();
  }, 1000);
}

// Stop typing indicator
function stopTypingChannel() {
  clearInterval(chaInterval);
}

function stopTyping() {
  clearInterval(interval);
}

function download(uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    request(uri)
      .pipe(fs.createWriteStream(`/home/ftpuser/chatgpt/${filename}`))
      .on("close", callback);
  });
}

// Extract image ID from URL
function extractImgID(string) {
  const regex = /\/([\w-]+\.png)\?/;
  const found = string.match(regex);

  if (found) {
    return found[1];
  }

  return null;
}

function splitMessage(message) {
  const messageArray = [];
  let messagePart = "";
  let messagePartLength = 0;
  message.split(" ").forEach((word) => {
    if (messagePartLength + word.length < 1900) {
      messagePart += word + " ";
      messagePartLength += word.length + 1;
    } else {
      messageArray.push(messagePart);
      messagePart = "";
      messagePartLength = 0;
    }
  });
  messageArray.push(messagePart);
  return messageArray;
}

async function cost(message) {
  const data = await getAllUsageAndTokens();

  const totalCost =
    (data.tokens.prompt_tokens / 1000) * 0.03 +
    (data.tokens.completion_tokens / 1000) * 0.06;

  const mappedUsage = data.usage.map((u) => {
    // calculate percentage of total messages
    return `**@${u.username}** (${u.userId}) - ${u.usage} messages (${(
      (u.usage / data.usage.reduce((a, b) => a + b.usage, 0)) *
      100
    ).toFixed(2)}% of total, ${(
      (u.usage / data.usage.reduce((a, b) => a + b.usage, 0)) *
      totalCost
    ).toFixed(2)}$ PT: ${u.tokens.prompt_tokens} CT: ${
      u.tokens.completion_tokens
    })`;
  });

  return `
        **Total cost**: $${totalCost.toFixed(2)}\n\n**Total users**: ${
    data.usage.length
  } users\n**Total messages**: ${data.usage.reduce(
    (a, b) => a + b.usage,
    0
  )}\n\n${mappedUsage.join("\n")}`;
}

module.exports = {
  cost,
  startTyping,
  stopTyping,
  startTypingChannel,
  stopTypingChannel,
  download,
  extractImgID,
  splitMessage,
};
