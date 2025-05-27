const Book = require("../models/bookmodel");

const getBooks = async (req, res) => {
  try {
    const books = await Book.find().populate("genre");
    res.json({ data: { products: books } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.productId).populate("genre");
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json({ data: { product: book } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createBook = async (req, res) => {
  try {
    const newBook = new Book(req.body);
    const savedBook = await newBook.save();
    res.status(201).json({ data: { product: savedBook } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getBooks, getBookById, createBook };
