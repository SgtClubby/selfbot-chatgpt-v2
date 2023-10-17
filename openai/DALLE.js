const {
  startTyping,
  stopTyping,
  download,
  extractImgID,
} = require("../utils/utils.js");
const openai = require("./openai.js");

async function imageCompletion(prompt, message, number) {
  console.log("Image completion called with prompt: " + prompt);
  const imagePrompt = {
    prompt: prompt,
    n: number,
    size: "512x512",
    response_format: "url",
  };

  startTyping(message);
  openai
    .createImage(imagePrompt)
    .then((res) => {
      res.data.data.forEach((image) => {
        let filename = extractImgID(image.url);

        // Fall back to timestamp if no filename is provided
        if (!filename) filename = new Date().getTime() + ".png";

        download(image.url, filename, function () {
          stopTyping();
          return message.channel.send(
            `https://cdn.metrix.pw/chatgpt/${filename}`
          );
        });
      });
    })
    .catch((e) => {
      stopTyping();
      console.log(e.response.data.error.message);
      return message.channel.send(`Error: ${e.response.data.error.message}`);
    });
}

module.exports = imageCompletion;
