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
  

const Context = mongoose.model('context', contextSchema);


module.exports = { Context };