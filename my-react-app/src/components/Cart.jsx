import React, { useState, useEffect, useCallback } from 'react';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
import axios from '../api/apiConfig';
import imageUtils from '../utils/imageUtils';
import { useCart } from '../context/CartContext';
import { cartService } from '../services/cartService';

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

  // Place order handler
  const handlePlaceOrder = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      if (!selectedAddress) throw new Error('Please select a delivery address.');
      const result = await placeOrder(selectedAddress);
      clearCart();
      setSuccessMessage('Order placed successfully! You can track it in your profile.');
    } catch (error) {
      setError(error.message || 'Failed to place order.');
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
      {(!cartItems || cartItems.length === 0) ? (
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
                            onClick={() => updateQuantity(item.bookId || item.id || item._id, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                            disabled={isLoading}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.bookId || item.id || item._id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
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
                          onClick={handlePlaceOrder}
                          disabled={isLoading}
                          className={`w-full py-3 px-4 rounded-md text-white ${
                            isLoading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'
                          }`}
                        >
                          {isLoading ? 'Placing Order...' : 'Place Order'}
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* Place order button moved above */}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      <Footer />
    </div>
  );
};

export default Cart;