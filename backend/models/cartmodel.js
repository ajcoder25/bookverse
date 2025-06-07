const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  items: [
    {
      book: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true,
        set: function(book) {
          // If it's a valid ObjectId, use it as is
          if (mongoose.Types.ObjectId.isValid(book) && 
              (String(new mongoose.Types.ObjectId(book)) === String(book))) {
            return new mongoose.Types.ObjectId(book);
          }
          // Otherwise, store as string
          return String(book);
        },
        get: function(book) {
          // Ensure consistent string representation when getting the value
          return book && book.toString ? book.toString() : book;
        }
      },
      quantity: { type: Number, default: 1, min: 1 },
      price: { type: Number, required: true },
      title: { type: String, required: true },
      author: { type: String },
      image: { type: String },
      isGoogleBook: { type: Boolean, default: false },
      _id: false // Prevents MongoDB from adding _id to subdocuments
    }
  ],
  updatedAt: { type: Date, default: Date.now, index: true },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { getters: true, virtuals: false },
  toObject: { getters: true, virtuals: false }
});

// Compound index for faster lookups
cartSchema.index({ 'user': 1, 'items.book': 1 });

// Update the updatedAt timestamp on save
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Cart", cartSchema);