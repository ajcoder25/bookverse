const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  id: String, // Google Books ID
  googleId: { type: String }, // Alias for id
  title: { type: String, required: true },
  authors: [String],
  author: String, // For backward compatibility
  description: String,
  publishedDate: String,
  publisher: String,
  pageCount: Number,
  categories: [String],
  averageRating: Number,
  ratingsCount: Number,
  imageLinks: {
    smallThumbnail: String,
    thumbnail: String,
    small: String,
    medium: String,
    large: String,
    extraLarge: String
  },
  language: String,
  previewLink: String,
  infoLink: String,
  saleInfo: {
    country: String,
    saleability: String,
    isEbook: Boolean,
    listPrice: {
      amount: Number,
      currencyCode: String
    },
    retailPrice: {
      amount: Number,
      currencyCode: String
    },
    buyLink: String
  },
  accessInfo: {
    webReaderLink: String,
    accessViewStatus: String
  },
  genre: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create a unique index on googleId for faster lookups
bookSchema.index({ googleId: 1 }, { unique: true });

// Middleware to update the updatedAt field on save
bookSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure googleId is always set to the same value as id
bookSchema.pre('save', function(next) {
  if (this.id && !this.googleId) {
    this.googleId = this.id;
  }
  next();
});

module.exports = mongoose.model("Book", bookSchema);
