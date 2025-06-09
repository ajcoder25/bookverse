import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/apiConfig';
import imageUtils from '../utils/imageUtils';
import { useCart } from '../context/CartContext';
import { cartService } from '../services/cartService';

// Helper function for robust cart item ID extraction
const extractCartItemId = (item) => {
  if (!item) return null;
  if (item.bookId) return item.bookId;
  if (item.id) return item.id;
  if (item._id) return item._id;
  if (item.book && typeof item.book === 'object') {
    if (item.book._id) return item.book._id;
    if (item.book.id) return item.book.id;
    if (item.book.bookId) return item.book.bookId;
  }
  if (typeof item.book === 'string' || typeof item.book === 'number') return item.book;
  return null;
};

const Cart = () => {
  const {
    cartItems,
    setCartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartCount,
    updateCart,
    clearCart,
    loading: cartLoading,
    placeOrder
  } = useCart();
  // Debug: log cartItems from context
  console.log('[Cart.jsx] cartItems from context:', cartItems);
  const navigate = useNavigate();

  const getTotal = getCartTotal; // Alias for backward compatibility
  
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
const [removingItemId, setRemovingItemId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showOrderSummary, setShowOrderSummary] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  // Debug effect for order placement
  useEffect(() => {
    console.log('orderPlaced state changed:', orderPlaced);
    console.log('orderDetails state changed:', orderDetails);
  }, [orderPlaced, orderDetails]);

  // Show order summary
  const handleShowOrderSummary = () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }
    setShowOrderSummary(true);
  };

  // Place order handler
  const handlePlaceOrder = async () => {
    console.log('handlePlaceOrder called');
    console.log('Current orderPlaced state:', orderPlaced);
    console.log('Current orderDetails:', orderDetails);
    
    if (!selectedAddress) {
      console.log('No address selected');
      setError('Please select a delivery address');
      return;
    }

    setIsLoading(true);
    setError('');
    console.log('Starting order placement...');

    try {
      // Create order payload
      const orderPayload = {
        items: cartItems.map(item => ({
          book: item.book, // backend expects 'book' not 'bookId'
          quantity: item.quantity,
          price: item.price
        })),
        address: {
          streetAddress: selectedAddress.streetAddress || selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
          phone: selectedAddress.phone
        },
        paymentMethod: 'Cash on Delivery',
        totalAmount: getCartTotal()
      };
      console.log('Order payload being sent:', orderPayload);
      console.log('Order payload being sent:', orderPayload);

      console.log('Sending order to backend:', orderPayload);
      
      // Call the placeOrder function from CartContext
      const result = await placeOrder(orderPayload);
      
      console.log('Order placed successfully:', result);
      
      // Set order details for the success modal
      setOrderDetails({
        orderId: result._id || `ORDER-${Date.now()}`,
        items: cartItems,
        total: result.totalAmount,
        date: new Date().toISOString()
      });
      
      // Show success message and clear cart
      setOrderPlaced(true);
      
      // Close the order summary modal
      setShowOrderSummary(false);
      
      // Scroll to top of the page for better visibility of the success modal
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [newAddress, setNewAddress] = useState({
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false
  });

  const fetchAddresses = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      setError('Please login to access your addresses');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await axios.get('/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setAddresses(response.data);
        // Only update selected address if we don't have one yet
        setSelectedAddress(prev => prev || response.data.find(addr => addr.isDefault) || null);
      } else {
        throw new Error('Invalid address data received');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
      setSelectedAddress(null);
      
      if (error.response?.status === 401) {
        setError('Please login to view your addresses');
      } else {
        setError('Failed to load addresses. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Calculate subtotal
  const subtotal = getTotal();

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/addresses', newAddress);
      setSelectedAddress(response.data);
      setShowAddressForm(false);
      setNewAddress({
        streetAddress: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: false
      });
      setSuccessMessage('Address saved successfully!');
      fetchAddresses(); // Refresh addresses list
    } catch (error) {
      console.error('Error saving address:', error);
      setError(error.response?.data?.message || 'Error saving address');
    } finally {
      setIsLoading(false);
    }
  };


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => {
      const newValue = type === 'checkbox' ? checked : value;
      // Clear any error when user starts typing
      if (error) setError('');
      return {
        ...prev,
        [name]: newValue
      };
    });
  };

  const handleAddressSelection = (address) => {
    setSelectedAddress(address);
    setShowAddressForm(false);
    setError(null); // Clear any existing errors
  };

  // Show loading state
  if (cartLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Loading Cart...</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 container mx-auto px-2 py-4 sm:px-4 sm:py-8">
        <h2 className="text-2xl font-bold mb-4 sm:mb-6">Shopping Cart</h2>
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {!cartItems || cartItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xl text-gray-600 mb-6">Your cart is empty</p>
            <button
              onClick={() => navigate('/')}
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {cartItems && cartItems.length > 0 ? cartItems.map((item, index) => (
                    <div key={item.bookId || item.id || item._id || index} className="p-6 flex items-start gap-4">
                      <div className="w-24 h-32 flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = imageUtils.getRandomFallbackImage();
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{item.title}</h3>
                      <p className="text-gray-600">{item.author}</p>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={async () => {
                              setIsLoading(true);
                              setError(null);
                              const id = extractCartItemId(item);
                              if (!id) {
                                setError('Unable to update quantity: No valid book ID.');
                                setIsLoading(false);
                                return;
                              }
                              const result = await updateQuantity(id, Math.max(1, item.quantity - 1));
                              if (!result.success) setError(result.error || 'Failed to update quantity');
                              setIsLoading(false);
                            }}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-60"
                            disabled={isLoading || item.quantity <= 1}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button 
                            onClick={async () => {
                              setIsLoading(true);
                              setError(null);
                              const id = extractCartItemId(item);
                              if (!id) {
                                setError('Unable to update quantity: No valid book ID.');
                                setIsLoading(false);
                                return;
                              }
                              const result = await updateQuantity(id, item.quantity + 1);
                              if (!result.success) setError(result.error || 'Failed to update quantity');
                              setIsLoading(false);
                            }}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-60"
                            disabled={isLoading}
                          >
                            +
                          </button>
                        </div>
                        <div className="flex items-center space-x-4">
                          <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                          <button
                            onClick={async () => {
                              setError(null);
                              setSuccessMessage('');
                              const itemIdToRemove = (
                                item.bookId || item.id || item._id ||
                                (typeof item.book === "string" ? item.book : (item.book?._id || item.book?.id || item.book?.bookId))
                              );
                              setRemovingItemId(itemIdToRemove);
                              try {
                                if (!itemIdToRemove) {
                                  throw new Error('Cannot remove item: No valid ID found in the item');
                                }
                                // Try to remove the item
                                const result = await removeFromCart(itemIdToRemove);
                                if (result && result.success) {
                                  setSuccessMessage('Item removed from cart.');
                                } else if (result && result.requiresRefresh) {
                                  setError('Item removed. Refreshing cart...');
                                } else {
                                  throw new Error(result?.error || 'Failed to remove item. Please try again.');
                                }
                              } catch (error) {
                                console.error('Error in remove handler:', error);
                                setError(error.message || 'Failed to remove item.');
                              } finally {
                                setRemovingItemId(null);
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            disabled={isLoading || removingItemId === (item.bookId || item.id || item._id || (typeof item.book === "string" ? item.book : (item.book?._id || item.book?.id || item.book?.bookId)))}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                      </div>
                    )) : (
                      <div className="p-6 text-center">
                        <p className="text-gray-600">No items in cart</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary and Address Section */}
              <div className="lg:w-1/3">
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                  <h2 className="text-xl font-semibold">Delivery Details</h2>
              
              <div className="space-y-6">
                {!selectedAddress && !showAddressForm && (
                  <div>
                    {addresses.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="font-medium">Select a delivery address:</h3>
                        {addresses.map(address => (
                          <div
                            key={address._id}
                            className={`p-4 border rounded-lg ${
                              selectedAddress?._id === address._id 
                              ? 'border-black' 
                              : 'border-gray-200'
                            } cursor-pointer hover:border-black`}
                            onClick={() => handleAddressSelection(address)}
                          >
                            <p className="font-medium">{address.streetAddress}</p>
                            <p className="text-sm text-gray-600">
                              {[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}
                            </p>
                            <p className="text-sm text-gray-600">{address.country}</p>
                            {address.isDefault && (
                              <span className="text-xs bg-gray-100 px-2 py-1 mt-2 inline-block rounded">
                                Default
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="w-full py-3 px-4 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                        Add New Address
                      </button>
                    )}
                  </div>
                )}
                
                {showAddressForm ? (
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Street Address</label>
                      <input
                        type="text"
                        name="streetAddress"
                        value={newAddress.streetAddress}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    
                    {/* City and State */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <input
                          type="text"
                          name="city"
                          value={newAddress.city}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">State</label>
                        <input
                          type="text"
                          name="state"
                          value={newAddress.state}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Postal Code and Country */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={newAddress.postalCode}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={newAddress.country}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isDefault"
                          checked={newAddress.isDefault}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Set as default address
                        </label>
                      </div>
                      {selectedAddress && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-3 px-4 rounded-md text-white ${
                        isLoading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'
                      }`}
                    >
                      {isLoading ? 'Saving...' : 'Save Address'}
                    </button>
                  </form>
                ) : (
                  selectedAddress && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Delivery Address</h3>
                        <div className="p-4 border rounded-lg border-gray-200">
                          <p className="font-medium">{selectedAddress.streetAddress}</p>
                          <p className="text-sm text-gray-600">
                            {[
                              selectedAddress.city,
                              selectedAddress.state,
                              selectedAddress.postalCode
                            ].filter(Boolean).join(', ')}
                          </p>
                          <p className="text-sm text-gray-600">{selectedAddress.country}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAddress(null);
                            setShowAddressForm(true);
                          }}
                          className="mt-4 text-blue-600 hover:text-blue-800"
                        >
                          Change Address
                        </button>
                      </div>

                      <div>
                        <div className="flex justify-between text-lg font-medium mb-4">
                          <span>Total Amount:</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={handleShowOrderSummary}
                          disabled={isLoading}
                          className={`w-full py-3 px-4 rounded-md text-white ${
                            isLoading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'
                          }`}
                        >
                          {isLoading ? 'Processing...' : 'Place Order'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Order Summary Modal */}
      {showOrderSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Order Summary</h3>
                <button 
                  onClick={() => setShowOrderSummary(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Order Items */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">Order Items ({cartItems.length})</h4>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div key={item.bookId || item.id || item._id} className="flex items-center p-3 border-b">
                      <img 
                        src={item.image || imageUtils.getRandomFallbackImage()} 
                        alt={item.title}
                        className="w-16 h-20 object-cover rounded"
                        onError={(e) => {
                          e.target.src = imageUtils.getRandomFallbackImage();
                        }}
                      />
                      <div className="ml-4 flex-1">
                        <h5 className="font-medium">{item.title}</h5>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Delivery Address */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Delivery Address</h4>
                {selectedAddress && (
                  <div>
                    <p className="font-medium">{selectedAddress.streetAddress}</p>
                    <p className="text-sm text-gray-600">
                      {[selectedAddress.city, selectedAddress.state, selectedAddress.postalCode].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-sm text-gray-600">{selectedAddress.country}</p>
                    {selectedAddress.phone && (
                      <p className="text-sm text-gray-600 mt-1">Phone: {selectedAddress.phone}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Order Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>₹{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Shipping:</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t">
                  <span>Total:</span>
                  <span>₹{getCartTotal().toFixed(2)}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowOrderSummary(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Back to Cart
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isLoading}
                  className={`px-6 py-2 rounded-md text-white ${
                    isLoading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'
                  }`}
                >
                  {isLoading ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Order Success Modal */}
      {orderPlaced && orderDetails && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[1000] p-4 overflow-y-auto pt-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-xl max-w-4xl w-full my-8 overflow-hidden shadow-2xl transform transition-all duration-300 ease-in-out">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 transform transition-transform duration-300 hover:scale-110">
                  <svg 
                    className="w-14 h-14 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 20 20" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Order Confirmed! 🎉</h2>
                <p className="text-white text-opacity-90">Thank you for your purchase!</p>
                <p className="text-sm text-white text-opacity-80 mt-2 bg-black bg-opacity-10 px-3 py-1 rounded-full">
                  Order #{orderDetails.orderId}
                </p>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="p-6 md:p-8 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Order Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Order Details</h3>
                  </div>
                  <div className="space-y-3 pl-11">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-medium text-gray-900">{orderDetails.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-800">
                        {new Date().toLocaleDateString('en-IN', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-lg text-gray-900">₹{orderDetails.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx={4} cy={4} r={3} />
                        </svg>
                        Cash on Delivery
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Confirmed
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Delivery Address */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Delivery Address</h3>
                  </div>
                  {selectedAddress && (
                    <div className="space-y-2 pl-11">
                      <p className="font-medium text-gray-900">{selectedAddress.fullName || 'John Doe'}</p>
                      <p className="text-gray-600">{selectedAddress.streetAddress}</p>
                      <p className="text-gray-600">
                        {[selectedAddress.city, selectedAddress.state, selectedAddress.postalCode].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-gray-600">{selectedAddress.country}</p>
                      {selectedAddress.phone && (
                        <div className="flex items-center mt-3 text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {selectedAddress.phone}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order Items */}
              <div className="mt-10">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-2 rounded-full mr-3">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Order Items ({orderDetails.items.length})</h3>
                </div>
                <div className="space-y-4 pl-11">
                  {orderDetails.items.slice(0, 3).map((item, index) => (
                    <div key={item.bookId || item.id || item._id} className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                      <div className="relative w-20 h-24 flex-shrink-0">
                        <img 
                          src={item.image || imageUtils.getRandomFallbackImage()}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = imageUtils.getRandomFallbackImage();
                          }}
                        />
                        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="font-medium text-gray-900 line-clamp-1">{item.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{item.author || 'Unknown Author'}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                          {item.quantity > 1 && (
                            <span className="text-xs text-gray-500">
                              {item.quantity} × ₹{item.price.toFixed(2)} each
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {orderDetails.items.length > 3 && (
                    <div className="text-center py-3">
                      <p className="inline-flex items-center text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {orderDetails.items.length - 3} more items in your order
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>
                </div>
                <div className="space-y-3 pl-11">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({orderDetails.items.length} {orderDetails.items.length === 1 ? 'item' : 'items'})</span>
                    <span className="text-gray-900 font-medium">₹{orderDetails.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">₹{orderDetails.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Inclusive of all taxes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="mt-10 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-full mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">What happens next?</h4>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  We've sent an order confirmation to your email. You'll receive a shipping confirmation 
                  email with tracking information once your order is on its way.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href="/orders" 
                    className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    View Order Status
                  </a>
                  <a 
                    href="/contact" 
                    className="inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-5 border-t border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-gray-500 text-center md:text-left mb-4 md:mb-0">
                  Need help with anything? <a href="/help" className="text-indigo-600 hover:text-indigo-500 font-medium">Visit our help center</a>
                </p>
                <div className="flex items-center justify-center space-x-6">
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between">
                <button
                  onClick={() => {
                    setOrderPlaced(false);
                    navigate('/');
                  }}
                  className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Continue Shopping
                </button>
                <div className="mt-4 md:mt-0 text-center md:text-right">
                  <p className="text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} BookVerse. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;