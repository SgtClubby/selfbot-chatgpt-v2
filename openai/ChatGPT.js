const openai = require("./openai.js");

const {
  addToContext,
  getContextByGuildId,
  trimContextByGuildId,
  getTotalTokensFromContext,
  getPersonaByGuildId,
} = require("../mongo/mongo.js");
const {
  startTyping,
  stopTyping,
  startTypingChannel,
  stopTypingChannel,
  splitMessage,
} = require("../utils/utils.js");

async function chatCompletion(prompt, guildId, message) {
  // get current context
  const { context } = await getContextByGuildId(guildId);
  // const persona = (await getPersonaByGuildId(guildId))[0]?.persona;

  const contextTokenLength = getTotalTokensFromContext(context);
  // If the given prompt is too long, trim it
  if (contextTokenLength > process.env.TOKEN_LIMIT) {
    trimContextByGuildId(guildId, contextTokenLength);
  }

  prepend(
    {
      content: `
        You are running within a discord bot, due to limitations with the discord api, you can only send a total of 2000 characters at a time.
        You respond to each person individually to create a personalized experience, using their corresponding @mention. They are proivded to you.

        IMPORTANT: If the subject of the conversation has not changed and/or the requester is the same, you can omit the @mention from the response. 

        When providing long enough code, markdown or codeblocks, please try to keep them within 2000 characters blocks, so they are not
        split if the message is too long, causing discord to not be able to parse the codeblock correctly.
      `,
      role: "system",
    },
    context
  );

  // Add new message to context

  const extendedPrompt = `
    Requester: ${message.author}

    ${prompt}
  `;

  context.push({ content: extendedPrompt, role: "user" });
  addToContext(guildId, extendedPrompt, "user");

  // Map context to OpenAI API format
  const mappedContext = context.map(({ content, role }) => ({ content, role }));

  startTyping(message);
  openai
    .createChatCompletion({
      model: "gpt-4",
      messages: mappedContext,
    })
    .then((ChatGPTResponse) => {
      // Get response from OpenAI API
      const response = ChatGPTResponse.data.choices[0].message.content;

      // Add response to context
      addToContext(guildId, response, "assistant");

      // Send response to discord
      stopTyping();
      splitMessage(response).forEach((messagePart) => {
        message.channel.send(messagePart);
      });
    })
    .catch((e) => {
      // If error
      stopTyping();
      message.channel.send(
        "An error occured: " + e.response.data.error.message
      );
      console.log(e.response.data.error.message);
    });
}

function prepend(value, array) {
  array.slice();
  array.unshift(value);
  return array;
}

module.exports = { chatCompletion };
