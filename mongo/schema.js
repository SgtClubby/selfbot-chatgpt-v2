const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGO_URI)
  .then(()=> console.log('MongoDB connected successfully.'))
  .catch(e=>console.log(e));

const contextSchema = new Schema({
    _id: String,
    guildId: String,
    messages: [
      {
        content: String,
        role: String,
      }
    ]
});

const personaSchema = new Schema({
    _id: String,
    guildId: String,
    name: String,
    persona: String,
    active: Boolean,
});

const Context = mongoose.model('context', contextSchema);
const Persona = mongoose.model('persona', personaSchema);


module.exports = { Context, Persona };