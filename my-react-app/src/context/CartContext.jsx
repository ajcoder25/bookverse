import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';

const CartContext = createContext({
  cartItems: [],
  isCartOpen: false,
  loading: false,
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  toggleCart: () => {},
  getCartTotal: () => 0,
  getCartCount: () => 0,
  placeOrder: async () => {},
});

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Toggle cart open/close
  const toggleCart = () => {
    setIsCartOpen(prev => !prev);
  };

  // Fetch cart from backend on mount and when cart changes
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cartService.getCart();
      // Only update if we got a valid response
      if (data && Array.isArray(data.items)) {
        setCartItems(data.items);
      } else {
        console.error('Invalid cart data received:', data);
        setCartItems([]);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      // Don't clear cart on error, keep current state
      // Optionally, set a global error state or show a notification
      // But always allow the provider to render its children
      // This prevents the provider from breaking the app
      // You can add more robust error handling here if needed
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Place order
  const placeOrder = async (orderData) => {
    if (!cartItems.length) throw new Error('Cart is empty');
    if (!orderData) throw new Error('Order data is required');
    
    try {
      // Make sure we have all required fields
      if (!orderData.items || !orderData.address) {
        throw new Error('Invalid order data');
      }
      
      // Add user ID to the order data
      const token = localStorage.getItem('userToken');
      if (!token) throw new Error('User not authenticated');
      
      // Log the order data for debugging
      console.log('Placing order with data:', orderData);
      
      // Call the order service to place the order
      const response = await orderService.placeOrder(orderData);
      
      // Clear the cart after successful order
      await clearCart();
      
      // Return the order confirmation
      return response;
    } catch (error) {
      console.error('Error in placeOrder:', error);
      throw error; // Re-throw to be handled by the component
    }
  };

  // Add to cart with optimistic UI updates and proper sync
  const addToCart = async (item) => {
    console.log('[CartContext] addToCart called with:', item);
    if (!item.bookId && !item.id && !item._id) {
      throw new Error('Book ID is required');
    }
    if (!item.price) {
      throw new Error('Price is required');
    }
    if (!item.title) {
      throw new Error('Title is required');
    }

    const bookId = item.bookId || item.id || item._id;
    const bookToSend = {
      bookId,
      quantity: item.quantity || 1,
      price: item.price,
      title: item.title,
      author: item.author || 'Unknown Author',
      image: item.image || ''
    };
    console.log('[CartContext] Sending to backend:', bookToSend);

    // Save current state for potential rollback
    const previousItems = [...cartItems];
    
    // Optimistic update: Update UI immediately
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        (item.id === bookId || item._id === bookId || item.bookId === bookId)
      );
      
      if (existingItem) {
        // Update quantity if item exists
        return prevItems.map(item =>
          (item.id === bookId || item._id === bookId || item.bookId === bookId)
            ? { ...item, quantity: (item.quantity || 1) + (bookToSend.quantity || 1) }
            : item
        );
      } else {
        // Add new item
        return [...prevItems, { ...bookToSend, id: bookId }];
      }
    });

    try {
      // Make the actual API call
      await cartService.addToCart(bookToSend);
      
      // Get fresh cart data from server
      const freshCart = await cartService.getCart();
      const freshItems = Array.isArray(freshCart?.items) ? freshCart.items : [];
      
      // Update with server state to ensure consistency
      setCartItems(freshItems);
      
      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Revert to previous state on error
      setCartItems(previousItems);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to add item to cart' 
      };
    }
  };

  // Helper function to normalize and compare item IDs
  const normalizeId = (id) => {
    if (!id) return null;
    return String(id).trim();
  };

  // Helper to extract all possible IDs from a cart item
  const extractAllIds = (item) => {
    const ids = [];
    if (item.bookId) ids.push(normalizeId(item.bookId));
    if (item.id) ids.push(normalizeId(item.id));
    if (item._id) ids.push(normalizeId(item._id));
    if (typeof item.book === 'string' || typeof item.book === 'number') ids.push(normalizeId(item.book));
    if (item.book && typeof item.book === 'object') {
      if (item.book._id) ids.push(normalizeId(item.book._id));
      if (item.book.id) ids.push(normalizeId(item.book.id));
      if (item.book.bookId) ids.push(normalizeId(item.book.bookId));
    }
    return ids;
  };

  // Remove from cart with proper state management
  const removeFromCart = async (bookId) => {
    if (!bookId) {
      const errorMsg = 'No book ID provided for removal';
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const normalizedBookId = normalizeId(bookId);
    console.log('removeFromCart called with bookId:', normalizedBookId);
    
    // Save current items for potential rollback
    const previousItems = [...cartItems];
    
    // Find the item being removed for better error handling
    const itemToRemove = cartItems.find(item => {
  const ids = extractAllIds(item);
  return ids.includes(normalizedBookId);
});

    if (!itemToRemove) {
      const errorMsg = `Item with ID ${normalizedBookId} not found in cart. Current cart items: ${JSON.stringify(
        cartItems.map(item => ({
          id: item._id || item.id,
          bookId: item.bookId,
          book: item.book ? {
            _id: item.book._id,
            id: item.book.id,
            bookId: item.book.bookId
          } : null
        })), null, 2
      )}`;
      console.error(errorMsg);
      return { success: false, error: 'Item not found in cart. Please refresh the page and try again.' };
    }


    // Optimistically remove the item from local state
    const updatedItems = cartItems.filter(item => {
      try {
        const ids = extractAllIds(item);
        return !ids.includes(normalizedBookId);
      } catch (error) {
        console.error('Error normalizing item ID during removal:', { item, error });
        return true; // Keep the item in case of error during normalization
      }
    });
    
    // Update local state optimistically
    setCartItems(updatedItems);

    try {
      console.log('Attempting to remove item from server:', {
        bookId: normalizedBookId,
        item: itemToRemove
      });
      
      // Call backend to remove the item
      const response = await cartService.removeFromCart(normalizedBookId);
      
      if (response && response.error) {
        throw new Error(response.error);
      }
      
      console.log('Successfully removed item from server');
      return { success: true };
      
    } catch (error) {
      console.error('Error removing from cart:', {
        bookId: normalizedBookId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        item: itemToRemove
      });
      
      // Revert to previous state on error
      setCartItems(previousItems);
      
      // Return more detailed error information
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Failed to remove item from cart',
        requiresRefresh: true,
        details: error.response?.data
      };
    }
  };

  // Update quantity with optimistic UI and proper sync
  const updateQuantity = async (bookId, newQuantity) => {
    if (newQuantity < 1) return { success: false, error: 'Quantity must be at least 1' };
    if (!bookId) return { success: false, error: 'No book ID provided' };
    
    // Save current state for potential rollback
    const previousItems = [...cartItems];
    
    // Optimistic update
    setCartItems(prevItems => 
      prevItems.map(item => 
        (item.id === bookId || item._id === bookId || item.bookId === bookId)
          ? { ...item, quantity: newQuantity }
          : item
      )
    );

    try {
      // Update on server
      await cartService.updateCartItem(bookId, newQuantity);
      
      // Get fresh cart data from server
      const freshCart = await cartService.getCart();
      const freshItems = Array.isArray(freshCart?.items) ? freshCart.items : [];
      
      // Update with server state to ensure consistency
      setCartItems(freshItems);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating cart:', error);
      // Revert on error
      setCartItems(previousItems);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to update quantity'
      };
    }
  };

  // Clear cart (backend)
  const clearCart = async () => {
    await cartService.clearCart();
    setCartItems([]);
  };

  // Cart total
  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate cart count
  const getCartCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + (item.quantity || 1), 0);
  }, [cartItems]);

  // Calculate cart total
  const getCartTotal = useCallback(() => {
    return cartItems.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 1),
      0
    );
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems, // Expose setCartItems
        isCartOpen,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        getCartTotal,
        getCartCount,
        placeOrder, // Expose placeOrder
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
