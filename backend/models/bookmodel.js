const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: String,
  publishedDate: Date,
  pages: Number,
  genre: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
});

module.exports = mongoose.model("Book", bookSchema);
