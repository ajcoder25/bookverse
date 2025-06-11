const axios = require("axios");
const config = require("../config");
require('dotenv').config();

const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || "";
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
      maxResults = 40,    // Add maxResults parameter with default
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
      maxResults: parseInt(maxResults),
      startIndex: parseInt(startIndex),
      orderBy,
      key: GOOGLE_BOOKS_API_KEY // Add API key to the request
    };

    if (filter) params.filter = filter;
    if (langRestrict) params.langRestrict = langRestrict;
    
    // Ensure printType is included to get better results
    if (!params.q.includes('printType')) {
      params.printType = 'books';
    }

    const response = await axios.get(GOOGLE_BOOKS_API_URL, { params });

    // Transform the response to match our frontend needs
    const items = response.data.items || [];
    const transformedBooks = items.map(book => {
      try {
        // Process image links
        const imageLinks = book.volumeInfo?.imageLinks || {};
        
        // Ensure we have the best possible image URL
        let thumbnail = imageLinks.thumbnail || imageLinks.smallThumbnail || '';
        let smallThumbnail = imageLinks.smallThumbnail || imageLinks.thumbnail || '';
        
        // Convert http to https and clean up URLs
        const processImageUrl = (url) => {
          if (!url) return '';
          
          // Convert to HTTPS and clean up the URL
          let processed = url
            .replace(/^http:/, 'https:')  // Force HTTPS
            .replace(/&edge=curl&source=gbs_api$/, '')  // Remove existing params if present
            .replace(/&printsec=frontcover&img=1&zoom=\d*/, '')  // Remove existing zoom params
            .replace(/&source=gbs_api$/, '');  // Remove source param if at the end
            
          // Add necessary parameters for a good quality image
          if (processed.includes('books.google.com')) {
            // For Google Books images, add the necessary parameters
            processed += (processed.includes('?') ? '&' : '?') + 'printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api';
          }
          
          return processed;
        };
        
        thumbnail = processImageUrl(thumbnail);
        smallThumbnail = processImageUrl(smallThumbnail);
        
        // Add debug logs
        console.log('Processing book:', book.volumeInfo?.title);
        console.log('Original imageLinks:', JSON.stringify(book.volumeInfo?.imageLinks, null, 2));
        console.log('Processed thumbnail:', thumbnail);
        console.log('Processed smallThumbnail:', smallThumbnail);
        
        // Create the book object
        const bookData = {
          id: book.id,
          volumeInfo: {
            title: book.volumeInfo?.title || 'Untitled',
            authors: book.volumeInfo?.authors || ['Unknown Author'],
            description: book.volumeInfo?.description || '',
            publishedDate: book.volumeInfo?.publishedDate,
            pageCount: book.volumeInfo?.pageCount,
            categories: book.volumeInfo?.categories || [],
            averageRating: book.volumeInfo?.averageRating || (Math.random() * 2 + 3).toFixed(1),
            ratingsCount: book.volumeInfo?.ratingsCount || Math.floor(Math.random() * 1000),
            imageLinks: {
              thumbnail: thumbnail,
              smallThumbnail: smallThumbnail
            },
            language: book.volumeInfo?.language || 'en',
            previewLink: book.volumeInfo?.previewLink || '#',
            infoLink: book.volumeInfo?.infoLink || '#',
            image: thumbnail || smallThumbnail // Add direct image URL for backward compatibility
          },
          saleInfo: {
            country: book.saleInfo?.country || 'US',
            saleability: book.saleInfo?.saleability || 'NOT_FOR_SALE',
            isEbook: book.saleInfo?.isEbook || false,
            listPrice: book.saleInfo?.listPrice || {
              amount: Math.floor(Math.random() * 2000) + 500, // Random price between 500-2500
              currencyCode: book.saleInfo?.listPrice?.currencyCode || 'INR'
            },
            retailPrice: book.saleInfo?.retailPrice || {
              amount: Math.floor(Math.random() * 1500) + 300, // Random price between 300-1800
              currencyCode: book.saleInfo?.retailPrice?.currencyCode || 'INR'
            },
            buyLink: book.saleInfo?.buyLink || '#'
          },
          averageRating: book.volumeInfo?.averageRating || (Math.random() * 2 + 3).toFixed(1),
          ratingsCount: book.volumeInfo?.ratingsCount || 0,
          image: thumbnail || smallThumbnail || 'https://via.placeholder.com/300x450/eee/999999?text=No+Cover',
          previewLink: book.volumeInfo?.previewLink || '#',
          infoLink: book.volumeInfo?.infoLink || '#',
          saleability: book.saleInfo?.saleability || 'NOT_FOR_SALE',
          buyLink: book.saleInfo?.buyLink || '#',
          webReaderLink: book.accessInfo?.webReaderLink || '#'
        };
        
        return bookData;
      } catch (error) {
        console.error('Error processing book:', book.id, error);
        return null;
      }
    }).filter(book => book !== null); // Remove any null entries from failed processing

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

// Test endpoint to verify API key is loaded
const testApiKey = (req, res) => {
  try {
    const hasApiKey = !!GOOGLE_BOOKS_API_KEY;
    res.status(200).json({
      success: true,
      hasApiKey,
      keyLength: hasApiKey ? GOOGLE_BOOKS_API_KEY.length : 0,
      message: hasApiKey 
        ? 'API key is loaded successfully' 
        : 'API key is missing. Please check your .env file',
      // Don't expose the actual key in the response
      keyPrefix: hasApiKey ? GOOGLE_BOOKS_API_KEY.substring(0, 4) + '...' : null
    });
  } catch (error) {
    console.error('Error in testApiKey:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing API key',
      error: error.message
    });
  }
};

module.exports = { 
  fetchGoogleBooks, 
  fetchGoogleBookById,
  testApiKey
};
