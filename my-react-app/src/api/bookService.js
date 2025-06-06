// Base URL for the backend API
const API_BASE_URL = 'http://localhost:5000/api';

// Google Books API Key - make sure to replace with your actual key
const API_KEY = 'YOUR_GOOGLE_BOOKS_API_KEY';

const bookService = {
  searchBooks: async (query, limit = 12) => {
    try {
      // Normalize the query but keep original for more accurate results
      const normalizedQuery = query.trim();
      
      // Use the external-books endpoint which is already set up in the backend
      const response = await fetch(
        `${API_BASE_URL}/external-books/google?q=${encodeURIComponent(normalizedQuery)}&maxResults=${limit}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data; // Return the full API response
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },
  
  // Quick search for autocomplete - limit to 5 results for better performance
  quickSearch: async (query) => {
    try {
      const normalizedQuery = query.trim();
      
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(normalizedQuery)}&key=${API_KEY}&maxResults=5&fields=items(id,volumeInfo(title,authors,imageLinks/smallThumbnail))`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching quick search results:', error);
      throw error;
    }
  },
  
  getFeaturedBooks: async () => {
    try {
      // For featured books, we'll use popular fiction books
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=subject:fiction+bestseller&orderBy=relevance&key=${API_KEY}&maxResults=12`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Format the response to match what the component expects
      return {
        data: {
          products: data.items ? data.items.map(book => ({
            _id: book.id,
            title: book.volumeInfo?.title || "Unknown Title",
            description: book.volumeInfo?.description 
              ? book.volumeInfo.description.substring(0, 150) + "..."
              : book.volumeInfo?.authors 
                ? `By ${book.volumeInfo.authors.join(", ")}`
                : "No description available",
            price: book.saleInfo?.retailPrice?.amount || 29.99,
            originalPrice: book.saleInfo?.listPrice?.amount || 39.99,
            image: book.volumeInfo?.imageLinks?.thumbnail || 
                  book.volumeInfo?.imageLinks?.smallThumbnail || 
                  "https://via.placeholder.com/128x192.png?text=No+Cover",
            author: book.volumeInfo?.authors ? book.volumeInfo.authors.join(", ") : "Unknown Author",
            pages: book.volumeInfo?.pageCount || "Unknown"
          })) : []
        }
      };
    } catch (error) {
      console.error('Error fetching featured books:', error);
      throw error;
    }
  },
  
  getBestsellingBooks: async () => {
    try {
      // For bestselling books, we'll use the NYT bestsellers
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=subject:bestseller&orderBy=relevance&key=${API_KEY}&maxResults=12`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Format the response to match what the component expects
      return {
        data: {
          products: data.items ? data.items.map(book => ({
            _id: book.id,
            title: book.volumeInfo?.title || "Unknown Title",
            description: book.volumeInfo?.description 
              ? book.volumeInfo.description.substring(0, 150) + "..."
              : book.volumeInfo?.authors 
                ? `By ${book.volumeInfo.authors.join(", ")}`
                : "No description available",
            price: book.saleInfo?.retailPrice?.amount || 29.99,
            originalPrice: book.saleInfo?.listPrice?.amount || 39.99,
            image: book.volumeInfo?.imageLinks?.thumbnail || 
                  book.volumeInfo?.imageLinks?.smallThumbnail || 
                  "https://via.placeholder.com/128x192.png?text=No+Cover",
            author: book.volumeInfo?.authors ? book.volumeInfo.authors.join(", ") : "Unknown Author",
            pages: book.volumeInfo?.pageCount || "Unknown"
          })) : []
        }
      };
    } catch (error) {
      console.error('Error fetching bestselling books:', error);
      throw error;
    }
  },
  
  getNewReleases: async () => {
    try {
      // For new releases, we'll use the newest books
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&orderBy=newest&key=${API_KEY}&maxResults=12`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Format the response to match what the component expects
      return {
        data: {
          products: data.items ? data.items.map(book => ({
            _id: book.id,
            title: book.volumeInfo?.title || "Unknown Title",
            description: book.volumeInfo?.description 
              ? book.volumeInfo.description.substring(0, 150) + "..."
              : book.volumeInfo?.authors 
                ? `By ${book.volumeInfo.authors.join(", ")}`
                : "No description available",
            price: book.saleInfo?.retailPrice?.amount || 29.99,
            originalPrice: book.saleInfo?.listPrice?.amount || 39.99,
            image: book.volumeInfo?.imageLinks?.thumbnail || 
                  book.volumeInfo?.imageLinks?.smallThumbnail || 
                  "https://via.placeholder.com/128x192.png?text=No+Cover",
            author: book.volumeInfo?.authors ? book.volumeInfo.authors.join(", ") : "Unknown Author",
            pages: book.volumeInfo?.pageCount || "Unknown"
          })) : []
        }
      };
    } catch (error) {
      console.error('Error fetching new releases:', error);
      throw error;
    }
  },
  
  getBooks: async () => {
    // Default to featured books if no specific category is selected
    return bookService.getFeaturedBooks();
  },
  
  getBooksByCategory: async (category) => {
    try {
      // For category-based search
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(category.toLowerCase())}&orderBy=relevance&key=${API_KEY}&maxResults=16`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Format the response to match what the component expects
      return {
        data: {
          products: data.items ? data.items.map(book => ({
            _id: book.id,
            title: book.volumeInfo?.title || "Unknown Title",
            description: book.volumeInfo?.description 
              ? book.volumeInfo.description.substring(0, 150) + "..."
              : book.volumeInfo?.authors 
                ? `By ${book.volumeInfo.authors.join(", ")}`
                : "No description available",
            price: book.saleInfo?.retailPrice?.amount || 29.99,
            originalPrice: book.saleInfo?.listPrice?.amount || 39.99,
            image: book.volumeInfo?.imageLinks?.thumbnail || 
                  book.volumeInfo?.imageLinks?.smallThumbnail || 
                  "https://via.placeholder.com/128x192.png?text=No+Cover",
            author: book.volumeInfo?.authors ? book.volumeInfo.authors.join(", ") : "Unknown Author",
            pages: book.volumeInfo?.pageCount || "Unknown",
            category: category
          })) : []
        }
      };
    } catch (error) {
      console.error(`Error fetching ${category} books:`, error);
      throw error;
    }
  }
};

export default bookService;
