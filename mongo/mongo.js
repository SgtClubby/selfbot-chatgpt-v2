const { Context, Usage, Token } = require("./schema.js");
const { encode } = require("gpt-3-encoder");

class MongoDB {
  constructor() {
    this.Player = Player;
  }

  static async getContextByGuildId(guildId) {
    const context = await Context.findOne(
      { guildId },
      { _id: 0, __v: 0, guildId: 0, "messages._id": 0 }
    );

    if (!context) {
      await MongoDB.newContext(guildId);
      return { context: [], guildId };
    }

    return { context: context.messages, guildId };
  }

  static async addToContext(guildId, newContext, role) {
    const context = (await MongoDB.getContextByGuildId(guildId)).context;

    context.push({ content: newContext, role: role });

    const updatedContext = await Context.updateOne(
      { guildId },
      { messages: context }
    );
    console.log("Updated context for guild: " + guildId);
    return updatedContext;
  }

  static async newContext(guildId) {
    const context = {
      _id: guildId,
      guildId: guildId,
      context: [],
    };

    const newContext = new Context(context);
    console.log("Created new context for guild: " + guildId);
    return await newContext.save();
  }

  // clear the convo database
  static async clearContextByGuildId(guildId) {
    console.log("Clearing context for guild: " + guildId);
    const removedContext = await Context.deleteOne({ guildId });
    return removedContext;
  }

  static async clearAllContext() {
    console.log("Clearing all contexts");
    const removedContext = await Context.deleteMany({});
    return removedContext;
  }

  static async trimContextByGuildId(guildId, currentContextLength) {
    const context = (await MongoDB.getContextByGuildId(guildId)).context;
    const trimmedContext = context.slice(Math.max(context.length - 5, 0));
    const updatedContext = await Context.updateOne(
      { guildId },
      { messages: trimmedContext }
    );
    console.log("Trimmed context for guild: " + guildId);
    console.log("Context length was: " + currentContextLength);
    return updatedContext;
  }

  static getTotalTokensFromContext(context) {
    let total = 0;
    context.forEach(({ content }) => {
      total += encode(content).length;
    });
    return total;
  }

  static async getPersonaByGuildId(guildId) {
    const persona = await Persona.find({ guildId }, { _id: 0, __v: 0 });
    return persona;
  }

  static async setPersonaByGuildId(guildId, persona) {
    const personaObj = {
      guildId,
      name: "default",
      persona: "waduhejk",
      active: false,
    };

    const newPersona = new Persona(personaObj);
    console.log("Created new persona for guild: " + guildId);
    return await newPersona.save();
  }

  static async getUsageByUserId(userId) {
    const usage = await Usage.find({ userId }, { _id: 0, __v: 0 });
    return usage;
  }

  static async addUsage(userId, username, vipps, usage = 0) {
    const usageObj = {
      _id: userId,
      userId,
      username,
      vipps,
      usage,
    };

    const newUsage = new Usage(usageObj);
    console.log("Created new usage for user: " + userId);
    return await newUsage.save();
  }

  static async updateUsage(userId, ct, pt) {
    const existing = await Usage.findOne({ userId }, { _id: 0, __v: 0 });
    await Usage.updateOne({ userId }, { $inc: { usage: 1 } });
    await Usage.updateOne(
      {
        userId,
      },
      {
        $set: {
          tokens: {
            completion_tokens: existing.tokens.completion_tokens + ct,
            prompt_tokens: existing.tokens.prompt_tokens + pt,
          },
        },
      }
    );
    console.log("Updated usage for user: " + userId);
  }

  static async clearAllUsage() {
    console.log("Clearing all usage");
    const removedUsage = await Usage.deleteMany({});
    return removedUsage;
  }

  static async getAllUsage() {
    const usage = await Usage.find({}, { _id: 0, __v: 0 });
    return usage;
  }

  static async getTokens() {
    const tokens = await Token.find({ _id: "tokens" }, { _id: 0, __v: 0 });
    return tokens;
  }

  static async addTokens(completion_tokens, prompt_tokens) {
    const existingTokens = await MongoDB.getTokens();

    const result = await Token.updateOne(
      { _id: "tokens" },
      {
        $set: {
          completion_tokens:
            existingTokens[0].completion_tokens + completion_tokens,
          prompt_tokens: existingTokens[0].prompt_tokens + prompt_tokens,
        },
      }
    );

    console.log("Added tokens to database");
    return result;
  }

  static async getAllUsageAndTokens() {
    const usage = await Usage.find({}, { _id: 0, __v: 0 });
    const tokens = await Token.find({ _id: "tokens" }, { _id: 0, __v: 0 });
    return { usage, tokens: tokens[0] };
  }

  static async clearAllTokens() {
    console.log("Clearing all tokens");
    const removedTokens = await Token.deleteMany({});
    return removedTokens;
  }

  static async clearAllUsageAndTokens() {
    console.log("Clearing all usage and tokens");
    const removedUsage = await Usage.deleteMany({});
    // dont delete the document within the tokens collection, set them to zero
    const removedTokens = await Token.updateOne(
      { _id: "tokens" },
      { $set: { completion_tokens: 0, prompt_tokens: 0 } }
    );
    return { removedUsage, removedTokens };
  }
}

module.exports = MongoDB;
