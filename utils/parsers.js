const { PREFIX } = require("../config.json");

function parseArgsImage(args) {
  const num = parseInt(args[1]);
  if (typeof num === "number" && !isNaN(num)) {
    args.shift();
    args.shift();
    const prompt = args.join(" ");
    return {
      number: num,
      prompt,
      type: "imageMultiple",
    };
  } else {
    args.shift();
    const prompt = args.join(" ");
    return {
      number: 1,
      prompt,
      type: "imageSingle",
    };
  }
}

function parseMessage(message) {
  const args = message.content.split(" ");
  if (args[0] != PREFIX) return { command: "", args: "", type: "none" };

  args.shift();
  const command = args[0];
  return { command, args, type: "init" };
}

module.exports = {
  parseMessage,
  parseArgsImage,
};
