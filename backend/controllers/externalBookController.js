const axios = require("axios");
const config = require("../config");

const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";
const MAX_RESULTS = 40; // Maximum number of results to return

const fetchGoogleBooks = async (req, res) => {
  try {
    const {
      q,                  // Search query
      category,           // Book category/subject
      startIndex = 0,     // Pagination start index
      orderBy = "relevance", // Sort order (relevance or newest)
      filter,             // Filter (partial, full, free-ebooks, paid-ebooks, ebooks)
      langRestrict,       // Language restriction (e.g., 'en')
      maxResults = 40     // Add maxResults parameter with default
    } = req.query;

    if (!q && !category) {
      return res.status(400).json({
        error: "Either search query 'q' or 'category' parameter is required."
      });
    }

    // Build search query
    let searchQuery = q || '';
    if (category) {
      searchQuery += `+subject:${category}`;
    }

    const params = {
      q: searchQuery,
      maxResults: parseInt(maxResults),  // Use the passed maxResults instead of constant
      startIndex: parseInt(startIndex),
      orderBy
    };

    if (filter) params.filter = filter;
    if (langRestrict) params.langRestrict = langRestrict;

    const response = await axios.get(GOOGLE_BOOKS_API_URL, { params });

    // Transform the response to match our frontend needs
    const transformedBooks = response.data.items?.map(book => ({
      id: book.id,
      title: book.volumeInfo?.title || 'Untitled',
      author: book.volumeInfo?.authors?.join(', ') || 'Unknown Author',
      description: book.volumeInfo?.description || '',
      publishedDate: book.volumeInfo?.publishedDate,
      pageCount: book.volumeInfo?.pageCount,
      categories: book.volumeInfo?.categories || [],
      averageRating: book.volumeInfo?.averageRating,
      ratingsCount: book.volumeInfo?.ratingsCount,
      image: book.volumeInfo?.imageLinks?.thumbnail || 
             book.volumeInfo?.imageLinks?.smallThumbnail || 
             null,
      price: book.saleInfo?.listPrice?.amount || null,
      currency: book.saleInfo?.listPrice?.currencyCode || 'INR',
      buyLink: book.saleInfo?.buyLink || null,
      previewLink: book.volumeInfo?.previewLink || null,
      language: book.volumeInfo?.language || 'en'
    })) || [];

    res.json({
      total: response.data.totalItems || 0,
      books: transformedBooks,
      hasMore: response.data.totalItems > (parseInt(startIndex) + MAX_RESULTS)
    });

  } catch (error) {
    console.error('Google Books API Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || 'Failed to fetch books from Google Books API'
    });
  }
};

// Fetch a single book by ID
const fetchGoogleBookById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: "Book ID is required."
      });
    }

    const response = await axios.get(`${GOOGLE_BOOKS_API_URL}/${id}`);
    const book = response.data;

    // Transform the book data
    const transformedBook = {
      id: book.id,
      title: book.volumeInfo?.title || 'Untitled',
      author: book.volumeInfo?.authors?.join(', ') || 'Unknown Author',
      description: book.volumeInfo?.description || '',
      publishedDate: book.volumeInfo?.publishedDate,
      pageCount: book.volumeInfo?.pageCount,
      categories: book.volumeInfo?.categories || [],
      averageRating: book.volumeInfo?.averageRating,
      ratingsCount: book.volumeInfo?.ratingsCount,
      image: book.volumeInfo?.imageLinks?.thumbnail || 
             book.volumeInfo?.imageLinks?.smallThumbnail || 
             null,
      price: book.saleInfo?.listPrice?.amount || null,
      currency: book.saleInfo?.listPrice?.currencyCode || 'INR',
      buyLink: book.saleInfo?.buyLink || null,
      previewLink: book.volumeInfo?.previewLink || null,
      language: book.volumeInfo?.language || 'en',
      publisher: book.volumeInfo?.publisher,
      isbn: book.volumeInfo?.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier,
      isEbook: book.saleInfo?.isEbook || false
    };

    res.json(transformedBook);

  } catch (error) {
    console.error('Google Books API Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || 'Failed to fetch book details from Google Books API'
    });
  }
};

module.exports = { fetchGoogleBooks, fetchGoogleBookById };
