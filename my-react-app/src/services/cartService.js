// This is a mock service that simulates API calls
// In a real application, these would make actual HTTP requests to a backend server

export const cartService = {
  async getCart() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get cart from localStorage
    const cart = localStorage.getItem('bookCart');
    return cart ? { items: JSON.parse(cart) } : { items: [] };
  },

  async addToCart(item) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const cart = localStorage.getItem('bookCart');
    const items = cart ? JSON.parse(cart) : [];
    
    const existingItem = items.find(i => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      items.push(item);
    }
    
    localStorage.setItem('bookCart', JSON.stringify(items));
    return { items };
  },

  async updateCartItem(itemId, quantity) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const cart = localStorage.getItem('bookCart');
    const items = cart ? JSON.parse(cart) : [];
    
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    
    localStorage.setItem('bookCart', JSON.stringify(updatedItems));
    return { items: updatedItems };
  },

  async removeFromCart(itemId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const cart = localStorage.getItem('bookCart');
    const items = cart ? JSON.parse(cart) : [];
    
    const updatedItems = items.filter(item => item.id !== itemId);
    
    if (updatedItems.length === 0) {
      localStorage.removeItem('bookCart');
    } else {
      localStorage.setItem('bookCart', JSON.stringify(updatedItems));
    }
    
    return { items: updatedItems };
  },

  async syncCart(localCart) {
    // In a real application, this would sync the local cart with the server
    await new Promise(resolve => setTimeout(resolve, 500));
    return { items: localCart };
  }
}; 