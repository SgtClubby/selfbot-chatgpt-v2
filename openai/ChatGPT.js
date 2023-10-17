const openai = require("./openai.js");

const {
  addToContext,
  getContextByGuildId,
  trimContextByGuildId,
  getTotalTokensFromContext,
  updateUsage,
  addUsage,
  getUsageByUserId,
  addTokens,
} = require("../mongo/mongo.js");
const { startTyping, stopTyping, splitMessage } = require("../utils/utils.js");

async function chatCompletion(prompt, guildId, message, rawModel) {
  let model = rawModel.trim().toLowerCase();
  // check if the user has used chatgpt before
  const usageExists = await getUsageByUserId(message.author.id);
  // if not, add them to the database and ask for their Vipps number
  if (!usageExists.length) {
    console.log(
      "User does not exist usage in database",
      "Starting onboarding for user " + message.author.id
    );
    // const collectedMsg = await awaitReply(
    //   message,
    //   "You have not used ChatGPT before now!\nWhat is your Vipps number? (Required for payment)"
    // );
    // const norwegianRegex = /(0047|\+47)?\d{8}/;
    // if (collectedMsg) {
    // let vipps = collectedMsg.content;
    // if (norwegianRegex.test(vipps)) {
    //   vipps = vipps.replace(/(0047|\+47)/, "");
    await addUsage(message.author.id, message.author.username, "unused", 1);
    //       return message.channel.send(
    //         `Thank you for using ChatGPT!\nYour Vipps number is ${vipps}\n\nYou can now use ChatGPT!`
    //       );
    //     } else {
    //       return message.channel.send("Invalid Vipps number.");
    //     }
    //   } else {
    //     return message.channel.send("No Vipps number provided.");
    //   }
  }
  // get current context
  const { context } = await getContextByGuildId(guildId);
  // const persona = (await getPersonaByGuildId(guildId))[0]?.persona;

  const contextTokenLength = getTotalTokensFromContext(context);
  // If the given prompt is too long, trim it
  if (contextTokenLength > process.env.TOKEN_LIMIT) {
    trimContextByGuildId(guildId, contextTokenLength);
  }

  const curTime = new Date().toLocaleTimeString();
  curDate = new Date().toLocaleDateString();
  if (model === "gpt-4") {
    console.log("GPT-4 model selected");
    prepend(
      {
        content: `
  You are running within a Discord bot.
  You respond to each person individually to create a personalized experience, using their corresponding mention. They are proivded to you.

  IMPORTANT: The way you mention someone is by using the <@id> notation, for example: <@1087738008813449287>,
  IMPORTANT: Although both the @username and <@id> is supplied to you, NEVER RESPOND USING @username, ALWAYS USE THE <@id>.
  IMPORTANT: Your also a user in the discord server, so you can also use <@1087738008813449287> to refer to yourself and if someone asks who you are, you should respond with your @mention.

  The time is currently ${curTime}.
  The date is currently ${curDate}.

  Now that you have current time and date available to you, you can infer when the conversation started and how long it has been going on for and the time between conversations and responses.
  You can also use this to make a joke about how long it took to get a respond from time to time, or give comments like "Good Morning", "Good Afternoon" or "Good Night" depending on the time and duration between messages.
  If there is just a few minutes between responses, no comment is needed, but has it gone 30 mintues or more, you can make a comment about how long it yook for you to get a response.
  Timestamps and date are provided per message aswell.

  IMPORTANT: If the Requester / Sender / Typer / Talking / Writer is the same as the last message in the given context, you can omit the @mention from the response.

  If someone asks who "is talking", "is writing" or "is typing", you should respond with the @mention of the person who is talking, writing or typing.
        `,
        role: "system",
      },
      context
    );
  }

  let gptprompt;

  console.log(model);

  // Add new message to context
  if (model == "gpt-4") {
    gptprompt = `
      Additional data:
      Requester / Talking / Writer / Typer / Sender: <@${message.author.id}> (@${message.author.username})
      Time: ${curDate} ${curTime}

      ${prompt}
    `;
  } else {
    gptprompt = `
      ${prompt}
    `;
  }

  context.push({ content: gptprompt, role: "user" });
  addToContext(guildId, gptprompt, "user");

  // Map context to OpenAI API format
  const mappedContext = context.map(({ content, role }) => ({ content, role }));

  startTyping(message);
  openai
    .createChatCompletion({
      model: model,
      messages: mappedContext,
    })
    .then(async (ChatGPTResponse) => {
      // Get response from OpenAI API
      const response = ChatGPTResponse.data.choices[0].message.content;
      addTokens(
        ChatGPTResponse.data.usage.completion_tokens,
        ChatGPTResponse.data.usage.prompt_tokens
      );

      // Add response to context
      addToContext(guildId, response, "assistant");

      // Send response to discord
      stopTyping();

      splitMessage(response).forEach((messagePart) => {
        message.channel.send(messagePart);
      });
      await updateUsage(
        message.author.id,
        ChatGPTResponse.data.usage.completion_tokens,
        ChatGPTResponse.data.usage.prompt_tokens
      );
    })
    .catch((e) => {
      // If error
      stopTyping();
      console.log(e?.response?.data?.error?.message);
      message.channel.send("An error occured: " + e);
    });
}

function prepend(value, array) {
  array.slice();
  array.unshift(value);
  return array;
}

module.exports = { chatCompletion };

async function awaitReply(msg, q, limit = 60000) {
  const filter = (m) => m.author.id === msg.author.id;
  const questionMessage = await msg.channel.send(q);
  try {
    const collected = await msg.channel.awaitMessages({
      filter,
      max: 1,
      time: limit,
      errors: ["time"],
    });
    const content = collected.first().content;
    const message = collected.first();
    return { content, questionMessage, message };
  } catch (e) {
    return false;
  }
}
