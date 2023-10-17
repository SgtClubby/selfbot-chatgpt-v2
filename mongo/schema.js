const mongoose = require("mongoose");
const { Schema } = mongoose;
mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully."))
  .catch((e) => console.log(e));

const contextSchema = new Schema({
  _id: String,
  guildId: String,
  messages: [
    {
      content: String,
      role: String,
    },
  ],
});

const usageSchema = new Schema({
  _id: String,
  userId: String,
  username: String,
  tokens: {
    prompt_tokens: { type: Number, default: 0 },
    completion_tokens: { type: Number, default: 0 },
  },
  usage: Number,
});

const Tokens = new Schema({
  _id: String,
  prompt_tokens: Number,
  completion_tokens: Number,
});

const Context = mongoose.model("context", contextSchema);
const Usage = mongoose.model("usage", usageSchema);
const Token = mongoose.model("token", Tokens);

module.exports = { Context, Usage, Token };
