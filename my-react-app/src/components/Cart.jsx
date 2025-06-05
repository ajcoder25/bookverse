import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/apiConfig';
import { cartService } from '../services/cartService';
import imageUtils from '../utils/imageUtils';


const Cart = ({ cartItems, removeFromCart, setCartItems, updateCartCount }) => {
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newAddress, setNewAddress] = useState({
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false
  });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      fetchAddresses();
    }
  }, []);

  const fetchAddresses = async () => {
    try {
      setError(null); // Clear any previous errors
      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('Please login to access your addresses');
        return;
      }

      const response = await axios.get('/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && Array.isArray(response.data)) {
        setAddresses(response.data);
        // If there's no selected address yet, set the default address or the first address
        if (!selectedAddress && response.data.length > 0) {
          const defaultAddress = response.data.find(addr => addr.isDefault);
          setSelectedAddress(defaultAddress || response.data[0]);
        }
      } else {
        throw new Error('Invalid address data received');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      if (error.response?.status === 401) {
        setError('Please login to view your addresses');
      } else {
        setError('Failed to load addresses. Please try again.');
      }
      setAddresses([]);
      setSelectedAddress(null);
    }
  };

  // Calculate subtotal
  const subtotal = cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

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

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please add a delivery address');
      return;
    }

    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const orderData = {
        items: cartItems.map(item => ({
          book: item.id,
          quantity: item.quantity,
          price: item.price,
          title: item.title
        })),
        address: selectedAddress,
        totalAmount: subtotal
      };

      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('Please log in to place an order');
        setIsLoading(false);
        sessionStorage.setItem('redirectAfterLogin', '/cart');
        setTimeout(() => {
          navigate('/auth');
        }, 1500);
        return;
      }

      const response = await axios.post('/orders', orderData);
      
      if (response.data) {
        setSuccessMessage('Order placed successfully! Thank you for your purchase!');
        
        // Clear cart in both backend and frontend
        await cartService.clearCart();
        setCartItems([]);
        updateCartCount([]);
        localStorage.removeItem('bookCart');
        
        setTimeout(() => {
          navigate('/profile?tab=orders');
        }, 2000);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setError(error.response?.data?.message || 'Error placing order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddressSelection = (address) => {
    setSelectedAddress(address);
    setShowAddressForm(false);
    setError(null); // Clear any existing errors
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {cartItems.length === 0 ? (
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
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6 flex items-start gap-4">
                    <div className="w-24 h-32 flex-shrink-0">
                      <img
                        src={item.image || imageUtils.getRandomFallbackImage()}
                        alt={item.title}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = imageUtils.getRandomFallbackImage();
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{item.title}</h3>
                      <p className="text-gray-600">{item.author}</p>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <div className="flex justify-between items-center mt-4">
                        <p className="font-medium">₹{item.price.toFixed(2)}</p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
  );
};

export default Cart;