// This is a service that makes API calls to the backend server for cart management

import axios from '../api/apiConfig';

// Note: The baseURL is already set to 'http://localhost:5000/api' in apiConfig.js
// So we don't need to include '/api' in the paths below

export const cartService = {
  async getCart() {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('No authentication token found');
      
      const res = await axios.get('/cart', { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      return res.data || { items: [] };
    } catch (error) {
      console.error('Error fetching cart:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  async addToCart(item) {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Please log in to add items to cart');
      
      const res = await axios.post('/cart', item, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      return res.data;
    } catch (error) {
      console.error('Error adding to cart:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      throw error;
    }
  },

  async updateCartItem(bookId, quantity) {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Please log in to update cart');
      
      const res = await axios.put(
        `/cart/${bookId}`, 
        { quantity },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      return res.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  async removeFromCart(bookId) {
    try {
      console.log('Attempting to remove item with ID:', bookId);
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Please log in to remove items from cart');
      
      console.log('Sending DELETE request to /cart/' + bookId);
      const res = await axios.delete(`/cart/${bookId}`, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
          return status < 500; // Reject only if status is greater than or equal to 500
        }
      });
      
      console.log('Remove from cart response:', {
        status: res.status,
        statusText: res.statusText,
        data: res.data
      });
      
      if (res.status >= 400) {
        throw new Error(res.data?.message || `Failed to remove item: ${res.statusText}`);
      }
      
      return res.data;
    } catch (error) {
      console.error('Error in removeFromCart service:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });
      throw error;
    }
  },

  async clearCart() {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('Please log in to clear cart');
      
      const res = await axios.delete('/cart', { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      return res.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
};