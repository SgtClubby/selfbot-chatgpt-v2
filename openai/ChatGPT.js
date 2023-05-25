const { tokenLimit } = require("../config.json");
const openai = require("./openai.js");
const { addToContext, getContextByGuildId, trimContextByGuildId, getTotalTokensFromContext } = require("../mongo/mongo.js");
const { startTyping, stopTyping } = require("../utils/utils.js");

async function chatCompletion(prompt, guildId, message) {
    // get current context
    const { context } = await getContextByGuildId(guildId);

    const contextTokenLength = getTotalTokensFromContext(context);
    // If the given prompt is too long, trim it
    if (contextTokenLength > tokenLimit) {
        trimContextByGuildId(guildId, contextTokenLength);
    }

    // Add new message to context
    context.push({content: prompt, role: "user"});
    addToContext(guildId, prompt, "user");

    // Map context to OpenAI API format
    const mappedContext = context.map(({content, role}) => ({content, role}))

    startTyping(message)
    openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: mappedContext
    }).then(ChatGPTResponse => {
        // Get response from OpenAI API
        const response = ChatGPTResponse.data.choices[0].message.content;

        // Add response to context
        addToContext(guildId, response, "assistant");

        // Send response to discord
        stopTyping();
        message.channel.send(response);
    }).catch(e => {
        // If error
        stopTyping();
        message.channel.send("An error occured: " + e.response.data.error.message);
        console.log(e.response.data.error.message)
    })
}

module.exports = chatCompletion;