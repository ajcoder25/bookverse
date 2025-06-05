import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Update this with your backend URL

const bookService = {
  // Search books with various filters
  async searchBooks(params) {
    try {
      const response = await axios.get(`${API_BASE_URL}/external-books/google`, {
        params: {
          q: params.query,
          category: params.category,
          startIndex: params.startIndex,
          orderBy: params.orderBy,
          filter: params.filter,
          langRestrict: params.langRestrict,
          maxResults: params.maxResults // Add maxResults parameter
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  },

  // Get book details by ID
  async getBookById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/external-books/google/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book details:', error);
      throw error;
    }
  },

  // Get featured books (you can customize the search parameters)
  async getFeaturedBooks() {
    try {
      const response = await this.searchBooks({
        category: 'fiction',
        orderBy: 'relevance',
        langRestrict: 'en'
      });
      return response;
    } catch (error) {
      console.error('Error fetching featured books:', error);
      throw error;
    }
  },

  // Get bestselling books
  async getBestsellingBooks() {
    try {
      const response = await this.searchBooks({
        orderBy: 'relevance',
        filter: 'paid-ebooks',
        langRestrict: 'en'
      });
      return response;
    } catch (error) {
      console.error('Error fetching bestselling books:', error);
      throw error;
    }
  },

  // Get new releases
  async getNewReleases() {
    try {
      const response = await this.searchBooks({
        orderBy: 'newest',
        langRestrict: 'en'
      });
      return response;
    } catch (error) {
      console.error('Error fetching new releases:', error);
      throw error;
    }
  }
};

export default bookService;