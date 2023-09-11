const { Context, Persona } = require("./schema.js");
const { encode } = require("gpt-3-encoder");

class MongoDB {
    constructor() {
        this.Player = Player;
    }

    static async getContextByGuildId(guildId) {
        
        const context = await Context.findOne({ guildId }, { _id: 0, __v: 0, guildId: 0, messages: { "_id": 0} })

        if (!context) {
            await MongoDB.newContext(guildId);
            return {context: [], guildId};
        }

        return {context: context.messages, guildId};
      
      }

    static async addToContext(guildId, newContext, role) {
        const context = (await MongoDB.getContextByGuildId(guildId)).context
        
        context.push({content: newContext, role: role})

        const updatedContext = await Context.updateOne({guildId}, {messages: context})
        console.log("Updated context for guild: " + guildId)
        return updatedContext;
    }   

    static async newContext(guildId) {
        const context = {
            _id: guildId,
            guildId: guildId,
            context: []
        }

        const newContext = new Context(context);
        console.log("Created new context for guild: " + guildId)
        return await newContext.save();
    }

    // clear the convo database
    static async clearContextByGuildId(guildId) {
        console.log("Clearing context for guild: " + guildId)
        const removedContext= await Context.deleteOne({guildId});
        return removedContext;
    }
    
    static async clearAllContext() {
        console.log("Clearing all contexts")
        const removedContext = await Context.deleteMany({});
        return removedContext;
    }

    static async trimContextByGuildId(guildId, currentContextLength) {
        const context = (await MongoDB.getContextByGuildId(guildId)).context
        const trimmedContext = context.slice(Math.max(context.length - 5, 0))
        const updatedContext = await Context.updateOne({guildId}, {messages: trimmedContext})
        console.log("Trimmed context for guild: " + guildId)
        console.log("Context length was: " + currentContextLength)
        return updatedContext;
    }

    static getTotalTokensFromContext(context) {
        let total = 0;
        context.forEach(({content}) => {
            total += encode(content).length;
        })
        return total;
    }

    static async getPersonaByGuildId(guildId) {
        const persona = await Persona.find({ guildId }, { _id: 0, __v: 0 })
        return persona;
    }

    static async setPersonaByGuildId(guildId, persona) {
        const personaObj = {
            guildId,
            name: "default",
            persona: "waduhejk",
            active: false
        }

        const newPersona = new Persona(personaObj);
        console.log("Created new persona for guild: " + guildId)
        return await newPersona.save();
    }
}

module.exports = MongoDB;
