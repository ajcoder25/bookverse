// Service for order-related API calls
import axios from '../api/apiConfig';

export const orderService = {
  async placeOrder(orderData) {
    const token = localStorage.getItem('userToken');
    if (!token) throw new Error('Please log in to place an order');
    const res = await axios.post('/orders', orderData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.data;
  },

  async getMyOrders() {
    const token = localStorage.getItem('userToken');
    if (!token) throw new Error('Please log in to view your orders');
    const res = await axios.get('/orders/my-orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.data;
  }
};
