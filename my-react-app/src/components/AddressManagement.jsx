import React, { useState, useEffect } from 'react';
import { BackgroundGradient } from './ui/background-gradient';

const AddressManagement = () => {
  const [addresses, setAddresses] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Load addresses from localStorage
    const savedAddresses = localStorage.getItem('userAddresses');
    if (savedAddresses) {
      setAddresses(JSON.parse(savedAddresses));
    }
  }, []);

  useEffect(() => {
    // Save addresses to localStorage whenever they change
    localStorage.setItem('userAddresses', JSON.stringify(addresses));
  }, [addresses]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!newAddress.name || !newAddress.phone || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields.'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const updatedAddresses = [...addresses];
    
    // If this is set as default, remove default from other addresses
    if (newAddress.isDefault) {
      updatedAddresses.forEach(addr => addr.isDefault = false);
    }
    // If this is the first address, make it default
    else if (addresses.length === 0) {
      newAddress.isDefault = true;
    }

    updatedAddresses.push({
      ...newAddress,
      id: Date.now().toString()
    });

    setAddresses(updatedAddresses);
    setIsAddingNew(false);
    setNewAddress({
      name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false
    });

    setNotification({
      type: 'success',
      message: 'Address added successfully!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = (addressId) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
    
    // If we deleted the default address and there are other addresses,
    // make the first one default
    if (addresses.find(addr => addr.id === addressId)?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    setAddresses(updatedAddresses);
    setNotification({
      type: 'success',
      message: 'Address deleted successfully!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSetDefault = (addressId) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));
    setAddresses(updatedAddresses);
    setNotification({
      type: 'success',
      message: 'Default address updated!'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Addresses</h1>

      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Address List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {addresses.map((address) => (
          <BackgroundGradient key={address.id} className="bg-white rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{address.name}</h3>
                <p className="text-gray-600">{address.phone}</p>
              </div>
              {address.isDefault && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Default
                </span>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <p>{address.street}</p>
              <p>{address.city}, {address.state}</p>
              <p>PIN: {address.pincode}</p>
            </div>

            <div className="flex justify-between">
              {!address.isDefault && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Set as Default
                </button>
              )}
              <button
                onClick={() => handleDelete(address.id)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                Delete
              </button>
            </div>
          </BackgroundGradient>
        ))}
      </div>

      {/* Add New Address Button/Form */}
      <BackgroundGradient className="bg-white rounded-xl p-6">
        {isAddingNew ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Add New Address</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newAddress.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={newAddress.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="street"
                  value={newAddress.street}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={newAddress.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={newAddress.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={newAddress.pincode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={newAddress.isDefault}
                    onChange={handleInputChange}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Set as default address</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-6 py-2 border-2 border-black text-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Save Address
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingNew(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            + Add New Address
          </button>
        )}
      </BackgroundGradient>
    </div>
  );
};

export default AddressManagement;