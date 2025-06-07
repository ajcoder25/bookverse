const Book = require("../models/bookmodel");

const getBooks = async (req, res) => {
  try {
    const books = await Book.find().populate("genre");
    res.json({ data: { products: books } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const axios = require('axios');
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

const getBookById = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }
    
    // Try to find by MongoDB _id only if valid
    let book = null;
    if (require('mongoose').Types.ObjectId.isValid(productId)) {
      book = await Book.findById(productId).populate("genre");
    }
    // If not found by _id, try to find by googleId
    if (!book) {
      book = await Book.findOne({ googleId: productId }).populate("genre");
    }
    // If still not found, try to find by id (for backward compatibility)
    if (!book) {
      book = await Book.findOne({ id: productId }).populate("genre");
    }
    
    // If book is still not found in our DB, try to fetch from Google Books API
    if (!book) {
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey.trim() === '') {
        console.warn(`Google Books API key is missing or invalid. Skipping Google Books search for productId: ${productId}. Ensure GOOGLE_BOOKS_API_KEY is set in your .env file.`);
      } else {
        try {
          console.log(`Fetching productId: ${productId} from Google Books API with key: ${apiKey.substring(0, 4)}...`);
          const response = await axios.get(`${GOOGLE_BOOKS_API}/${productId}?key=${apiKey}`);
          
          if (response.data && response.data.volumeInfo) {
            const volumeInfo = response.data.volumeInfo || {};
            const saleInfo = response.data.saleInfo || {};
            const accessInfo = response.data.accessInfo || {};
            
            const bookData = {
              id: response.data.id,
              googleId: response.data.id,
              title: volumeInfo.title || 'Untitled',
              authors: volumeInfo.authors || [],
              author: volumeInfo.authors?.[0] || 'Unknown Author',
              description: volumeInfo.description || 'No description available.',
              publishedDate: volumeInfo.publishedDate || '',
              publisher: volumeInfo.publisher || 'Unknown Publisher',
              pageCount: volumeInfo.pageCount || 0,
              categories: volumeInfo.categories || [],
              averageRating: volumeInfo.averageRating || 0,
              ratingsCount: volumeInfo.ratingsCount || 0,
              imageLinks: volumeInfo.imageLinks || {},
              language: volumeInfo.language || 'en',
              previewLink: volumeInfo.previewLink || '',
              infoLink: volumeInfo.infoLink || '',
              saleInfo: {
                country: saleInfo.country || 'US',
                saleability: saleInfo.saleability || 'NOT_FOR_SALE',
                isEbook: saleInfo.isEbook || false,
                listPrice: saleInfo.listPrice || { amount: 0, currencyCode: 'USD' },
                retailPrice: saleInfo.retailPrice || { amount: 0, currencyCode: 'USD' },
                buyLink: saleInfo.buyLink || ''
              },
              accessInfo: {
                webReaderLink: accessInfo.webReaderLink || '',
                accessViewStatus: accessInfo.accessViewStatus || 'NONE'
              }
            };
            
            console.log(`Successfully fetched and transformed data for ${productId} from Google Books. Attempting to save.`);
            try {
              book = new Book(bookData);
              await book.save();
              console.log(`Successfully saved ${productId} to local database.`);
            } catch (saveError) {
              if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.googleId) {
                // Duplicate key error on googleId. This means the book was likely already in the DB.
                console.warn(`Attempted to save book with googleId ${productId}, but it already exists. Re-fetching local record.`);
                book = await Book.findOne({ googleId: productId }).populate("genre");
                if (!book) {
                  // This case should be rare if a duplicate key error occurred, but handle it.
                  console.error(`Duplicate key error for googleId ${productId}, but failed to re-fetch the record.`);
                  throw saveError; // Re-throw original save error if re-fetch fails
                }
              } else {
                // Different save error, re-throw it.
                throw saveError;
              }
            }
          } else {
            // Google API call was successful (2xx) but data is not as expected (e.g., book not found on Google, or error structure in response body)
            console.warn(`Google Books API call for productId: ${productId} was successful but returned no volumeInfo or an unexpected response structure. Response data:`, response.data);
            // Let it fall through, book will remain null, leading to a 404 if not found elsewhere
          }
        } catch (googleFetchError) {
          console.error(`Error during Google Books API fetch or processing for productId: ${productId}. Message: ${googleFetchError.message}`);
          if (googleFetchError.response) {
            console.error('Google Books API - Error Response Status:', googleFetchError.response.status);
            console.error('Google Books API - Error Response Data:', googleFetchError.response.data);
          }
          // An error occurred (network, API error status code, etc.). Let it fall through, book will remain null, leading to a 404.
        }
      }
    }
    
    if (!book) {
      return res.status(404).json({ 
        error: 'Book not found',
        message: 'The requested book could not be found in our database or Google Books.'
      });
    }
    
    res.json({ 
      success: true,
      data: { 
        product: book 
      } 
    });
    
  } catch (err) {
    console.error('Error in getBookById:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch book details',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while fetching the book details.'
    });
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
