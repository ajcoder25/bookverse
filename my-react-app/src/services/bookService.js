import axios from 'axios';

// Use environment variable for API base URL or default to Render URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bookverse-69wl.onrender.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL, // Already includes /api
  withCredentials: true, // Changed to true for CORS with credentials
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

console.log('API Base URL:', API_BASE_URL);

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('Request:', `${config.method.toUpperCase()} ${config.url}`, config.params || '');
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.config.url, response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// Generate mock books for development
const getMockBooks = () => {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `mock-book-${i}`,
    volumeInfo: {
      title: `Sample Book Title ${i + 1}`,
      authors: [`Author ${i + 1}`],
      description: `This is a sample book description for book ${i + 1}. It's a great book that you'll love to read!`,
      imageLinks: {
        thumbnail: `https://via.placeholder.com/128x196?text=Book+${i + 1}`,
        smallThumbnail: `https://via.placeholder.com/64x96?text=Book+${i + 1}`
      },
      averageRating: Math.floor(Math.random() * 2) + 3.5, // Between 3.5 and 5.5
      ratingsCount: Math.floor(Math.random() * 1000)
    },
    saleInfo: {
      listPrice: {
        amount: Math.floor(Math.random() * 2000) + 500, // 500-2500
        currencyCode: 'INR'
      },
      retailPrice: {
        amount: Math.floor(Math.random() * 1500) + 300, // 300-1800
        currencyCode: 'INR'
      },
      buyLink: '#'
    }
  }));
};

// Helper function to transform book data to a consistent format
const transformBookData = (book) => {
  // Handle both direct API response and our transformed format
  const volumeInfo = book.volumeInfo || {};
  const saleInfo = book.saleInfo || {};
  
  // Generate a unique ID if not present
  const id = book.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Handle price information
  let price = null;
  let listPrice = null;
  
  if (saleInfo.retailPrice) {
    price = {
      amount: saleInfo.retailPrice.amount || 0,
      currencyCode: saleInfo.retailPrice.currencyCode || 'USD',
    };
  } else if (saleInfo.listPrice) {
    price = {
      amount: saleInfo.listPrice.amount || 0,
      currencyCode: saleInfo.listPrice.currencyCode || 'USD',
    };
  }
  
  // If we have both list and retail price, calculate discount
  if (saleInfo.listPrice && saleInfo.retailPrice) {
    listPrice = {
      amount: saleInfo.listPrice.amount,
      currencyCode: saleInfo.listPrice.currencyCode || 'USD',
    };
  }
  
  // Ensure image links exist
  const imageLinks = volumeInfo.imageLinks || {};
  
  return {
    id,
    volumeInfo: {
      title: volumeInfo.title || 'Untitled',
      authors: volumeInfo.authors || ['Unknown Author'],
      description: volumeInfo.description || '',
      publishedDate: volumeInfo.publishedDate || '',
      publisher: volumeInfo.publisher || '',
      pageCount: volumeInfo.pageCount || 0,
      categories: volumeInfo.categories || ['Uncategorized'],
      averageRating: volumeInfo.averageRating || 0,
      ratingsCount: volumeInfo.ratingsCount || 0,
      imageLinks: {
        thumbnail: imageLinks.thumbnail || imageLinks.smallThumbnail || '',
        smallThumbnail: imageLinks.smallThumbnail || imageLinks.thumbnail || '',
      },
    },
    saleInfo: {
      saleability: saleInfo.saleability || 'NOT_FOR_SALE',
      isEbook: saleInfo.isEbook || false,
      buyLink: saleInfo.buyLink || '',
      retailPrice: price,
      listPrice: listPrice,
    },
    accessInfo: book.accessInfo || {},
    searchInfo: book.searchInfo || {},
  };
};

const bookService = {
  // Search books with various filters
  async searchBooks(query = '', maxResults = 12, startIndex = 0, options = {}) {
    try {
      console.log(`Searching books with query: ${query}, maxResults: ${maxResults}`);
      const params = {
        q: query,
        maxResults: maxResults,
        startIndex: startIndex,
        filter: options.filter || 'paid-ebooks',
        langRestrict: options.langRestrict || 'en',
        orderBy: options.orderBy || 'relevance',
        printType: 'books'
      };
      
      console.log('Making API request with params:', params);
      
      const response = await api.get('/external-books/google', { 
        params,
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });
      
      console.log('Search API response status:', response.status);
      
      if (response.status >= 400) {
        console.error('API Error:', response.status, response.data);
        throw new Error(`API Error: ${response.status} - ${response.data?.message || 'Unknown error'}`);
      }
      
      if (!response.data) {
        console.error('Empty response received from API');
        return { items: [], totalItems: 0 };
      }
      
      // The backend returns books in response.data.books
      const items = response.data.books || [];
      console.log(`Found ${items.length} items in response`);
      
      if (items.length === 0) {
        console.warn('No items found in the API response');
        return { items: [], totalItems: 0 };
      }
      
      // Transform the books to match the expected format
      const books = items.map(book => ({
        id: book.id,
        volumeInfo: {
          title: book.volumeInfo?.title || 'Unknown Title',
          authors: book.volumeInfo?.authors || ['Unknown Author'],
          description: book.volumeInfo?.description || 'No description available',
          imageLinks: {
            thumbnail: book.volumeInfo?.imageLinks?.thumbnail || book.image || '',
            smallThumbnail: book.volumeInfo?.imageLinks?.smallThumbnail || book.image || ''
          },
          categories: book.volumeInfo?.categories || [],
          averageRating: book.averageRating || book.volumeInfo?.averageRating || 0,
          ratingsCount: book.ratingsCount || book.volumeInfo?.ratingsCount || 0
        },
        saleInfo: {
          listPrice: book.saleInfo?.listPrice || { amount: 0, currencyCode: 'INR' },
          retailPrice: book.saleInfo?.retailPrice || { amount: 0, currencyCode: 'INR' },
          buyLink: book.saleInfo?.buyLink || '#'
        },
        // Add direct image URL for backward compatibility
        image: book.image || book.volumeInfo?.imageLinks?.thumbnail || ''
      }));
      
      console.log(`Successfully transformed ${books.length} books`);
      
      return {
        items: books,
        totalItems: response.data.total || books.length,
      };
    } catch (error) {
      console.error('Error searching books:', error);
      return { items: [], totalItems: 0 };
    }
  },

  // Get book details by ID
  async getBookById(id) {
    try {
      if (!id) {
        console.error('Book ID is required');
        throw new Error('Book ID is required');
      }

      console.log(`Fetching book with ID: ${id}`);
      const response = await api.get(`/books/${id}`);
      console.log('API Response:', response.data);
      
      // Handle the response structure from our updated backend
      const responseData = response.data;
      
      // Check if the response has an error status
      if (response.status >= 400) {
        console.error('API Error Status:', response.status, response.statusText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // Handle case where responseData is already the book object
      if (responseData && responseData.volumeInfo) {
        return this.transformBookData(responseData);
      }

      // Handle our custom API response format
      if (responseData.success === false) {
        console.error('API Error:', responseData.error || 'Unknown error');
        throw new Error(responseData.error || 'Failed to fetch book details');
      }

      const bookData = responseData.data?.product || responseData;
      if (!bookData) {
        console.error('No book data found in response');
        throw new Error('No book data found in response');
      }

      // Transform the book data to a consistent format
      const transformedBook = {
        ...bookData,
        _id: bookData._id || bookData.id || id,
        id: bookData.id || bookData._id || id,
        // Map Google Books API fields to our expected fields
        image: bookData.imageLinks?.thumbnail || 
              bookData.imageLinks?.smallThumbnail || 
              bookData.image || 
              'https://via.placeholder.com/300x400?text=No+Image+Available',
        price: bookData.saleInfo?.retailPrice?.amount || 
              bookData.saleInfo?.listPrice?.amount || 
              bookData.price || 
              0,
        originalPrice: bookData.saleInfo?.listPrice?.amount || bookData.originalPrice || 0,
        author: bookData.authors?.[0] || bookData.author || 'Unknown Author',
        description: bookData.description || 'No description available.',
        pages: bookData.pageCount || bookData.pages,
        publishedDate: bookData.publishedDate || 'Unknown',
        rating: bookData.averageRating || bookData.rating || 0,
        reviewCount: bookData.ratingsCount || bookData.reviewCount || 0,
        isNewRelease: bookData.isNewRelease || false,
        genre: bookData.genre || bookData.categories?.[0] || 'General',
        publisher: bookData.publisher || 'Unknown Publisher',
        language: bookData.language || 'en'
      };

      return transformedBook;
    } catch (error) {
      console.error(`Error fetching book ${id}:`, error);
      
      // Return a minimal book object with error information
      return {
        _id: id,
        id: id,
        title: 'Error Loading Book',
        author: 'Unknown Author',
        description: error.message || 'Failed to load book details. Please try again later.',
        price: 0,
        originalPrice: 0,
        rating: 0,
        reviewCount: 0,
        image: 'https://via.placeholder.com/300x400?text=Error+Loading+Book',
        genre: 'Error',
        pages: 0,
        publisher: 'Error',
        isbn: '',
        language: 'en',
        publishedDate: '',
        isNewRelease: false,
        error: true,
        errorMessage: error.message || 'Failed to load book details'
      };
    }
  },

  // Get featured books
  async getFeaturedBooks(limit = 8) {
    try {
      console.log('Fetching featured books...');
      // Search for popular books in different categories
      const response = await this.searchBooks('subject:fiction', limit, 0, {
        orderBy: 'relevance',
        filter: 'paid-ebooks',
        langRestrict: 'en',
        printType: 'books'
      });
      
      console.log('Featured books response:', response);
      
      // The searchBooks function already transforms the data, so we can return it directly
      return response?.items || [];
    } catch (error) {
      console.error('Error fetching featured books:', error);
      return [];
    }
  },

  // Get bestselling books
  async getBestsellingBooks(limit = 8) {
    try {
      const response = await this.searchBooks('subject:bestsellers', limit);
      return response.items;
    } catch (error) {
      console.error('Error fetching bestselling books:', error);
      return [];
    }
  },

  // Get new releases
  async getNewReleases(limit = 8) {
    const currentYear = new Date().getFullYear();
    try {
      const response = await this.searchBooks(`publishedDate:${currentYear}`, limit);
      return response.items;
    } catch (error) {
      console.error('Error fetching new releases:', error);
      return [];
    }
  },
  
  // Get books by category
  async getBooksByCategory(category, limit = 8) {
    try {
      const response = await this.searchBooks(
        `subject:${category}`,
        limit,
        0,
        {
          orderBy: 'relevance',
          filter: 'paid-ebooks',
          langRestrict: 'en',
          printType: 'books'
        }
      );
      
      // The searchBooks function already transforms the data, so we can return it directly
      return response?.items || [];
    } catch (error) {
      console.error(`Error fetching ${category} books:`, error);
      return [];
    }
  },
  
  // Search books with filters
  async searchBooksWithFilters(filters = {}) {
    const {
      query = '',
      category = '',
      minPrice = 0,
      maxPrice = 5000,
      minRating = 0,
      sortBy = 'relevance',
      page = 1,
      limit = 12,
    } = filters;
    
    try {
      // Build search query
      let searchQuery = query;
      if (category && category !== 'all') {
        searchQuery += ` subject:${category}`;
      }
      
      // Execute search
      const response = await this.searchBooks(
        searchQuery.trim(),
        limit,
        (page - 1) * limit
      );
      
      // Apply client-side filters that aren't supported by the API
      let filteredItems = response.items;
      
      // Filter by price
      filteredItems = filteredItems.filter(book => {
        const price = book.saleInfo?.retailPrice?.amount || 0;
        return price >= minPrice && price <= maxPrice;
      });
      
      // Filter by rating
      if (minRating > 0) {
        filteredItems = filteredItems.filter(
          book => book.volumeInfo.averageRating >= minRating
        );
      }
      
      // Sort results
      if (sortBy === 'price-asc') {
        filteredItems.sort((a, b) => 
          (a.saleInfo?.retailPrice?.amount || 0) - (b.saleInfo?.retailPrice?.amount || 0)
        );
      } else if (sortBy === 'price-desc') {
        filteredItems.sort((a, b) => 
          (b.saleInfo?.retailPrice?.amount || 0) - (a.saleInfo?.retailPrice?.amount || 0)
        );
      } else if (sortBy === 'newest') {
        filteredItems.sort((a, b) => 
          new Date(b.volumeInfo.publishedDate) - new Date(a.volumeInfo.publishedDate)
        );
      } else if (sortBy === 'rating') {
        filteredItems.sort((a, b) => 
          (b.volumeInfo.averageRating || 0) - (a.volumeInfo.averageRating || 0)
        );
      }
      
      return {
        items: filteredItems,
        totalItems: Math.min(filteredItems.length, response.totalItems),
        currentPage: page,
        totalPages: Math.ceil(response.totalItems / limit),
      };
    } catch (error) {
      console.error('Error searching books with filters:', error);
      return { items: [], totalItems: 0, currentPage: 1, totalPages: 0 };
    }
  },
};

export default bookService;